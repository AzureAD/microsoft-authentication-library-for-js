# DPoP contract support

MSAL common exposes DPoP contract constants and request fields used by higher-level MSAL packages as they add Demonstrating Proof-of-Possession support.

## Public constants and fields

- `AuthenticationScheme.DPOP` uses the request contract value `dpop`.
- `DPOP_TOKEN_TYPE` uses the token response `token_type` value `DPoP`.
- `HeaderNames.DPopNonce` is the `DPoP-Nonce` response header name.
- `DPOP_NONCE_CACHE_KEY` and `DPOP_NONCE_CACHE_VERSION` identify cached DPoP nonce entries.
- `CommonAuthorizationUrlRequest.dpopJkt` adds the `dpop_jkt` authorize request parameter when provided with `authenticationScheme: AuthenticationScheme.DPOP`. This value is the JWK thumbprint of the DPoP key to bind to the authorization code.
- `AuthenticationResult.dpopProof` is reserved for a generated DPoP proof JWT. It is optional and is not populated until DPoP token acquisition is fully supported.

## Nonce parsing

Use `AuthenticationHeaderParser.getDPoPNonce()` to read the standalone `DPoP-Nonce` response header. Header names are matched case-insensitively so network clients that normalize headers to lower-case, such as `dpop-nonce`, are handled correctly.

`getDPoPNonce()` does not parse `WWW-Authenticate` or `Authentication-Info` challenge parameters. Use `getShrNonce()` for existing SHR/PoP nonce challenge parsing.

## Current limitations

MSAL common currently fails closed when `AuthenticationScheme.DPOP` is used for token acquisition. `AuthorizationCodeClient` and `RefreshTokenClient` throw `ClientConfigurationErrorCodes.dpopMissingResourceContext` instead of silently sending a bearer-equivalent token request. Full DPoP proof generation, token endpoint parameters, nonce retry handling, and `AuthenticationResult.dpopProof` population must be provided before callers can use DPoP token acquisition end to end.

`ClientConfigurationErrorCodes.dpopNonceRetryFailed` is reserved for DPoP nonce retry failures when retry support is wired by a higher-level package.

## Feature flag waiver, rollout, and rollback

This change only exposes shared DPoP contract constants, request fields, and fail-closed validation. It does not enable end-to-end DPoP token acquisition, proof generation, or cache persistence, so no runtime feature flag is required for this package-level contract update.

Rollout is staged through the normal MSAL package release process with the MSAL.js maintainers owning validation. Success criteria are that existing Bearer, PoP, and SSH flows remain unchanged while DPoP requests fail early with `dpop_missing_resource_context` until a higher-level package supplies the missing proof and resource binding context. Rollback is to revert the package release or revert the DPoP contract change before publishing a follow-up patch.
