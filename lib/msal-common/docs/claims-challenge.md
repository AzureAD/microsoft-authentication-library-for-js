# Handling a claims challenge with MSAL

A resource server may deem an access token it receives as having insufficient claims. If the client application that sends the access token has declared itself to be capable, the resource server may respond with a **claims challenge**, upon which the client can acquire a new token satisfying the claims challenge and try again.

MSAL's `login*` and `acquireToken*` APIs accept a `claims` parameter as part of the [request object](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#baseauthrequest) to acquire a new token with the specified claims. 

See also: [Client capability in MSAL](./client-capability.md)

For more information, please refer to:

- [Claims challenges, claims requests, and client capabilities](https://learn.microsoft.com/azure/active-directory/develop/claims-challenge)
- [How to use Continuous Access Evaluation enabled APIs in your applications](https://learn.microsoft.com/azure/active-directory/develop/app-resilience-continuous-access-evaluation)

## Samples

- [React](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/2-Authorization-I/1-call-graph)
- [Angular](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/2-Authorization-I/1-call-graph)
