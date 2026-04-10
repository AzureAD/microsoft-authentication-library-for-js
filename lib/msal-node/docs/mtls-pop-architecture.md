# mTLS PoP Architecture — Deep Dive

This document describes the internal architecture of the mTLS Proof of Possession implementation in msal-node, why certain design decisions were made, and how the implementation achieves functional parity with msal-dotnet. For the user-facing API guide, see [mtls-pop.md](mtls-pop.md).

---

## 1. Path 1 (Confidential Client / SNI Certificate): `MtlsHttpClient`

### The Core Problem

Node.js's built-in `fetch()` API (backed by `undici`) does not support providing a client certificate for mutual TLS. The standard approach for making mTLS connections in Node.js is `https.Agent` with `cert` and `key` options — but this requires using `https.request()`, not `fetch()`.

MSAL's standard network layer uses `fetch`. For mTLS PoP, a separate network client is needed.

### `MtlsHttpClient` Design

`MtlsHttpClient` is a purpose-built implementation of `INetworkModule` (MSAL's network abstraction) that uses `node:https` directly:

```typescript
export class MtlsHttpClient implements INetworkModule {
    private readonly agent: https.Agent;

    constructor(cert: string, key: string | KeyObject) {
        this.agent = new https.Agent({ cert, key: key as any });
    }
}
```

Key design decisions:

1. **One `https.Agent` per instance, per certificate.** The agent is created at construction time and reused across all requests. This is correct because the certificate is stable for the lifetime of the application (Path 1 uses a caller-supplied SNI certificate).

2. **`KeyObject` is accepted in addition to PEM string.** This enables hardware-backed keys (e.g., HSM or PKCS#11 tokens) — the caller obtains a `KeyObject` from their PKCS#11 addon, and MSAL passes it directly to `https.Agent`. MSAL has no dependency on any PKCS#11 library; it simply accepts the `KeyObject`. See [mtls-pop.md — Hardware-backed private keys](mtls-pop.md#hardware-backed-private-keys-path-1).

3. **No `global fetch()`.** `MtlsHttpClient` uses `https.request()` throughout, bypassing `undici` and Node's global fetch. This is the only viable path for mTLS in Node.js.

### How It Slots Into MSAL

`ClientCredentialClient.acquireMtlsToken()` creates a `MtlsHttpClient` on each mTLS PoP request and uses it for the token endpoint POST:

```typescript
const mtlsClient = new MtlsHttpClient(this.mtlsConfig.cert, this.mtlsConfig.key);
const response = await mtlsClient.sendPostRequestAsync(mtlsEndpoint, { headers, body: requestBody });
```

The `mtlsEndpoint` is built by `buildMtlsTokenEndpoint(tenantId, region)` → `https://{region}.mtlsauth.microsoft.com/{tenantId}/oauth2/v2.0/token` (or the non-regional base endpoint when `azureRegion` is omitted).

### Comparison to msal-dotnet (Path 1)

| | msal-node | msal-dotnet |
|---|---|---|
| TLS stack | `node:https` + `https.Agent` (OpenSSL) | `HttpClient` + `SslClientCertificates` (Schannel) |
| Key type accepted | PEM string or `node:crypto KeyObject` | `X509Certificate2` with any `AsymmetricAlgorithm` |
| Hardware key support | Via PKCS#11 addon → `KeyObject` | Via CNG `RSACng` / PKCS#11 |
| Token endpoint dispatch | `MtlsHttpClient` (separate `INetworkModule`) | Dedicated `HttpClient` with cert pinned |
| Client assertion JWT | Not used — cert presented at TLS layer | Not used — cert presented at TLS layer |

---

## 2. Path 2 (Managed Identity): Subprocess Architecture

### Why a Subprocess?

The Managed Identity mTLS PoP flow requires a **VBS KeyGuard RSA key** — a non-exportable private key protected by Windows Virtualization-Based Security. This cascades into a fundamental incompatibility:

```
OpenSSL (Node.js TLS):  EVP_PKEY → requires exportable key bytes in-process
CNG/KeyGuard:           NCRYPT_KEY_HANDLE → delegates signing to VBS enclave; bytes never leave
```

Node.js uses OpenSSL on all platforms, including Windows. OpenSSL has no concept of a CNG key handle. There is no bridge — not even a NAPI C++ addon can solve this, because the TLS handshake itself (step 5 in the flow) must use the non-exportable key.

**The only viable architecture: delegate the entire flow to a .NET subprocess.**

.NET on Windows uses **Schannel** as its TLS provider. Schannel natively understands CNG key handles and can perform the mTLS handshake using a key that never leaves the VBS enclave. `MsalMtlsMsiHelper.exe` runs msal-dotnet natively to handle all five steps.

For the full feasibility analysis of a NAPI C++ addon alternative, see [keyguard-napi-addon-analysis.md](keyguard-napi-addon-analysis.md).

### Subprocess IPC Protocol

`MsalMtlsMsiHelper.exe` communicates with Node.js via stdio:

| Channel | Purpose |
|---|---|
| **stdout** | JSON success payload |
| **stderr** | JSON error payload |
| **exit code 0** | Success — parse stdout |
| **exit code ≠ 0** | Failure — parse stderr |

**Success stdout:**
```json
{
    "access_token": "eyJ...",
    "token_type": "mtls_pop",
    "expires_in": 3599,
    "tenant_id": "xxxxxxxx-...",
    "client_id": "xxxxxxxx-...",
    "binding_certificate": "-----BEGIN CERTIFICATE-----\n..."
}
```

**Error stderr:**
```json
{
    "error": "managed_identity_failed",
    "error_description": "Human-readable description of what went wrong"
}
```

**CLI arguments:**

| Argument | Type | Notes |
|---|---|---|
| `--resource` | string | Azure resource URI (e.g. `https://graph.microsoft.com/`) |
| `--identity-type` | `SystemAssigned` \| `UserAssigned` | |
| `--identity-id` | string | Client/resource ID for UserAssigned |
| `--with-attestation` | flag | Include MAA attestation in the IMDS credential request |
| `--correlation-id` | string | Optional GUID for telemetry |
| `--force-refresh` | flag | Bypass the helper's token cache |

### What Runs Inside the Subprocess

`MsalMtlsMsiHelper.exe` wraps `Microsoft.Identity.Client` + `Microsoft.Identity.Client.KeyAttestation` and calls `AcquireTokenForManagedIdentity().WithMtlsProofOfPossession()`:

1. `GET /metadata/identity/getplatformmetadata` → `clientId`, `tenantId`, `cuId`, `attestationEndpoint`
2. `NCryptCreatePersistedKey` in Microsoft Software KSP — `MSALMtlsKey_{cuId}`, KeyGuard flags, RSA-2048
3. Generate PKCS#10 CSR signed with the KeyGuard key
4. *(if `--with-attestation`)* `AttestKeyGuardImportKey()` via `AttestationClientLib.dll` → MAA JWT
5. `POST /metadata/identity/issuecredential {csr, attestation_token?}` → X.509 binding cert
6. `POST {mtlsEndpoint}/{tenantId}/oauth2/v2.0/token` via .NET `HttpClient` with the binding cert

### Token Cache (Two Layers)

| Layer | Where | What | Keyed by |
|---|---|---|---|
| **Node.js in-memory** | `msal-node-mtls-extensions` process | `AuthenticationResult` objects | resource + identityType/Id |
| **Helper internal** | Inside `MsalMtlsMsiHelper.exe` | msal-dotnet token cache (also caches binding cert) | Same cache key as msal-dotnet MSI |

`acquireMtlsMsiToken()` checks the Node.js cache first. On a cache miss, it spawns the helper; the helper checks its own cache (msal-dotnet's MSI cache handles token + cert lifetime). `forceRefresh: true` bypasses both.

---

## 3. TLS Stack Comparison

| | msal-node (Path 1) | msal-node (Path 2) | msal-dotnet | msal-go |
|---|---|---|---|---|
| TLS stack | OpenSSL via `node:https` | Schannel via .NET subprocess | Schannel | Go `crypto/tls` (pure Go) |
| CNG key handle | ❌ Not possible | ✅ via subprocess | ✅ Native P/Invoke | ✅ via `syscall.NewLazyDLL` |
| Non-exportable key in TLS | ❌ (OpenSSL needs bytes) | ✅ Schannel+CNG in helper | ✅ | ✅ via `crypto.Signer` |
| Subprocess needed? | No | Yes | No | No |

msal-go avoids the subprocess entirely because Go's `crypto/tls` stack accepts any `crypto.Signer` implementation, and `cngSigner` wraps the CNG key handle as a `crypto.Signer`. OpenSSL has no equivalent interface.

---

## 4. msal-dotnet Parity

| Component | msal-dotnet | msal-node |
|---|---|---|
| Path 1 token request | `HttpClient` + `X509Certificate2` via Schannel | `MtlsHttpClient` + `https.Agent` via OpenSSL |
| Path 2 key management | `WindowsManagedIdentityKeyProvider` (in-process) | `MsalMtlsMsiHelper.exe` (subprocess) |
| Path 2 attestation | `AttestationClientLib.dll` (direct call) | `AttestationClientLib.dll` via subprocess |
| Path 2 TLS handshake | `HttpClient` + Schannel (in-process) | `HttpClient` + Schannel (in subprocess) |
| Non-exportable key in TLS | ✅ Native | ✅ Via subprocess |
| Token caching | msal-dotnet cache | Node in-memory + helper's msal-dotnet cache |
| Binding cert caching | msal-dotnet cert cache | Helper's msal-dotnet cache |

The subprocess approach achieves full functional parity with msal-dotnet's Managed Identity path because it literally runs msal-dotnet — the same `AcquireTokenForManagedIdentity().WithMtlsProofOfPossession()` call.

---

## 5. `AttestationClientLib.dll` — Distribution

The DLL ships inside the `Microsoft.Azure.Security.KeyGuardAttestation` NuGet package at `runtimes/win-x64/native/AttestationClientLib.dll`. MSBuild automatically copies it to the output directory — .NET consumers never think about it.

For `@azure/msal-node-key-attestation`, the build script (`npm run build:binaries`) extracts the DLL from the NuGet cache and places it in `bin/win-x64/` alongside `MsalMtlsMsiHelper.exe`. Both are included when the `@azure/msal-node-key-attestation` npm package is packed. End users who install this optional package receive both files automatically.

The core package (`@azure/msal-node-mtls-extensions`) ships with no binaries. This mirrors the pattern used by msal-dotnet (`Microsoft.Identity.Client` / `Microsoft.Identity.Client.KeyAttestation`) and msal-python (`msal` / `msal-key-attestation`): consumers who don't need KeyGuard attestation take no native dependency.

This is different from msal-go, which cannot bundle the DLL (Go modules are source-only; there is no native asset mechanism equivalent to NuGet's `runtimes/` folder). msal-go users must obtain and place the DLL manually.
