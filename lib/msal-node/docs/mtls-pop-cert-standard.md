# mTLS PoP — Cross-SDK Implementation Standard (MSI Focus)

> **Audience:** Azure SDK team and MSAL maintainers.  
> **Purpose:** Document the mTLS Proof-of-Possession implementation standard across all MSAL SDKs. This document focuses on the **Managed Identity credential** (`ManagedIdentityCredential` in the Azure SDK), which is the primary mTLS PoP scenario. The three Azure SDK credential scenarios impacted are:
> - `ManagedIdentityCredential` — covered in this document (Parts 1–4 and Appendices A, C)
> - `ClientCertificateCredential` (SNI/Confidential Client path) — covered in [Appendix B](#appendix-b--sni--confidential-client-path)
> - `ClientAssertionCredential` (FIC / Federated Identity Credential) — additional complexity; see [Appendix D](#appendix-d--fic--clientassertioncredential)

## Background

mTLS Proof-of-Possession (mTLS PoP) binds an access token cryptographically to a client certificate. The Entra STS embeds the certificate's public key in the token, and downstream resource servers verify that the client presenting the token is the same entity that holds the corresponding private key — preventing token theft and replay attacks.

**MSAL.NET is the reference implementation.** It ships mTLS PoP for both the Managed Identity path (`ManagedIdentityApplication.AcquireTokenForManagedIdentity().WithMtlsProofOfPossession()`) and the Confidential Client / SNI path (`ConfidentialClientApplication.AcquireTokenForClient().WithMtlsProofOfPossession()`). The goal of this document is to standardize the same behavior across all MSAL SDKs.

**The downstream problem is the key challenge.** After acquiring an mTLS PoP token, the developer must make downstream resource calls *over mTLS using the same binding certificate* — the resource server checks that the TLS client certificate matches the public key embedded in the token. When the binding key is stored in Windows KeyGuard (VBS-protected), standard TLS stacks like OpenSSL cannot perform this handshake because CNG refuses to export the key. See [Part 3](#part-3--downstream-mtls-calls-the-core-problem) for the full analysis.

---

## Two implementation dimensions

Before diving in, two scenarios shape how the MSI mTLS PoP flow behaves — they are **not independent axes**:

**Current implementation — KeyGuard + attestation (one integrated path):**
MSAL generates a key inside Windows Virtualization-Based Security (VBS) KeyGuard. The key material is **never** accessible outside CNG (`NCryptSignHash` only). Attestation via MAA is an integral part of this path — KeyGuard without attestation provides minimal security value. This is the complex scenario: attestation requires a native `AttestationClientLib.dll` distributed separately, and downstream BYO HTTP client is **not possible** for most SDKs (see [Part 3](#part-3--downstream-mtls-calls-the-core-problem)).

**Roadmap — software / exportable keys (simpler path):**
MSAL generates a software RSA key; key material can be exported as PEM bytes. No attestation is required. Downstream BYO HTTP client is **possible** for all SDKs because the raw key bytes can be passed to any TLS stack. This path is not yet supported by Entra STS.

> **Critical**: Downstream transport feasibility depends on the **key model**. A KeyGuard key cannot be used with standard BYO HTTP clients regardless of whether attestation is enabled.

---

## Part 1 — API Changes

### Enabling mTLS PoP

Each MSAL SDK exposes a way to signal that mTLS PoP should be used. Current per-SDK API:

| SDK | API |
|---|---|
| **msal-dotnet** | Path 1 (SNI): `app.AcquireTokenForClient(scopes).WithMtlsProofOfPossession()` on `ConfidentialClientApplication`<br/>Path 2 (MSI): `app.AcquireTokenForManagedIdentity(resource).WithMtlsProofOfPossession()` on `ManagedIdentityApplication` |
| **msal-go** | Path 1 (SNI): `confidential.WithMtlsProofOfPossession()` on `AcquireTokenByCredential()`<br/>Path 2 (MSI): `managedidentity.WithMtlsProofOfPossession()` on `AcquireToken()` |
| **msal-java** | Path 1 (SNI): `ClientCredentialParameters.builder(scopes).withMtlsProofOfPossession().build()` on `app.acquireToken()`<br/>Path 2 (MSI): `new MtlsMsiClient().acquireToken(resource, identityType, identityId, withAttestation, correlationId)` |
| **msal-node** | Path 1 (SNI): `app.acquireTokenByClientCredential({ scopes, authenticationScheme: AuthenticationScheme.MTLS_POP })` — `@azure/msal-node`<br/>Path 2 (MSI): `new MtlsManagedIdentityApplication().acquireToken({ resource })` — `@azure/msal-node-mtls-extensions` |
| **msal-python** | TBD |

### Enabling Attestation

| SDK | API | Native dependency |
|---|---|---|
| **msal-dotnet** | `.WithAttestationSupport()` — extension method in the separate `Microsoft.Identity.Client.KeyAttestation` NuGet package | `Microsoft.Identity.Client.KeyAttestation` NuGet (wraps native `Microsoft.Azure.Security.KeyGuardAttestation.dll`) |
| **msal-go** | Automatic — key type is selected at runtime (KeyGuard → Hardware → InMemory fallback); KeyGuard path triggers attestation when `AttestationClientLib.dll` is present; no explicit API flag | `AttestationClientLib.dll` |
| **msal-java** | `withAttestation: true` boolean parameter in `MtlsMsiClient.acquireToken()` | `AttestationClientLib.dll` on system `PATH` |
| **msal-node** | `withAttestation: true` in `MtlsManagedIdentityConfiguration` — `@azure/msal-node-mtls-extensions` | `msal_mtls_win.node` N-API addon (ships in the package under `bin/win-x64/`) |
| **msal-python** | TBD | TBD |

#### Developer experience for `AttestationClientLib.dll` bin-placement

- **Current**: the developer must manually place `AttestationClientLib.dll` alongside the MSAL native addon (e.g., in `bin/win-x64/`). Each MSAL team tracks a follow-up to provide a setup script that downloads the DLL from the appropriate NuGet package, unzips it, and places it correctly.
- **Ownership**: each MSAL SDK team owns the setup script for their respective package.
- **Long-term goal**: the MAA team will produce first-class native packages (npm, pip, Maven, etc.) so that `AttestationClientLib.dll` can be declared as a standard package dependency — eliminating manual bin-placement entirely.

### HTTP Client Injection

A key architectural change for mTLS PoP: MSAL must control (or be injected with) the HTTP client used for the token request, because it must present the client certificate during the TLS handshake with the STS. For MSI flows specifically, this applies only to the second leg (IMDS → ESTS token request) — a custom HTTP client can be used for the first leg (calls made within IMDS, which require no client certificate). MSAL uses its own internal transport for the cert-authenticated ESTS leg because the private key is non-exportable and cannot be surfaced to an external HTTP client.

| SDK | Injection model | For mTLS PoP |
|---|---|---|
| **msal-dotnet** | `IMsalMtlsHttpClientFactory : IMsalHttpClientFactory` — new interface that extends the base factory with `GetHttpClient(X509Certificate2)`; inject via `.WithHttpClientFactory(factory)` on the builder | MSAL automatically calls `GetHttpClient(X509Certificate2)` for mTLS token requests; implement it to return an `HttpClient` with `handler.ClientCertificates.Add(cert)` configured |
| **msal-go** | `http.Client` in `CommManager` | `comm.NewMtlsHTTPClient(cert)` provides a pre-configured client |
| **msal-java** | Internal — no BYO HTTP client for mTLS PoP MSI | Internally constructs a JSSE `SSLContext` backed by a custom `CngProvider` / `CngSignatureSpi` that routes the TLS `CertificateVerify` signing operation to CNG via JNA (`ncrypt.dll`) — equivalent to Schannel's `NCryptSignHash()` path but implemented in Java JSSE. The private key never leaves CNG; no BYO HTTP client is supported |
| **msal-node** | Path 1 (SNI): `system.networkClient: new MtlsHttpClient(cert, key)` — `@azure/msal-node`<br/>Path 2 (MSI): no injection — `system.networkClient` intentionally absent; WinHTTP mandatory for non-exportable KeyGuard key | Path 1: `MtlsHttpClient` replaces the default HTTP client for the app instance; Path 2: WinHTTP used internally by `msal_mtls_win.node` addon |
| **msal-python** | TBD | TBD |

### Token Acquisition Result

| Field | Type | Meaning |
|---|---|---|
| `tokenType` / `token_type` | `"mtls_pop"` | Indicates the access token must be presented over an mTLS connection |
| `bindingCertificate` | `string` (PEM) or SDK-native cert object | The public X.509 certificate bound to the token; used for downstream resource calls |

The binding certificate (`AuthenticationResult.BindingCertificate` in msal-dotnet, for example) contains only the public certificate. **For the current KeyGuard implementation, the private key remains in CNG and is never surfaced in `AuthenticationResult`** — for Path 1 (SNI/CCA) the developer already holds the private key, and for Path 2 (MSI) the key is non-exportable. For the roadmap software key scenario, the exportable private key will be included in `AuthenticationResult` so the Azure SDK can configure its own HTTP client — see [Part 4](#part-4--path-forward-software-key-pivot).

### GetManagedIdentitySourceAsync() — See [Appendix C](#appendix-c--getmanagedidentitysourceasync)

`GetManagedIdentitySourceAsync()` detects which managed identity environment is available on the current host. The return value tells you whether mTLS PoP (`ImdsV2`) is available. This is separate from `result.AuthenticationResultMetadata.TokenSource`, which indicates whether a token came from cache or the STS. **This is a helper API intended exclusively for the Azure SDK** — it enables the Azure SDK to detect the managed identity environment and decide whether to configure the mTLS PoP credential before calling `acquireToken()`. Currently implemented in msal-dotnet; see Appendix C.

---

## Part 2 — AuthResult Fields by SDK

| SDK | Field name | Type |
|---|---|---|
| **msal-dotnet** | `AuthenticationResult.BindingCertificate` | `X509Certificate2` |
| **msal-go** | `AuthResult.BindingCertificate`; `AuthResult.BindingTLSCertificate` (MSI path only) | `*x509.Certificate`; `*tls.Certificate` with `PrivateKey` as `crypto.Signer` backed by CNG (MSI path only) |
| **msal-java** | Path 1: `IAuthenticationResult.bindingCertificate()`<br/>Path 2: `MtlsMsiHelperResult.getBindingCertificate()` | Path 1: `X509Certificate`<br/>Path 2: PEM `String` |
| **msal-node** | Path 1 (SNI): `AuthenticationResult.bindingCertificate` — `@azure/msal-node`<br/>Path 2 (MSI): `AuthenticationResult.bindingCertificate` — `@azure/msal-node-mtls-extensions` | PEM `string` (both paths) |
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
| **MSI — software keys (roadmap)** | Software RSA | ✅ Exportable as PEM | ✅ Projected — not yet validated (Entra STS does not yet support software keys) |
| **SNI / Confidential Client (Path 1)** | Developer-provided | Depends on import flags | ✅ Yes — developer holds the key directly |

### Per-SDK current state (KeyGuard path)

| SDK | TLS stack for MSI token request | BYO HTTP client for downstream (KeyGuard scenario)? | SDK-provided mTLS transport |
|---|---|---|---|
| **msal-dotnet** | Schannel | ✅ Yes — Schannel uses CNG key handle via `NCryptSignHash`; `HttpClientHandler.ClientCertificates.Add(result.BindingCertificate)` | None needed |
| **msal-go** | `crypto/tls` (Go stdlib) | ✅ Yes — `result.BindingTLSCertificate` contains a `crypto.Signer` backed by CNG; use in `tls.Config` on any `http.Client` | `comm.NewMtlsHTTPClient()` (convenience) |
| **msal-java** | JSSE + custom `CngProvider`/`CngSignatureSpi` → JNA → `ncrypt.dll` | ❌ **Not possible in practice** — `CngSignatureSpi` + `CngProvider` sign TLS handshakes via JNA without exporting the key, but configuring a BYO HTTP client with MSAL's custom `SSLSocketFactory` is not a supported path | `MtlsMsiClient.httpRequest()` |
| **msal-node** | WinHTTP + Schannel (N-API addon) | ❌ **Not possible** — Node.js/OpenSSL needs raw key bytes; CNG refuses export for KeyGuard keys | `MtlsManagedIdentityApplication.sendGetRequestAsync()` / `sendPostRequestAsync()` — `@azure/msal-node-mtls-extensions` |
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

> **Note on MSI flow sequencing**: For the MSI path, the binding certificate is issued by IMDS as part of the token acquisition flow — it cannot be provided to the Azure SDK before `acquireToken()` completes. The Azure SDK receives the binding certificate (and exportable key, once software keys land) in `AuthenticationResult` and uses them for subsequent downstream mTLS calls.

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

> **Open question — long-term solution**: A sustainable long-term solution would be an OpenSSL 3.x provider that routes TLS client-certificate signing to Schannel / CNG, allowing Node.js's built-in TLS stack to work with non-exportable KeyGuard keys without requiring a custom N-API addon. For example, configuring OpenSSL to use Schannel as its TLS backend on Windows would give Node.js the same `NCryptSignHash()` path that .NET and WinHTTP use today. This is an open engineering challenge — input and collaboration from platform teams, the OpenSSL project, and the broader TLS/crypto community is welcome.

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

## Appendix C — GetManagedIdentitySourceAsync()

> **Note:** This is a helper API intended exclusively for the Azure SDK to detect the managed identity environment before configuring the mTLS PoP credential.

`GetManagedIdentitySourceAsync()` detects which managed identity environment is available on the current host. It is distinct from `result.AuthenticationResultMetadata.TokenSource` (which reports cache vs. STS). It is useful for:

- Verifying that the VM supports mTLS PoP before attempting token acquisition
- Telemetry: logging the MI source alongside the token type
- Choosing between mTLS PoP and a fallback path (e.g., when `ImdsV2` is unavailable)

### msal-dotnet

```csharp
// Preferred: async, includes probe failure reasons
var app = ManagedIdentityApplicationBuilder
    .Create(ManagedIdentityId.SystemAssigned)
    .Build();

ManagedIdentitySourceResult result = await ((ManagedIdentityApplication)app)
    .GetManagedIdentitySourceAsync(cancellationToken);

// result.Source — the detected MI environment
// result.ImdsV1FailureReason — reason IMDS v1 probe failed (if applicable)
// result.ImdsV2FailureReason — reason IMDS v2 probe failed (if applicable)
```

**`ManagedIdentitySource` enum values:**

| Value | Meaning | mTLS PoP supported? |
|---|---|---|
| `ImdsV2` | Azure VM with IMDS v2 (Credential Guard / KeyGuard) | ✅ Yes — primary mTLS PoP path |
| `Imds` | Azure VM with IMDS v1 | ❌ No |
| `AppService` | Azure App Service / Functions | ❌ No |
| `AzureArc` | Azure Arc-connected machine | ❌ No |
| `CloudShell` | Azure Cloud Shell | ❌ No |
| `ServiceFabric` | Azure Service Fabric | ❌ No |
| `MachineLearning` | Azure Machine Learning | ❌ No |
| `None` | No MI source detected | ❌ No |

> **Note:** `DefaultToImds` is deprecated — use `GetManagedIdentitySourceAsync()` instead of the obsolete `GetManagedIdentitySource()`.

This API is currently implemented in msal-dotnet only. Equivalent source-detection APIs will be added to other MSAL SDKs as the mTLS PoP feature is ported.

---

## Appendix D — FIC / ClientAssertionCredential

The Federated Identity Credential (FIC) scenario — represented in the Azure SDK as `ClientAssertionCredential` — involves additional complexity beyond the scope of this document: the mTLS binding interacts with the federated assertion exchange in ways that require separate analysis. This is tracked as a follow-up; a dedicated document will cover the FIC mTLS PoP design once that path is finalized.
