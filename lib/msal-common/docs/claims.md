# Claims and Claims Challenges in MSAL

A resource server may deem an access token it receives as having insufficient claims. If the client application that sends the access token has declared itself to be capable, the resource server may respond with a claims challenge, upon which the client can acquire a new token satisfying the claims challenge.

MSAL supports clients to declare themselves capable of claims challenges (i.e. `clientCapabilities`). This can be configured via the configuration object used during MSAL instantiation:

- msal-browser [configuration](../../msal-browser/docs/configuration.md)
- msal-node [configuration](../../msal-node/docs/configuration.md)

MSAL's `login*` and `acquireToken*` APIs accepts a `claims` parameter as part of the [request object](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#baseauthrequest) to acquire a new token with the said claims.

For more information, please refer to: [Claims challenges, claims requests, and client capabilities](https://learn.microsoft.com/en-us/azure/active-directory/develop/claims-challenge)

## Samples

- [VanillaJS](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/client-capabilities)
- [React](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/2-Authorization-I/1-call-graph)
- [Angular](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/2-Authorization-I/1-call-graph)