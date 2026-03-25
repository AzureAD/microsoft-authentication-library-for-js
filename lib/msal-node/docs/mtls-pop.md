# mTLS Proof-of-Possession (mTLS PoP) — Developer Guide

> **Status**: Minimum POC / Experimental. The backend Entra STS feature is currently in public preview.
>
> **Related docs**: [certificate-credentials.md](./certificate-credentials.md) · [sni.md](./sni.md) · [regional-authorities.md](./regional-authorities.md)

---

## What problem does this solve?

A standard **Bearer token** is like a physical key: if someone steals it, they can use it until it expires. Bearer tokens travel as plain strings in HTTP headers and can be replayed by an attacker who intercepts them.

**mTLS Proof-of-Possession (mTLS PoP)** binds the access token to an X.509 certificate. The token is only valid when presented over a **mutual TLS (mTLS)** connection that uses the same certificate. A stolen `mtls_pop` token is useless without the matching private key.

This satisfies [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://datatracker.ietf.org/doc/html/rfc8705).

---

## What is implemented (Confidential Client / SNI Certificate path)

This implementation covers the **Confidential Client Application (CCA) SNI certificate path**, where:

1. The app developer provides their own certificate (an SNI certificate registered in Azure AD).
2. MSAL sends the token request to the **regional `mtlsauth.microsoft.com` endpoint** over a mutual-TLS connection, using the certificate for the TLS handshake (not a `client_assertion` JWT).
3. Entra STS validates the TLS certificate and **binds the issued token to that certificate**.
4. The response contains an access token with `token_type=mtls_pop`.
5. MSAL returns the token plus the `bindingCertificate` (the PEM cert string) so the app can configure downstream mTLS calls.

### Token request body

For mTLS PoP the request body contains:

```
client_id     = <your app's client ID>
grant_type    = client_credentials
scope         = <your scope>
token_type    = mtls_pop       ← triggers PoP token issuance
```

> **Important**: `client_assertion` and `client_assertion_type` are NOT sent. The mTLS handshake authenticates the client instead.

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
    azureRegion: "eastus",                              // ← required for mTLS PoP
    authenticationScheme: AuthenticationScheme.MTLS_POP,
});

if (!result) throw new Error("No token returned");

console.log("Token type:", result.tokenType);           // "mtls_pop"
console.log("Binding cert:", result.bindingCertificate?.substring(0, 40));

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

| Requirement | Details |
|---|---|
| **Authority must be tenanted** | Use `https://login.microsoftonline.com/{tenantId}`. `/common` and `/organizations` are not supported and will throw an error. |
| **`azureRegion` is required** | The mTLS endpoint is regional: `https://{region}.mtlsauth.microsoft.com/{tenantId}/...`. No auto-discovery — you must provide the region explicitly. |
| **`clientCertificate.x5c` is required** | The public certificate PEM. This is what MSAL uses for the TLS handshake. |
| **`clientCertificate.privateKey` is required** | The private key PEM corresponding to the certificate. |
| **SNI certificate (for production)** | In production the certificate must be issued by a Microsoft-trusted CA (OneCert / MSFT PKI) and registered with your Azure AD app registration. See [SNI documentation](./sni.md). |

---

## How token caching works

mTLS PoP tokens are cached separately from Bearer tokens for the same scope. The `authenticationScheme` is part of the cache key, so calling `acquireTokenByClientCredential` with `authenticationScheme: AuthenticationScheme.MTLS_POP` will never return a cached Bearer token (and vice versa).

Token caching behaves identically to other client credential flows — cache hits return the existing token, background refresh occurs when `refreshOn` is exceeded, and `skipCache: true` forces a fresh token.

---

## Production readiness

The **code** is designed to be production-quality. Whether it successfully obtains tokens depends on the following backend prerequisites:

### SNI certificate

The certificate must be issued by a Microsoft-trusted CA and registered with the Entra app registration using `sendX5C: true`. Arbitrary or self-signed certificates will be rejected by Entra STS. See the [SNI guide](./sni.md) and [certificate credentials guide](./certificate-credentials.md) for setup details.

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

### Note on global `fetch()`

Node.js's built-in global `fetch()` (backed by `undici`) does **not** support providing a client certificate via standard options. MSAL's `MtlsHttpClient` uses the Node.js `https` module directly for the token request to `mtlsauth.microsoft.com`. For downstream API calls after token acquisition, use `https.request()` with an `https.Agent` configured with `cert` and `key` (as shown in the quick-start example above).

---

## What is NOT implemented — and why

There are two categories of exclusions:

### Group 1 — Unavailable in Node.js (hard blockers)

These features are Windows/.NET-specific and have no equivalent in Node.js:

| Feature | Why it cannot be implemented |
|---|---|
| **KeyGuard / hardware-backed RSA keys** | Windows-only feature backed by Virtualization-Based Security (VBS). The msal-dotnet `IManagedIdentityKeyProvider` creates keys inside a VBS-protected enclave. No Node.js equivalent exists. |
| **TPM/VBS attestation via MAA** | Requires calling `AttestationClientLib.dll`, a native Windows DLL that collects TPM/VBS evidence and obtains a JWT from Microsoft Azure Attestation. Native DLLs cannot be called from Node.js without a separate FFI package. |
| **Windows certificate store** | Windows provides a built-in OS-level certificate store used for the persistent tier of msal-dotnet's two-tier certificate cache. Node.js has no built-in API to read or write the Windows certificate store. |

### Group 2 — Not implemented because they depend on Group 1

These flows are otherwise feasible in Node.js but cannot be completed without the Group 1 features:

| Feature | What blocks it |
|---|---|
| **Managed Identity mTLS PoP (IMDSv2 path)** | The IMDS HTTP calls (`/getplatformmetadata`, `/issuecredential`) are reachable from Node.js. However, IMDS **requires the CSR to use a KeyGuard RSA key** (see Group 1). IMDS rejects CSRs generated with software keys — the entire certificate-minting flow is blocked. |
| **Two-tier certificate cache (memory + Windows store)** | The in-memory tier is feasible in Node.js. The Windows certificate store tier (Group 1) is not. Since the two-tier architecture in msal-dotnet depends on both tiers for process-restart survival, implementing only half is not useful. The standard MSAL token cache covers the access token for this PoC. |
| **CSR generation and certificate lifecycle management** | Even with Node.js's `crypto.generateKeyPair()`, software-key CSRs are rejected by IMDS in the Managed Identity flow. |

### Group 3 — Technically feasible in Node.js, deferred for simplicity

| Feature | Notes |
|---|---|
| **Auto-region discovery from IMDS** | Node.js can make an HTTP GET to `http://169.254.169.254/metadata/instance/compute/location` to discover the Azure region automatically. Excluded for simplicity; provide `azureRegion` explicitly in the request. |
| **Full sovereign cloud endpoint mapping** | The mTLS endpoint formula for sovereign clouds (e.g., `mtlsauth.microsoftonline.us` for Azure Government, `mtlsauth.partner.microsoftonline.cn` for Azure China) is pure string logic and fully feasible. Deferred so the POC stays focused on the public cloud happy path. For sovereign clouds, use `extraQueryParameters` or raise an issue for this feature. |

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
