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

## 2. Path 2 (Managed Identity): N-API Addon Architecture

### The Core Constraint

The Managed Identity mTLS PoP flow requires a **VBS KeyGuard RSA key** — a non-exportable private key protected by Windows Virtualization-Based Security. This creates a fundamental incompatibility with Node.js's TLS stack:

```
OpenSSL (Node.js https):  EVP_PKEY → requires exportable key bytes in-process
CNG/KeyGuard:             NCRYPT_KEY_HANDLE → delegates signing to VBS enclave; bytes never leave
```

**The solution:** The C++ N-API addon uses **WinHTTP** instead of Node.js's `https` module for all HTTP requests that must present the client certificate. WinHTTP uses **Schannel** (the Windows-native TLS provider), which natively understands CNG key handles — the same capability that makes .NET's `HttpClient` work with KeyGuard keys.

IMDS calls (metadata, issuecredential) do NOT require the client certificate and are made from TypeScript using Node.js's standard `https` module.

### N-API Addon (`msal_mtls_win.node`)

The addon is a C++ DLL loaded in-process via `require()`. It exposes these functions to JavaScript:

| Function | Description |
|---|---|
| `createOrOpenKey(cuId, level)` | Creates or opens `MSALMtlsKey_{cuId}` in Windows KSP using KeyGuard, Software, or InMemory level |
| `getPublicKeyDer(handleId)` | Returns SubjectPublicKeyInfo DER bytes for the key |
| `getAttestationToken(endpoint, handleId)` | Calls `AttestationClientLib.dll` → returns MAA JWT |
| `makeMtlsRequest(url, method, body, headers, certDer, handleId)` | Makes HTTPS request via WinHTTP with client certificate |
| `signHashPss(handleId, hashBytes)` | Signs a SHA-256 hash using RSASSA-PSS with the CNG key |

The addon manages a handle table (integer → NCRYPT_KEY_HANDLE) so handles can be passed between JavaScript and C++.

### Key Management: 3-Level Fallback

Mirrors `WindowsManagedIdentityKeyProvider` in msal-dotnet:

| Level | KSP | Flags | Key Name | Security |
|---|---|---|---|---|
| KeyGuard | Microsoft Software KSP | `NCRYPT_USE_VIRTUAL_ISOLATION_FLAG \| NCRYPT_USE_PER_BOOT_KEY_FLAG` | `MSALMtlsKey_{cuId}` | VBS-protected — strongest |
| Software | Microsoft Software KSP | None | `MSALMtlsKey_{cuId}_sw` | Software-backed persisted key |
| InMemory | — | — | n/a | `rsa.GenerateKey()` — ephemeral |

All keys use `NCRYPT_ALLOW_EXPORT_NONE` — they are never exported as bytes.

### WinHTTP Client Certificate Presentation

A critical detail: WinHTTP only presents the client certificate if the server sends a TLS `CertificateRequest`. This means:

- **Entra mTLS endpoint** (`centraluseuap.mtlsauth.microsoft.com`): sends `CertificateRequest` → cert is presented ✅
- **`mtlstb.graph.microsoft.com`**: sends `CertificateRequest` → cert is presented ✅
- **`graph.microsoft.com`**: optional mTLS — no `CertificateRequest` → cert is NOT presented ❌

This is the same behavior as .NET's `HttpClient` with `SslClientCertificates`.

### Token Cache (Single Layer)

| Layer | Where | What | Keyed by |
|---|---|---|---|
| **In-memory** | `MtlsManagedIdentityApplication` instance | `AuthenticationResult` objects | resource + identityType/Id + withAttestation |

The key handle and binding certificate are cached in `NativeHelper.ts` (module-level, process-global). `forceRefresh: true` bypasses the token cache but reuses the cached key handle and binding cert if they are still valid.

---

## 3. TLS Stack Comparison

| | msal-node (Path 1) | msal-node (Path 2) | msal-dotnet | msal-go | msal-java |
|---|---|---|---|---|---|
| TLS stack | OpenSSL via `node:https` | WinHTTP (Schannel) via C++ N-API addon | Schannel via `HttpClient` | Go `crypto/tls` (pure Go) | JSSE + custom `SSLSocketFactory` (Path 1); JNA → `ncrypt.dll` (Path 2) |
| CNG key handle | ❌ Not possible | ✅ via WinHTTP + Schannel | ✅ Native P/Invoke | ✅ via `syscall.NewLazyDLL` | ✅ via JNA → `ncrypt.dll` |
| Non-exportable key in TLS | ❌ (OpenSSL needs bytes) | ✅ Schannel+CNG in addon | ✅ | ✅ via `crypto.Signer` | ✅ via JNA |
| Subprocess needed? | No | No | No | No | No |

The key insight: by using WinHTTP (not OpenSSL) in the C++ addon, msal-node achieves the same in-process capability as msal-dotnet, msal-go, and msal-java. The CNG key handle is held by the addon; WinHTTP/Schannel uses it directly for TLS client authentication without ever exporting the key bytes. msal-java reaches the same result via JNA calling `ncrypt.dll` directly from the JVM.

---

## 4. msal-dotnet Parity

| Component | msal-dotnet | msal-node |
|---|---|---|
| Path 1 token request | `HttpClient` + `X509Certificate2` via Schannel | `MtlsHttpClient` + `https.Agent` via OpenSSL |
| Path 2 key management | `WindowsManagedIdentityKeyProvider` (in-process) | `msal_mtls_win.node` addon (in-process, `cng_key.cpp`) |
| Path 2 attestation | `AttestationClientLib.dll` (direct call) | `AttestationClientLib.dll` via addon (`winhttp_mtls.cpp`) |
| Path 2 TLS handshake | `HttpClient` + Schannel (in-process) | WinHTTP + Schannel via addon (in-process) |
| Non-exportable key in TLS | ✅ Native | ✅ Via WinHTTP in addon |
| Token caching | msal-dotnet cache | Node in-memory (`MtlsManagedIdentityApplication`) |
| Binding cert caching | msal-dotnet cert cache | Module-level cache in `NativeHelper.ts` |

Both implementations achieve the same result: the KeyGuard key handle is used directly for the TLS handshake without the key bytes ever being exported. msal-dotnet uses Schannel via `HttpClient`; msal-node uses Schannel via WinHTTP in the C++ addon.

---

## 5. `AttestationClientLib.dll` — Distribution

The DLL ships inside the `Microsoft.Azure.Security.KeyGuardAttestation` NuGet package at `runtimes/win-x64/native/AttestationClientLib.dll`.

For `@azure/msal-node-mtls-extensions`, the DLL must be placed in `bin/win-x64/` alongside `msal_mtls_win.node`. It is **not committed to git** — obtain it from the NuGet package and place it manually. It is loaded dynamically by the addon at runtime only when `withAttestation: true`.

This differs from msal-dotnet where MSBuild automatically copies the DLL to the output directory. For Node.js, the placement is a manual step (or scripted in a build pipeline).

> **Note:** If `AttestationClientLib.dll` is absent and `withAttestation: true` is passed, the addon will log a warning and proceed without attestation. The IMDS call may then fail if the VM requires attestation — in that case a hard error is thrown.

For msal-go, the DLL cannot be bundled (Go modules are source-only; there is no native asset mechanism equivalent to NuGet's `runtimes/` folder). msal-go users must obtain and place the DLL manually — the same situation as msal-node.
