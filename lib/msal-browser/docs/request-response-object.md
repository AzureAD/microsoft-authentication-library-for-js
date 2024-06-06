# Request and Response Objects

First, please read about how to [initialize the `PublicClientApplication` object](./initialization.md), [login](./login-user.md) and [acquire tokens](./acquire-token.md).

The MSAL Browser library has a set of configuration options that can be used to customize the behavior of your authentication flows. Some of these options can be set in the [constructor of the `PublicClientApplication` object](./configuration.md), and most of them can be set on a per-request basis. The table below details the configuration objects that can be passed to the login and acquireToken APIs, and the objects returned representing the response.

| API | Request Object | Response Object |
|-----|----------------|-----------------|
| `acquireTokenPopup` | [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authenticationresult) |
| `acquireTokenRedirect` | [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authenticationresult) (via `handleRedirectPromise`) |
| `acquireTokenSilent` | [SilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#silentrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authenticationresult) |
| `loginPopup` | [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authenticationresult) |
| `loginRedirect` | [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authenticationresult) (via `handleRedirectPromise`) |
| `logoutRedirect` | [EndSessionRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest) | `void` |
| `logoutPopup` | [EndSessionPopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest) | `void` |
| `ssoSilent` | [SsoSilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#ssosilentrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authenticationresult) |
