# MSAL Angular Public APIs for MSAL Angular v1

Before you start here, make sure you understand how to [initialize the application object](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v1-docs/initialization.md).

The login APIs in MSAL retrieve an `authorization code` which can be exchanged for an [ID token](https://docs.microsoft.com/azure/active-directory/develop/id-tokens) for a signed in user, while consenting scopes for an additional resource, and an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can read more about ID tokens on our [Azure Docs pages](https://docs.microsoft.com/azure/active-directory/develop/id-tokens).

## Login and AcquireToken APIs

The wrapper exposes APIs for login, logout, acquiring access token and more.

1. `loginPopup()`
2. `loginRedirect()`
3. `logout()`
4. `acquireTokenPopup()`
5. `acquireTokenRedirect()`
6. `acquireTokenSilent()`
7. `getAccounts()`
8. `ssoSilent()`
