# DPoP contract scaffolding

MSAL common includes DPoP contract fields and constants used by package-specific implementations. DPoP token acquisition is not enabled in this package yet. Requests that set `authenticationScheme` to `AuthenticationScheme.DPOP` fail closed with `ClientAuthErrorCodes.dpopNotEnabled`.

## Public contracts

- `AuthenticationScheme.DPOP` uses the canonical DPoP token type value, `DPoP`.
- `DPOP_TOKEN_TYPE` is the internal token type constant for DPoP-bound access tokens.
- `CommonAuthorizationUrlRequest.dpopJkt` carries the JWK thumbprint for authorization requests.
- `BaseAuthRequest.dpopProof` carries the proof for token requests.
- `AuthenticationResult.dpopProof` returns the DPoP proof associated with the request when one is supplied.
- `AuthenticationHeaderParser.getDPoPNonce()` reads the `DPoP-Nonce` response header.

## Error codes

- `dpop_not_enabled`: DPoP was requested before the package has enabled DPoP token acquisition.
- `dpop_missing_resource_context`: DPoP proof generation did not receive the required resource context.
- `dpop_nonce_retry_failed`: Retrying a DPoP request with a nonce did not succeed.
