# mTLS PoP — Cross-SDK Certificate Handling Standard

> **Audience:** Azure SDK team and MSAL maintainers.  
> **Purpose:** Establish a consistent certificate handling model across all MSAL SDKs for mTLS Proof-of-Possession, covering both how certificates are provided to MSAL and how developers use the binding certificate for downstream resource calls.

There are two mTLS PoP paths across all MSALs. **Path 1 (SNI/Confidential Client):** the developer provides their own certificate; MSAL uses it for the token request TLS handshake. **Path 2 (Managed Identity):** MSAL orchestrates the full lifecycle — it generates a key, builds a CSR, calls IMDS to mint the certificate, and acquires the token. The developer provides nothing upfront.

---

## Part 1 — Certificate Input (SNI / Confidential Client Path)

How developers provide their certificate to MSAL today:

| SDK | Accepted formats | Primary type |
|---|---|---|
| **msal-dotnet** | `X509Certificate2` object | Developer loads from cert store, PFX, or PEM file themselves before passing to MSAL |
| **msal-go** | PEM bytes (CERTIFICATE + PRIVATE KEY blocks, PKCS#1 or PKCS#8) | `CertFromPEM(data, password)` → `[]*x509.Certificate + crypto.PrivateKey` |
| **msal-java** | PKCS#12 stream + passphrase, or `PrivateKey + X509Certificate` object, or cert chain | `ClientCredentialFactory.createFromCertificate(...)` |
| **msal-node** | PEM strings: `{ thumbprintSha256, privateKey, x5c }` | `clientCertificate` in config; `privateKey` accepts PEM string or `node:crypto` `KeyObject` |
| **msal-python** | PFX file path + passphrase, or PEM strings: `{ private_key, public_certificate, thumbprint }` | `client_credential` dict in `ConfidentialClientApplication` |

**Path 2 (Managed Identity):** No certificate input from the developer. MSAL generates the key, builds the CSR, and calls IMDS `/issuecredential` to obtain the binding certificate.

### Proposed standard

To reduce integration friction, all MSALs should accept the following certificate input formats. This is the recommended standard for Azure SDK integration:

| Format | Recommendation |
|---|---|
| PEM strings (certificate + private key) | Universal minimum — all SDKs must accept |
| PKCS#12 / PFX + passphrase | Optional secondary format |
| Thumbprint (SHA-256) | For cert store lookup where applicable; SHA-256 as primary (SHA-1 deprecated) |
| Language-native cert objects (`X509Certificate2`, `x509.Certificate`, etc.) | Ergonomic aliases — optional but encouraged |

---

## Part 2 — AuthResult: What MSAL Returns After Token Acquisition

| SDK | Field name | Type |
|---|---|---|
| **msal-dotnet** | `AuthenticationResult.BindingCertificate` | `X509Certificate2` |
| **msal-go** | `AuthResult.BindingCertificate` + `AuthResult.BindingTLSCertificate` | `*x509.Certificate` + `*tls.Certificate` (with `PrivateKey` as `crypto.Signer`) |
| **msal-java** | `IAuthenticationResult.bindingCertificate()` | `X509Certificate` |
| **msal-node** | `AuthenticationResult.bindingCertificate` | PEM `string` |
| **msal-python** | TBD | TBD |

All SDKs set `tokenType` / `token_type` to `"mtls_pop"` in the result.

---

## Part 3 — Downstream mTLS Calls: Current State

After acquiring the token, the developer must make resource calls over mTLS using the binding certificate. Here is what each SDK supports today:

| SDK | TLS stack | Developer can use own HTTP client? | MSAL transport helper |
|---|---|---|---|
| **msal-dotnet** | Schannel (.NET) | ✅ Yes — `new HttpClientHandler(); handler.ClientCertificates.Add(result.BindingCertificate)` | None needed |
| **msal-go** | `crypto/tls` (Go stdlib) | ✅ Yes — `tls.Config{Certificates: []tls.Certificate{*result.BindingTLSCertificate}}` on any `http.Client`; also provides `comm.NewMtlsHTTPClient(cert)` helper | ✅ `NewMtlsHTTPClient()` |
| **msal-java** | JSSE + JNA → `ncrypt.dll` | ❌ No — private key stays in CNG; developer must use MSAL's wrapper | ✅ `MtlsMsiClient.httpRequest()` |
| **msal-node** | WinHTTP + Schannel (N-API addon) | ❌ No — Node.js uses OpenSSL which needs raw key bytes; KeyGuard key is non-exportable | ✅ `app.sendGetRequestAsync()` / `app.sendPostRequestAsync()` where `app` is a `MtlsManagedIdentityApplication` |
| **msal-python** | WinHTTP + Schannel (ctypes) — token acquisition only; `requests` for IMDS calls | ❌ No — private key stays in CNG; no downstream transport exposed | ❌ None — no downstream helper implemented |

**Authorization header:** All SDKs use `Authorization: mtls_pop <access_token>` for downstream resource calls. msal-dotnet provides a `result.CreateAuthorizationHeader()` convenience method; other SDKs require manual construction.

---

## Part 4 — Recommendation to Azure SDK

### Use the MSAL mTLS-specific application type

For Managed Identity mTLS PoP, each MSAL exposes a dedicated application class. Azure SDK should use this app type — not a general `ManagedIdentityApplication` — for both token acquisition and downstream resource calls:

| SDK | App type | Token acquisition | Downstream transport |
|---|---|---|---|
| **msal-dotnet** | `ManagedIdentityApplication` + `WithMtlsProofOfPossession()` | `AcquireTokenForManagedIdentity()` | `HttpClientHandler.ClientCertificates.Add(result.BindingCertificate)` |
| **msal-go** | `MtlsClient` | `AcquireTokenByManagedIdentity()` | `tls.Config{Certificates: []tls.Certificate{*result.BindingTLSCertificate}}` |
| **msal-java** | `MtlsMsiClient` | `acquireToken()` | `client.httpRequest(url, method, token, ...)` |
| **msal-node** | `MtlsManagedIdentityApplication` | `acquireToken()` | `app.sendGetRequestAsync()` / `app.sendPostRequestAsync()` |
| **msal-python** | `obtain_token()` (module-level) | `obtain_token(http_client, identity, resource)` | No helper yet — in progress |

### Downstream calls and custom HTTP clients

This is the critical DevEx question for Azure SDK: **can you use your own HTTP client (HttpPipeline, axios, requests, etc.) for the downstream mTLS resource call?**

The answer depends on the SDK:

| SDK | BYO HTTP client for downstream? | Why |
|---|---|---|
| **msal-dotnet** | ✅ Yes | Binding cert is in Windows Certificate Store; `GetRSAPrivateKey()` works; add to `HttpClientHandler.ClientCertificates` |
| **msal-go** | ✅ Yes | `result.BindingTLSCertificate` contains a `crypto.Signer` backed by CNG — use directly in `tls.Config` on any `http.Client` |
| **msal-node** | ❌ No | Private key is non-exportable from KeyGuard CNG; Node.js/OpenSSL cannot use it; must use `MtlsManagedIdentityApplication`'s transport |
| **msal-java** | ❌ No | Same KeyGuard constraint; private key held internally as `CngRsaPrivateKey`; must use `MtlsMsiClient.httpRequest()` |
| **msal-python** | ❌ No | Same KeyGuard constraint; no downstream helper exposed yet |

**What this means for Azure SDK:** For msal-node, msal-java, and msal-python, Azure SDK cannot use its own HTTP pipeline for the downstream mTLS resource call. The call must go through MSAL's transport. This is a hard constraint of the current KeyGuard architecture — not a gap that can be bridged at the Azure SDK layer. **Custom network clients (axios, node-fetch, requests, HttpPipeline, etc.) are not supported for downstream mTLS calls on these SDKs.**

This also applies to MSAL-level network customization. For example, msal-node's standard `ManagedIdentityApplication` accepts a custom `INetworkModule` via `system.networkClient`. `MtlsManagedIdentityApplication` intentionally omits this option — WinHTTP is mandatory because the KeyGuard private key is non-exportable and cannot be presented to Node.js's OpenSSL-based TLS stack. The same constraint applies to msal-java and msal-python.

### Path forward: software key pivot

The software key pivot (direction indicated by Dragos, the mTLS PoP architect) resolves this constraint universally. With software/exportable keys:

- MSAL extracts the PEM bytes from CNG and returns them in the auth result alongside the binding certificate
- Azure SDK configures its own HTTP client with `{ cert: result.bindingCertificate, key: result.bindingKey }` — the same pattern on every SDK
- MSAL's built-in transport helpers become optional convenience wrappers rather than mandatory requirements
- `AttestationClientLib.dll` and equivalent native attestation dependencies can be removed entirely

Until that pivot lands, **the recommendation is to use MSAL's app-specific transport for downstream calls on msal-node, msal-java, and msal-python**, and BYO HTTP client on msal-dotnet and msal-go.
