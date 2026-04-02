# mTLS Proof-of-Possession (mTLS PoP) — Developer Guide

> **Status**: Minimum POC / Experimental. The backend Entra STS feature is currently in public preview.
>
> **Related docs**: [certificate-credentials.md](./certificate-credentials.md) · [sni.md](./sni.md) · [regional-authorities.md](./regional-authorities.md) · [mtls-pop-manual-testing.md](./mtls-pop-manual-testing.md)

---

## What problem does this solve?

A standard **Bearer token** is like a physical key: if someone steals it, they can use it until it expires. Bearer tokens travel as plain strings in HTTP headers and can be replayed by an attacker who intercepts them.

**mTLS Proof-of-Possession (mTLS PoP)** binds the access token to an X.509 certificate. The token is only valid when presented over a **mutual TLS (mTLS)** connection that uses the same certificate. A stolen `mtls_pop` token is useless without the matching private key.

This satisfies [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://datatracker.ietf.org/doc/html/rfc8705).

---

## What is implemented

### Path 1 — Confidential Client / SNI Certificate (`@azure/msal-node`)

This package covers the **Confidential Client Application (CCA) SNI certificate path**, where:

1. The app developer provides their own certificate (an SNI certificate registered in Azure AD).
2. MSAL sends the token request to the **regional `mtlsauth.microsoft.com` endpoint** over a mutual-TLS connection, using the certificate for the TLS handshake (not a `client_assertion` JWT).
3. Entra STS validates the TLS certificate and **binds the issued token to that certificate**.
4. The response contains an access token with `token_type=mtls_pop`.
5. MSAL returns the token plus the `bindingCertificate` (the public certificate PEM from `clientCertificate.x5c`) so the app can configure downstream mTLS calls. The private key reference is **not** included in the result — you already have it.

### Token request body

For mTLS PoP the request body contains:

```
client_id     = <your app's client ID>
grant_type    = client_credentials
scope         = <your scope>
token_type    = mtls_pop       ← triggers PoP token issuance
```

> **Important**: `client_assertion` and `client_assertion_type` are NOT sent. The mTLS handshake authenticates the client instead.

### Path 2 — Managed Identity (`@azure/msal-node-mtls-extensions`)

The separate [`@azure/msal-node-mtls-extensions`](../../../extensions/msal-node-mtls-extensions/README.md) package implements the **Managed Identity path**, where:

1. Node.js spawns `MsalMtlsMsiHelper.exe` — a bundled .NET 8 helper that handles all Windows-specific steps:
   - Creates a KeyGuard RSA key (Windows VBS non-exportable)
   - Generates a CSR and calls IMDS `/issuecredential` to get the binding certificate
   - Optionally: MAA attestation via `AttestationClientLib.dll`
   - Sends the mTLS token request to the regional STS endpoint
2. Node.js parses the JSON output and returns a standard `AuthenticationResult`.

See the [quick-start example](#quick-start-example) below for usage.

---

## Quick-start example

### Path 1 — Confidential Client / SNI Certificate

```typescript
import * as https from "https";
import { ConfidentialClientApplication, AuthenticationScheme } from "@azure/msal-node";
import * as fs from "fs";

// Load your SNI certificate and private key
const cert = fs.readFileSync("path/to/cert.pem", "utf8");
const key = fs.readFileSync("path/to/private-key.pem", "utf8");

const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/your-tenant-id",
        clientCertificate: {
            thumbprintSha256: "your-cert-sha256-thumbprint",
            privateKey: key,
            x5c: cert,          // ← required for mTLS PoP
        },
    },
});

const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
    azureRegion: "eastus",                              // optional: use regional mTLS endpoint
    authenticationScheme: AuthenticationScheme.MTLS_POP,
});

if (!result) throw new Error("No token returned");

console.log("Token type:", result.tokenType);           // "mtls_pop"

// Downstream mTLS call — private key is in-process, so https.Agent works directly
const agent = new https.Agent({ cert: result.bindingCertificate, key });

// Note: Node.js's global fetch() does not support mTLS client certificates.
// Use https.request() or a library that accepts a custom https.Agent.
https.request(
    {
        hostname: "graph.microsoft.com",
        path: "/v1.0/me",
        method: "GET",
        headers: { Authorization: `mtls_pop ${result.accessToken}` },
        agent,
    },
    (res) => { /* handle response */ }
).end();
```

### Path 2 — Managed Identity (Windows Azure VM, x64)

```typescript
import { acquireMtlsMsiToken, makeMtlsMsiRequest } from "@azure/msal-node-mtls-extensions";

// Step 1: acquire the mTLS PoP token
// The KeyGuard private key never leaves Windows CNG — Node.js only receives the token
const tokenResult = await acquireMtlsMsiToken({
    resource: "https://graph.microsoft.com/",
    // withAttestation: true,  // add if VM requires VBS attestation
});

console.log("Token type:", tokenResult.tokenType);      // "mtls_pop"
console.log("From cache:", tokenResult.fromCache);      // false on first call

// Step 2: call the downstream resource over mTLS
// Because the private key is non-exportable, https.Agent cannot be used from Node.js.
// makeMtlsMsiRequest proxies the call through MsalMtlsMsiHelper.exe, which holds the
// key and performs the mTLS handshake using .NET's HttpClient + Schannel.
const response = await makeMtlsMsiRequest({
    url: "https://graph.microsoft.com/v1.0/me",
    token: tokenResult.accessToken,
});

console.log("Status:", response.status);                // 200
console.log(JSON.parse(response.body));                 // { id, displayName, ... }
```

---

## Requirements

### Confidential Client / SNI cert path (`@azure/msal-node`)

| Requirement | Details |
|---|---|
| **Authority must be tenanted** | Use `https://login.microsoftonline.com/{tenantId}`. `/common` and `/organizations` are not supported and will throw an error. |
| **`azureRegion` is optional** | If provided, uses the regional mTLS endpoint: `https://{region}.mtlsauth.microsoft.com/{tenantId}/...`. If omitted, uses the non-regional endpoint (`https://mtlsauth.microsoft.com/{tenantId}/...`) — the STS infers the region from the SNI certificate. |
| **`clientCertificate.x5c` is required** | The public certificate PEM. This is what MSAL uses for the TLS handshake. |
| **`clientCertificate.privateKey` is required** | The private key corresponding to the certificate. Accepts a PEM string (`string`) or a `KeyObject` from `node:crypto` (for hardware-backed keys — see [Hardware-backed private keys](#hardware-backed-private-keys)). |
| **SNI certificate (for production)** | In production the certificate must be issued by a Microsoft-trusted CA (OneCert / MSFT PKI) and registered with your Azure AD app registration. See [SNI documentation](./sni.md). |

### Managed Identity path (`@azure/msal-node-mtls-extensions`)

| Requirement | Details |
|---|---|
| **Windows only** | KeyGuard RSA keys require Windows VBS (Virtualization-Based Security). |
| **`x64` only** | arm64 is not yet validated (`AttestationClientLib.dll` does not ship for arm64). |
| **Azure VM with Managed Identity configured** | System-assigned or user-assigned. |
| **.NET 8 runtime on the VM** | `MsalMtlsMsiHelper.exe` is a framework-dependent binary. Check with `dotnet --version`. Pre-installed on most Azure VM images. |

---

## How token caching works

mTLS PoP tokens are cached separately from Bearer tokens for the same scope. The `authenticationScheme` is part of the cache key, so calling `acquireTokenByClientCredential` with `authenticationScheme: AuthenticationScheme.MTLS_POP` will never return a cached Bearer token (and vice versa).

Token caching behaves identically to other client credential flows — cache hits return the existing token, background refresh occurs when `refreshOn` is exceeded, and `skipCache: true` forces a fresh token.

---

## Limitations

### Downstream mTLS resource calls (MSI path)

For the **Managed Identity path**, the `bindingCertificate` in `AuthenticationResult` is the public X.509 certificate (PEM) that Entra STS bound to the access token.

**Node.js cannot directly use this certificate to make downstream mTLS resource calls.** The corresponding KeyGuard private key is non-exportable from Windows CNG, so `https.Agent({ cert, key })` cannot be constructed from Node.js.

Use `makeMtlsMsiRequest()` from `@azure/msal-node-mtls-extensions` — see the [quick-start example](#quick-start-example) above.

> **Requirement:** The downstream server **must** use required mutual TLS — it must send a TLS `CertificateRequest` during the handshake. Public Azure services (Graph, Key Vault) use *optional* mTLS and will return `MtlsMissingClientCertificate`. See [`mtls-pop-manual-testing.md` Step 7](./mtls-pop-manual-testing.md#step-7--test-downstream-mtls-calls-with-makemtlsmsirequest) for a full end-to-end test with a local required-mTLS server.

For the **Confidential Client / SNI cert path**, you hold the private key directly (via `clientCertificate.privateKey`), so `https.Agent({ cert: result.bindingCertificate, key })` works as expected.

---

## Production readiness

The **code** is designed to be production-quality. Whether it successfully obtains tokens depends on the following backend prerequisites:

### SNI certificate

The certificate must be issued by a Microsoft-trusted CA and registered with the Entra app registration. The public certificate PEM must be provided via `clientCertificate.x5c`. Arbitrary or self-signed certificates will be rejected by Entra STS. See the [SNI guide](./sni.md) and [certificate credentials guide](./certificate-credentials.md) for setup details.

### Feature preview status

The mTLS PoP feature in Entra STS is currently in **public preview**. The integration tests in msal-dotnet use a test-slice parameter:

```typescript
// If the feature requires a test slice in your environment, pass it via extraQueryParameters:
const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://management.azure.com/.default"],
    azureRegion: "eastus",
    authenticationScheme: AuthenticationScheme.MTLS_POP,
    extraQueryParameters: {
        dc: "ESTSR-PUB-WUS3-AZ1-TEST1",
        slice: "TestSlice",
    },
});
```

> **Design note — one client per certificate:** `MtlsHttpClient` creates a single `https.Agent` bound to one certificate at construction time. This is appropriate for the Confidential Client path where the certificate is stable for the lifetime of the application. For the Managed Identity path, certificate rotation is handled inside `MsalMtlsMsiHelper.exe` — Node.js never holds the certificate at all, so rotation is transparent.

### Note on global `fetch()`

Node.js's built-in global `fetch()` (backed by `undici`) does **not** support providing a client certificate via standard options. MSAL's `MtlsHttpClient` uses the Node.js `https` module directly for the token request to `mtlsauth.microsoft.com`. For downstream API calls after token acquisition, use `https.request()` with an `https.Agent` configured with `cert` and `key` (as shown in the quick-start example above).

---

## What is NOT implemented — and why

The Confidential Client / SNI cert path (this package) is complete. The table below covers features from msal-dotnet that were deliberately excluded from **this package**.

### Why msal-dotnet's Managed Identity implementation cannot be ported to Node.js

The root cause is a single hardware-enforced constraint that cascades into everything else:

> **The KeyGuard RSA private key is flagged `NCRYPT_ALLOW_EXPORT_NONE` by Windows VBS. The raw key bytes can never leave the hardware — not into memory, not to disk, not to another process.**

**Why .NET can work with this key but Node.js cannot** comes down to their TLS stacks:

- **.NET on Windows uses Schannel** — a Windows-native TLS provider that understands CNG key handles natively. `HttpClient` + `SslClientCertificates` can perform a full mTLS handshake using a key that never leaves CNG, because Schannel delegates signing to CNG directly.
- **Node.js uses OpenSSL** everywhere, including on Windows. OpenSSL is a cross-platform library that manages its own key material as raw in-process bytes. It has no concept of a CNG key handle and no built-in path to delegate signing to Windows CNG.

This means the entire chain — key creation, CSR signing, mTLS handshake — must stay inside a process whose TLS stack speaks CNG. That process is .NET.

The remaining consequences follow from this:

| Consequence | Why |
|---|---|
| **Node.js TLS cannot use the key** | OpenSSL needs exportable key bytes. Even with a NAPI C++ addon calling CNG, you'd need a custom OpenSSL ENGINE to hook signing into the TLS handshake — a substantial undertaking with ongoing maintenance. |
| **No CNG bindings in Node.js** | Creating and using a KeyGuard key requires `NCryptCreatePersistedKey` / `NCryptSignHash` — Windows CNG APIs that Node.js does not expose. |
| **CSR and `/issuecredential` must stay in the same process** | The CSR is signed by the KeyGuard key. The entire CSR generation + IMDS credential issuance must happen in the process that owns the key handle. |
| **`AttestationClientLib.dll` is a native Windows DLL** | MAA attestation uses `Microsoft.Azure.Security.KeyGuardAttestation` — a native DLL with no Node.js equivalent. |

This is not a gap that can be bridged with a polyfill or a different Node.js API. The solution is to delegate the entire flow to a .NET subprocess (`MsalMtlsMsiHelper.exe`) that runs msal-dotnet natively — which is exactly what `@azure/msal-node-mtls-extensions` does.

### Group 1 — Delegated to `@azure/msal-node-mtls-extensions`

These Windows/.NET-specific capabilities are required for the Managed Identity path. They **are** implemented — via `MsalMtlsMsiHelper.exe` in the separate `@azure/msal-node-mtls-extensions` package. See the table above for why each one cannot run in Node.js directly.

| Feature | Handled by |
|---|---|
| **KeyGuard / hardware-backed RSA keys** | `MsalMtlsMsiHelper.exe` (Windows CNG / VBS) |
| **TPM/VBS attestation via MAA** | `MsalMtlsMsiHelper.exe` + `AttestationClientLib.dll` when `withAttestation: true` |
| **IMDS `/issuecredential` + CSR** | `MsalMtlsMsiHelper.exe` (must run in same process as KeyGuard key) |

See [`extensions/msal-node-mtls-extensions`](../../../extensions/msal-node-mtls-extensions/README.md) for the Managed Identity implementation.

> **Note on hardware-backed private keys (cert-based auth):** For the Confidential Client path, `MtlsHttpClient` accepts a `KeyObject` (from `node:crypto`) as the private key in addition to a PEM string. This means you can use hardware-backed keys via PKCS#11 native addons (e.g., `pkcs11js`) — MSAL itself has no dependency on those addons. See [hardware key usage](#hardware-backed-private-keys) below.

### Group 2 — Deferred (depends on Group 1 being in production)

| Feature | Notes |
|---|---|
| **Two-tier certificate cache (memory + Windows store)** | The in-memory tier (MSAL token cache) is used today. Windows certificate store persistence would require a Windows API call from `MsalMtlsMsiHelper.exe` and is deferred until the MSI path matures. |

### Group 3 — Technically feasible in Node.js, deferred for simplicity

| Feature | Notes |
|---|---|
| **Auto-region discovery from IMDS** | Node.js can make an HTTP GET to `http://169.254.169.254/metadata/instance/compute/location` to discover the Azure region automatically. Excluded for simplicity; provide `azureRegion` explicitly in the request. |
| **Full sovereign cloud endpoint mapping** | The mTLS endpoint formula for sovereign clouds (e.g., `mtlsauth.microsoftonline.us` for Azure Government, `mtlsauth.partner.microsoftonline.cn` for Azure China) is pure string logic and fully feasible. Deferred so the POC stays focused on the public cloud happy path. For sovereign clouds, use `extraQueryParameters` or raise an issue for this feature. |

---

## Hardware-backed private keys

`clientCertificate.privateKey` accepts a `KeyObject` (from Node.js's built-in `crypto` module) in addition to a PEM string. This means you can use non-exportable hardware-backed keys via a PKCS#11 native addon — MSAL has no dependency on those addons; it simply passes the `KeyObject` to Node.js's `https.Agent`.

> **Important**: `KeyObject` is only supported with `authenticationScheme: AuthenticationScheme.MTLS_POP`. Standard certificate-based flows use JWT signing, which requires a PEM string. If a `KeyObject` is provided as `privateKey`, do not use the same `ConfidentialClientApplication` instance for non-mTLS flows.

```typescript
import * as fs from "fs";
import { createPrivateKey } from "crypto";
import { ConfidentialClientApplication, AuthenticationScheme } from "@azure/msal-node";

// --- Software key (PEM file) ---
const keyObject = createPrivateKey({
    key: fs.readFileSync("path/to/private-key.pem"),
    format: "pem",
});

// --- Hardware key via a PKCS#11 addon (example with pkcs11js) ---
// msal-node has NO dependency on pkcs11js or any HSM addon.
// You produce the KeyObject using your chosen addon, then pass it to MSAL.
//
// import pkcs11js from "pkcs11js";
// const keyObject = myPkcs11Addon.getPrivateKeyObject(slotId, keyId);
//   ↑ returns a node:crypto KeyObject backed by the hardware key

const cert = fs.readFileSync("path/to/cert.pem", "utf8");

const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/your-tenant-id",
        clientCertificate: {
            thumbprintSha256: "your-cert-sha256-thumbprint",
            privateKey: keyObject,   // ← KeyObject accepted here
            x5c: cert,
        },
    },
});

const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
    azureRegion: "eastus",
    authenticationScheme: AuthenticationScheme.MTLS_POP,
});
```

---

## Error reference

| Error code | Meaning | Fix |
|---|---|---|
| `mtls_pop_certificate_required` | `authenticationScheme: MTLS_POP` was requested but `clientCertificate.x5c` and/or `clientCertificate.privateKey` are not configured. | Ensure both `x5c` (PEM cert) and `privateKey` are set in `clientCertificate` in the application configuration. |
| `missing_tenant_id_error` | The authority uses `/common` or `/organizations` instead of a specific tenant ID. | Update `authority` to `https://login.microsoftonline.com/{your-tenant-id}`. |

---

## References

- [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication](https://datatracker.ietf.org/doc/html/rfc8705)
- [msal-dotnet SNI mTLS PoP design doc](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/docs/sni_mtls_pop_token_design.md)
- [msal-dotnet mTLS PoP managed identity guide](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/docs/mtlspop_managed_identity.md)
- [SNI certificate setup in msal-node](./sni.md)
- [Certificate credentials guide](./certificate-credentials.md)
