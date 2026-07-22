# Response

MSAL will return an `AuthenticationResult.ts` object as a response to all acquire token APIs:

#### `msal-browser` public APIs for token acquisition:

`loginPopup`, `acquireTokenPopup`, `acquireTokenSilent` or `handleRedirectPromise`

Reference docs for `AuthenticationResult` expanding on each parameter can be found [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/classes/_src_response_authenticationresult_.authenticationresult.html).

When a request uses `AuthenticationScheme.DPOP`, `AuthenticationResult.accessToken` contains the raw DPoP-bound access token and `AuthenticationResult.dpopProof` contains a separate proof JWT for the requested resource. MSAL generates a fresh `dpopProof` for each successful acquisition, including cache hits, and does not cache proof JWTs.
