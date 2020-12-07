# Request and Response Objects

First, please read about how to [initialize the `PublicClientApplication` object](./initialization.md), [login](./login-user.md) and [acquire tokens](./acquire-token.md).

The MSAL Browser library has a set of configuration options that can be used to customize the behavior of your authentication flows. Some of these options can be set in the [constructor of the `PublicClientApplication` object](./configuration.md), and most of them can be set on a per-request basis. The table below details the configuration objects that can be passed to the login and acquireToken APIs, and the objects returned representing the response.


| API | Request Object | Response Object |
|-----|----------------|-----------------|
| `acquireTokenPopup` | [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_popuprequest_.html#popuprequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#authenticationresult) |
| `acquireTokenRedirect` | [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_redirectrequest_.html#redirectrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#authenticationresult) (via `handleRedirectPromise`) |
| `acquireTokenSilent` | [SilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_silentrequest_.html#silentrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#authenticationresult) |
| `loginPopup` | [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_popuprequest_.html#popuprequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#authenticationresult) |
| `loginRedirect` | [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_redirectrequest_.html#redirectrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#authenticationresult) (via `handleRedirectPromise`) |
| `logout` | [EndSessionRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#endsessionrequest) | `void` |
| `ssoSilent` | [SsoSilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_ssosilentrequest_.html#ssosilentrequest) | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_index_.html#authenticationresult) |

