# mTLS PoP — Cross-SDK Implementation Standard (MSI Focus)

> **Audience:** Azure SDK team and MSAL maintainers.  
> **Purpose:** Document the mTLS Proof-of-Possession implementation standard for the Managed Identity path across all MSAL SDKs — covering API changes, key and attestation models, token acquisition, and downstream resource calls. The SNI/Confidential Client path is covered in [Appendix B](#appendix-b--sni--confidential-client-path).

## Two implementation dimensions

Before diving in, two independent axes shape how the MSI mTLS PoP flow behaves:

**Axis 1 — Key model:**

- **Software / exportable keys** *(roadmap — not yet supported by Entra STS today)*: MSAL generates a software RSA key; key material can be exported as PEM bytes. This is the simpler scenario — no attestation required, and downstream BYO HTTP client is **possible** for all SDKs.
- **KeyGuard / VBS-protected keys** *(current implementation)*: MSAL generates a key inside Windows Virtualization-Based Security (VBS) KeyGuard. The key material is **never** accessible outside CNG (`NCryptSignHash` only). This is the complex scenario — attestation may be required, and downstream BYO HTTP client is **not possible** for most SDKs.

**Axis 2 — Attestation:**

- **No attestation** *(simple)*: token request proceeds without MAA attestation. This is the roadmap direction for the software key scenario.
- **MAA attestation** *(complex)*: token request includes a hardware attestation payload signed by the VBS enclave. Requires a native `AttestationClientLib.dll` (or equivalent) distributed separately from the MSAL package.

> **Critical**: Downstream transport feasibility depends on the **key model**, not on attestation. A KeyGuard key cannot be used with standard BYO HTTP clients regardless of whether attestation is enabled.

---

## Part 1 — API Changes

### Enabling mTLS PoP

Each MSAL SDK exposes a way to signal that mTLS PoP should be used. Current per-SDK API:

| SDK | API |
|---|---|
| **msal-dotnet** | `.WithMtlsProofOfPossession()` on `AcquireTokenForManagedIdentity()` |
| **msal-go** | Use `MtlsClient` type instead of standard `ManagedIdentityClient` |
| **msal-java** | Use `MtlsMsiClient` type |
| **msal-node** | `authenticationScheme: AuthenticationScheme.MTLS_POP` in `acquireTokenForClient()` params |
| **msal-python** | TBD |

### Enabling Attestation

| SDK | API | Native dependency |
|---|---|---|
| **msal-dotnet** | `.WithAttestation()` | `AttestationClientLib.dll` |
| **msal-go** | TBD | TBD |
| **msal-java** | TBD | TBD |
| **msal-node** | Not yet implemented (planned for `msal-node-mtls-extensions` package) | `AttestationClientLib.dll` + `msal_mtls_win.node` |
| **msal-python** | TBD | TBD |

The attestation native dependency must be placed alongside the MSAL native addon (e.g., `bin/win-x64/`). Automating placement via a NuGet download script at build time is tracked as a follow-up for the extensions packages.

### HTTP Client Injection

A key architectural change for mTLS PoP: MSAL must control (or be injected with) the HTTP client used for the token request, because it must present the client certificate during the TLS handshake with the STS.

| SDK | Injection model | For mTLS PoP |
|---|---|---|
| **msal-dotnet** | `IMsalHttpClientFactory` | `HttpClientHandler.ClientCertificates.Add(cert)` before factory is passed to MSAL |
| **msal-go** | `http.Client` in `CommManager` | `comm.NewMtlsHTTPClient(cert)` provides a pre-configured client |
| **msal-java** | Internal — no BYO HTTP client for mTLS PoP MSI | N/A; `MtlsMsiClient` uses JNA→`ncrypt.dll` internally |
| **msal-node** | `system.networkClient: INetworkModule` | Inject `new MtlsHttpClient(cert, key)` — **replaces** the default `HttpClient` for all MSAL requests on this app instance |
| **msal-python** | TBD | TBD |

For msal-node, this is a significant departure from the standard flow. `MtlsHttpClient` is a dedicated `INetworkModule` implementation that creates a persistent `https.Agent` with the client certificate pre-configured. It replaces the standard HTTP client for the entire application instance:

```typescript
import { ConfidentialClientApplication, AuthenticationScheme } from "@azure/msal-node";
import { MtlsHttpClient } from "@azure/msal-node";

const app = new ConfidentialClientApplication({
    auth: {
        clientId: "...",
        authority: "https://mtlsauth.microsoft.com/<tenant-id>",
        clientCertificate: { thumbprintSha256, privateKey, x5c },
    },
    system: {
        networkClient: new MtlsHttpClient(x5c, privateKey), // ← replaces default HTTP client
    },
});

const result = await app.acquireTokenByClientCredential({
    scopes: ["https://vault.azure.net/.default"],
    authenticationScheme: AuthenticationScheme.MTLS_POP,
});
```

### Token Acquisition Result

| Field | Type | Meaning |
|---|---|---|
| `tokenType` / `token_type` | `"mtls_pop"` | Indicates the access token must be presented over an mTLS connection |
| `bindingCertificate` | `string` (PEM) or SDK-native cert object | The public X.509 certificate bound to the token; used for downstream resource calls |

The binding certificate (`AuthenticationResult.BindingCertificate` in msal-dotnet; `bindingCertificate` in msal-node) contains only the public certificate — **the private key is never surfaced in `AuthenticationResult`**. For Path 1 (SNI/CCA), the developer already holds the private key. For Path 2 (MSI), the key is non-exportable and stays in CNG.

### GetSource() — See [Appendix C](#appendix-c--getsource)

`GetSource()` / `getSource()` returns the token source (cache vs. STS). Detailed cross-SDK treatment is deferred to Appendix C as it would add significant scope here.

---

## Part 2 — AuthResult Fields by SDK

| SDK | Field name | Type |
|---|---|---|
| **msal-dotnet** | `AuthenticationResult.BindingCertificate` | `X509Certificate2` |
| **msal-go** | `AuthResult.BindingCertificate` + `AuthResult.BindingTLSCertificate` | `*x509.Certificate` + `*tls.Certificate` (with `PrivateKey` as `crypto.Signer`) |
| **msal-java** | `IAuthenticationResult.bindingCertificate()` | `X509Certificate` |
| **msal-node** | `AuthenticationResult.bindingCertificate` | PEM `string` |
| **msal-python** | TBD | TBD |

All SDKs set `tokenType` / `token_type` to `"mtls_pop"`.

**Authorization header:** All SDKs use `Authorization: mtls_pop <access_token>` for downstream resource calls. msal-dotnet provides `result.CreateAuthorizationHeader()`; other SDKs require manual construction.

---

## Part 3 — Downstream mTLS Calls: The Core Problem

### Why BYO HTTP clients fail with non-exportable keys

After acquiring an mTLS PoP token, the developer must make downstream resource calls **over mTLS using the same binding certificate**. This is where the key model critically matters.

Any TLS stack performing a client certificate handshake must have access to raw private key material to sign the `CertificateVerify` message in the TLS exchange. When the private key is stored in Windows KeyGuard (VBS-protected), the CNG key storage provider rejects all export operations:

- **Windows CNG**: `NCryptExportKey()` → `NTE_NOT_SUPPORTED` for KeyGuard keys
- **.NET**: `RSACng.ExportPkcs8PrivateKey()` → `CryptographicException` (`NTE_NOT_SUPPORTED`)
- **Node.js / OpenSSL**: `https.Agent` feeds TLS handshakes through OpenSSL, which requires raw PKCS#8/PKCS#1 key bytes and has no path to a CNG key handle

**Verified in manual testing** (Node.js, Windows 11): A certificate imported into the Windows certificate store (`Cert:\CurrentUser\My`) **without** the `-Exportable` flag cannot be used with `https.Agent`. The TLS handshake fails because OpenSSL cannot access the CNG provider. The same certificate imported **with** `-Exportable` works correctly — Node.js can extract the raw key bytes via `ExportPkcs8PrivateKey()` and pass them to OpenSSL.

**Why WinHTTP / Schannel / Schannel-backed SDKs work regardless**: WinHTTP and Schannel are native Windows TLS stacks that operate through CNG's `NCryptSignHash()` API. This API accepts a key *handle* and performs the signing operation entirely inside CNG — no key bytes are ever exported. That is why MSALs using WinHTTP (msal-node's N-API addon) or Schannel (.NET's `HttpClientHandler`) work even with non-exportable KeyGuard keys. Go's `crypto.Signer` interface achieves the same result by wrapping the CNG key handle in a Go signing interface rather than extracting bytes.

### Key exportability by scenario

| Scenario | Key type | Exportable? | BYO HTTP client possible? |
|---|---|---|---|
| **MSI — KeyGuard (current implementation)** | VBS RSA 2048 (`NCryptSignHash` only) | ❌ Non-exportable | ❌ Not possible |
| **MSI — software keys (roadmap)** | Software RSA | ✅ Exportable as PEM | ✅ Yes — for all SDKs |
| **SNI / Confidential Client (Path 1)** | Developer-provided | Depends on import flags | ✅ Yes — developer holds the key directly |

### Per-SDK current state (KeyGuard path)

| SDK | TLS stack for MSI token request | BYO HTTP client for downstream (KeyGuard scenario)? | SDK-provided mTLS transport |
|---|---|---|---|
| **msal-dotnet** | Schannel | ✅ Yes — Schannel uses CNG key handle via `NCryptSignHash`; `HttpClientHandler.ClientCertificates.Add(result.BindingCertificate)` | None needed |
| **msal-go** | `crypto/tls` (Go stdlib) | ✅ Yes — `result.BindingTLSCertificate` contains a `crypto.Signer` backed by CNG; use in `tls.Config` on any `http.Client` | `comm.NewMtlsHTTPClient()` (convenience) |
| **msal-java** | JSSE + JNA → `ncrypt.dll` | ❌ **Not possible** — JSSE requires exportable key material; no `KeyStore`/`Signer` bridge to CNG is available | `MtlsMsiClient.httpRequest()` |
| **msal-node** | WinHTTP + Schannel (N-API addon) | ❌ **Not possible** — Node.js/OpenSSL needs raw key bytes; CNG refuses export for KeyGuard keys | `app.sendGetRequestAsync()` / `app.sendPostRequestAsync()` |
| **msal-python** | WinHTTP + Schannel (ctypes) | ❌ **Not possible** — same CNG constraint | ❌ **Not yet implemented** |

> **Default stance for msal-java, msal-node, msal-python**: With the current KeyGuard architecture, downstream BYO HTTP client use is **not possible**. This is a fundamental architectural constraint — the key cannot be extracted from CNG. SDK-provided transports are the only workaround where available; for msal-python, no downstream helper exists yet.

---

## Part 4 — Path Forward: Software Key Pivot

The software key pivot (direction indicated by the mTLS PoP architect) resolves the downstream constraint universally. With software/exportable keys:

- MSAL generates a software RSA key (no KeyGuard, no attestation required)
- Key material is extractable as PEM bytes
- `AuthenticationResult` can include both the binding certificate and the exportable private key
- Azure SDK configures its own HTTP client: `{ cert: result.bindingCertificate, key: result.bindingKey }` — consistent across all SDKs
- MSAL's built-in transport helpers become optional convenience wrappers rather than mandatory requirements
- `AttestationClientLib.dll` and native attestation dependencies are not required

**Current status**: Entra STS does not yet accept mTLS PoP token requests with software (non-KeyGuard) keys. This is on the roadmap. Until that pivot lands, **use MSAL's SDK-provided transport for downstream calls on msal-java, msal-node, and msal-python**, and BYO HTTP client on msal-dotnet and msal-go.

---

## Appendix A — Options for Non-Exportable Key Scenarios in Node.js

For situations where a developer has a certificate with a non-exportable CNG private key and needs to use it for Path 1 (SNI/CCA) or a future software-key MSI path in Node.js, the following options exist. All are workarounds — Node.js's OpenSSL-based TLS has no native CNG bridge:

| Option | Description | Feasibility |
|---|---|---|
| **1. WinHTTP N-API addon** (reuse Path 2 approach) | Use the same N-API addon from `msal-node-mtls-extensions` for the Path 1 token request TLS handshake | **Best option** — addon already exists; CNG key handle used via `NCryptSignHash` directly, no export needed |
| **2. OpenSSL CNG engine / provider** | Load an OpenSSL CNG engine (`cng.dll`) or OpenSSL 3.x provider that proxies signing to CNG | Complex; `ENGINE` API deprecated in OpenSSL 3.x; `cng.dll` not widely distributed |
| **3. PKCS#11 native addon** | Bridge CNG key through a PKCS#11 interface and use a Node.js PKCS#11 binding for TLS | Possible; adds a native dependency; requires non-trivial PKCS#11 module configuration |
| **4. .NET subprocess** | Delegate the TLS handshake signing to a .NET subprocess that has CNG access | Highly impractical; significant latency and IPC complexity per request |
| **5. @peculiar/webcrypto + signing callback** | Use `@peculiar/webcrypto` with a custom CNG-backed `CryptoKey` | Experimental; library does not expose non-exportable CNG keys out of the box |
| **6. Schannel N-API addon (new)** | Build a dedicated N-API addon wrapping Schannel's client-cert TLS for Node.js | Significant engineering effort; would definitively solve the problem but requires new native code |

**Recommendation**: Option 1 (WinHTTP N-API addon) is the most practical path as the addon already exists in the codebase and natively handles non-exportable CNG keys.

---

## Appendix B — SNI / Confidential Client Path

### Certificate input formats

How developers provide their certificate to MSAL for the SNI/CCA path today:

| SDK | Accepted formats | Notes |
|---|---|---|
| **msal-dotnet** | `X509Certificate2` object | Developer loads from cert store, PFX, or PEM file before passing to MSAL |
| **msal-go** | PEM bytes (CERTIFICATE + PRIVATE KEY blocks, PKCS#1 or PKCS#8) | `CertFromPEM(data, password)` → `[]*x509.Certificate + crypto.PrivateKey` |
| **msal-java** | PKCS#12 stream + passphrase, or `PrivateKey + X509Certificate` object, or cert chain | `ClientCredentialFactory.createFromCertificate(...)` |
| **msal-node** | PEM strings: `{ thumbprintSha256, privateKey, x5c }` | `clientCertificate` in config; `privateKey` accepts PEM `string` or `node:crypto` `KeyObject` |
| **msal-python** | PFX file path + passphrase, or PEM strings: `{ private_key, public_certificate, thumbprint }` | `client_credential` dict in `ConfidentialClientApplication` |

**Path 2 (MSI):** No certificate input from the developer. MSAL generates the key and calls IMDS `/issuecredential` to obtain the binding certificate.

### Standard for mTLS PoP certificate input

To enable mTLS PoP across SDKs, all MSALs should accept the following certificate input formats:

| Format | Recommendation |
|---|---|
| PEM strings (certificate + private key) | Universal minimum — all SDKs must accept |
| PKCS#12 / PFX + passphrase | Optional secondary format |
| Thumbprint (SHA-256) | For cert store lookup where applicable; SHA-256 preferred (SHA-1 deprecated) |
| Language-native cert objects (`X509Certificate2`, `x509.Certificate`, etc.) | Ergonomic aliases — optional but encouraged |

---

## Appendix C — GetSource()

Cross-SDK treatment of `GetSource()` / `getSource()` for mTLS PoP telemetry is deferred. This appendix will document the per-SDK return values and cache integration for mTLS PoP token sources when the feature stabilizes.
