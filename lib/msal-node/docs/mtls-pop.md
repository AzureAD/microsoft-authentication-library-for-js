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

1. Node.js calls IMDS `/metadata/identity/getplatformmetadata` (plain HTTP, no crypto).
2. Node.js spawns `MsalMtlsMsiHelper.exe` — a bundled .NET 8 helper that handles all Windows-specific steps:
   - Creates a KeyGuard RSA key (Windows VBS non-exportable)
   - Generates a CSR and calls IMDS `/issuecredential` to get the binding certificate
   - Optionally: MAA attestation via `AttestationClientLib.dll`
   - Sends the mTLS token request to the regional STS endpoint
3. Node.js parses the JSON output and returns a standard `AuthenticationResult`.

```typescript
import { acquireMtlsMsiToken } from "@azure/msal-node-mtls-extensions";

const result = await acquireMtlsMsiToken({
    resource: "https://management.azure.com/",
    withAttestation: true, // requires VBS-enabled VM
});
// result.tokenType === "mtls_pop"
// result.bindingCertificate — PEM cert bound to the token
```

---

## Quick-start example

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
console.log("Binding cert:", result.bindingCertificate);

// Use the bound token for downstream calls over mTLS
const agent = new https.Agent({
    cert: result.bindingCertificate,
    key,
});

// Note: Node.js's global fetch() does not support mTLS client certificates.
// Use https.request() or a library that accepts a custom https.Agent.
https.request(
    {
        hostname: "graph.microsoft.com",
        path: "/v1.0/me",
        method: "GET",
        headers: {
            Authorization: `mtls_pop ${result.accessToken}`,
        },
        agent,
    },
    (res) => {
        // handle response
    }
).end();
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

Use `makeMtlsMsiRequest()` from `@azure/msal-node-mtls-extensions` to make downstream calls. It routes the HTTP request through `MsalMtlsMsiHelper.exe`, where .NET's `HttpClient` can use the non-exportable key for the TLS client handshake:

```typescript
import { acquireMtlsMsiToken, makeMtlsMsiRequest } from "@azure/msal-node-mtls-extensions";

const tokenResult = await acquireMtlsMsiToken({ resource: "https://graph.microsoft.com/" });

const response = await makeMtlsMsiRequest({
    url: "https://graph.microsoft.com/v1.0/me",
    token: tokenResult.accessToken,
});

console.log(response.status); // 200
```

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

### Group 1 — Delegated to `@azure/msal-node-mtls-extensions`

These Windows/.NET-specific capabilities are required for the Managed Identity path. They **are** implemented — but via a .NET subprocess helper bundled in the separate `@azure/msal-node-mtls-extensions` package, because they cannot run in Node.js directly.

| Feature | Why it cannot run in Node.js (and how it is solved) |
|---|---|
| **KeyGuard / hardware-backed RSA keys** | Non-exportable key backed by Windows VBS. Created and used inside `MsalMtlsMsiHelper.exe`. |
| **TPM/VBS attestation via MAA** | Requires `AttestationClientLib.dll` (a native Windows DLL). Called by `MsalMtlsMsiHelper.exe` when `withAttestation: true`. |
| **IMDS `/issuecredential` + CSR** | Uses the KeyGuard key — must run inside `MsalMtlsMsiHelper.exe`. |

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
| `mtls_pop_region_required` | `authenticationScheme: MTLS_POP` was requested but `azureRegion` was not set on the token request. | Add `azureRegion: "eastus"` (or whichever region your workload runs in) to `acquireTokenByClientCredential`. |
| `missing_tenant_id_error` | The authority uses `/common` or `/organizations` instead of a specific tenant ID. | Update `authority` to `https://login.microsoftonline.com/{your-tenant-id}`. |

---

## References

- [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication](https://datatracker.ietf.org/doc/html/rfc8705)
- [msal-dotnet SNI mTLS PoP design doc](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/docs/sni_mtls_pop_token_design.md)
- [msal-dotnet mTLS PoP managed identity guide](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/docs/mtlspop_managed_identity.md)
- [SNI certificate setup in msal-node](./sni.md)
- [Certificate credentials guide](./certificate-credentials.md)
