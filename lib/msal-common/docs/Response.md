MSAL will return an `AuthenticationResult.ts` object as a response to all acquire token APIs:

#### `msal-browser` public APIs for token acquisition:
`loginPopup`, `acquireTokenPopup`, `acquireTokenSilent` or `handleRedirectPromise`

#### `msal-node` public APIs for token acquisition:
`acquireTokenByCode`, `acquireTokenSilent`, `acquireTokenByRefreshToken`, `acquireTokenByDeviceCode`

Reference docs for `AuthenticationResult` expanding on each parameter can be found [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/classes/_src_response_authenticationresult_.authenticationresult.html).
