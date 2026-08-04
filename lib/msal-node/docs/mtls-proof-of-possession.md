# mTLS Proof-of-Possession (SN/I certificate)

> :warning: Before you start here, make sure you understand [Using certificate credentials with MSAL Node](./certificate-credentials.md) and [Subject Name/Issuer Authentication](./sni.md).

## Overview

Normally, a confidential client configured with a Subject Name + Issuer (SN/I) certificate uses that certificate to **sign a `private_key_jwt` client assertion**. Entra ID (ESTS) validates the assertion and returns a **Bearer** token. This is the existing "SNI + Bearer" flow and is unchanged.

**mTLS Proof-of-Possession (`mtls_pop`)** uses the *same* certificate differently: MSAL presents it as the **client TLS certificate** in the mutual-TLS handshake to the token endpoint. ESTS returns a token whose `token_type` is `mtls_pop`, cryptographically **bound to that certificate** (`cnf`/`x5t#S256`). The credential is identical — only the mechanism changes (assertion signer → TLS client certificate).

A resource server that accepts an `mtls_pop` token verifies that the caller presents the same certificate on its own TLS connection, so a stolen token cannot be replayed without the private key.

## Opting in

mTLS PoP is opt-in per request via `mtlsProofOfPossession: true` on `acquireTokenByClientCredential`. The certificate stays in `auth.clientCertificate` exactly as for SNI + Bearer.

```js
const msal = require("@azure/msal-node");
require("dotenv").config();

const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientCertificate: {
            thumbprintSha256: process.env.CLIENT_CERTIFICATE_THUMBPRINT_SHA_256,
            privateKey: process.env.CLIENT_CERTIFICATE_PRIVATE_KEY,
            x5c: process.env.CLIENT_CERTIFICATE_X5C,
        },
    },
});

const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
    azureRegion: "westus3", // recommended; falls back to the global mTLS endpoint if omitted
    mtlsProofOfPossession: true,
});

result.tokenType; // "mtls_pop"
result.bindingCertificate; // { x5c, thumbprintSha256 } — the certificate the token is bound to
```

`result.bindingCertificate` returns only **public material** (the certificate chain and its SHA-256 thumbprint). MSAL never returns the private key — the application already holds it and presents it as the client TLS certificate when calling the protected resource.

## Requirements and limitations

-   **Node only.** mTLS PoP is not available in the browser.
-   **MSAL owns the transport.** MSAL attaches the client certificate to the outbound TLS connection using its built-in `node:https` HttpClient. A custom `networkClient` (`INetworkModule`) cannot bind a client certificate, so supplying one together with `mtlsProofOfPossession` fails fast.
-   **Tenanted authority required.** `/common` and `/organizations` authorities are rejected on the mTLS path — use a tenanted authority (`https://login.microsoftonline.com/<tenantId>`).
-   **Public cloud only (today).** The token host becomes `mtlsauth.microsoft.com` (global) or `{region}.mtlsauth.microsoft.com` (regional). US Gov and China clouds fail fast for now.
-   **Resource must be allow-listed.** ESTS gates mTLS PoP on the **resource audience** (e.g. Microsoft Graph, Azure Key Vault), not on the client app. Request an allow-listed resource.

## Region guidance

A region is **recommended but optional**. When `azureRegion` is set, MSAL targets `{region}.mtlsauth.microsoft.com`; when omitted, it targets the global `mtlsauth.microsoft.com`. See [Regional authorities](./regional-authorities.md) for how regions are configured and auto-detected.

## Calling the protected resource

When calling the resource with an `mtls_pop` token, present the binding certificate as the client TLS certificate on the connection to the resource, and send the token with the `mtls_pop` (PoP) authentication scheme rather than `Bearer`. The certificate you present must be the one identified by `result.bindingCertificate` (its private key is the one already configured on the app).

A complete, runnable example lives in the sample: [client-credentials-mtls-pop](../../../samples/msal-node-samples/client-credentials-mtls-pop).

## Cache behavior

`mtls_pop` tokens are cached separately from Bearer tokens and from tokens bound to a different certificate — the cache key includes the token type and the binding certificate's key id (`x5t#S256`). Existing Bearer cache entries are unaffected.

## Error handling

mTLS PoP **fails closed** — because the whole point of `mtls_pop` is a certificate-bound token, MSAL never silently downgrades to a Bearer token:

-   **`token_type_mismatch` (`ClientAuthError`).** `mtlsProofOfPossession: true` was requested but the identity provider returned a token whose `token_type` is not `mtls_pop` (for example a Bearer downgrade, or a response with no `token_type`). MSAL throws before the token is cached or returned, so a caller never receives a token that only looks bound; the error message reports the requested scheme and the `token_type` that was actually returned. Treat this as a resource-allow-listing or configuration problem (see [Requirements and limitations](#requirements-and-limitations)) rather than retrying.
-   **`mtls_binding_certificate_missing` (`NodeAuthError`).** `mtlsProofOfPossession: true` was requested but no usable binding certificate is configured. Configure `auth.clientCertificate` with **both** an `x5c` (certificate or chain) and a `privateKey`; a thumbprint-only certificate is not sufficient for mTLS PoP.
-   **`mtls_binding_certificate_missing_private_key` (`NodeAuthError`).** The configured certificate has no `privateKey`. mTLS PoP needs the private key to complete the mutual-TLS handshake.
-   **`mtls_custom_network_client_unsupported` (`NodeAuthError`).** `mtlsProofOfPossession: true` was combined with a custom `networkClient`. MSAL must own the transport to attach the client certificate — remove the custom `networkClient` for mTLS PoP requests.

## Backward compatibility

All new fields are optional. When `mtlsProofOfPossession` is not set, the certificate is used exactly as before to sign a client assertion (SNI + Bearer). The Signed HTTP Request (`pop`) scheme is also unchanged.
