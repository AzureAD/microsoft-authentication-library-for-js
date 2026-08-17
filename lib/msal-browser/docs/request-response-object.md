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

## Request Parameters for Brokered Authentication

### `skipBrokerClaims`

When set to `true` on a request that also specifies an `embeddedClientId`, the `clientCapabilities` configured on the application (e.g. `["CP1", "CP2"]`) will be excluded from the `claims` parameter sent to the `/authorize` and `/token` endpoints. This is intended for brokered authentication flows where the embedded (child) application should not inherit the broker (parent) application's client capabilities.

Both conditions must be met for capabilities to be excluded:

- `skipBrokerClaims` is `true` on the request
- `embeddedClientId` is set on the request (which results in the `brk_client_id` parameter being present)

If only one condition is met, `clientCapabilities` are included as normal.

#### Example

```javascript
const request = {
    scopes: ["User.Read"],
    embeddedClientId: "child-app-client-id",
    skipBrokerClaims: true,
};

// clientCapabilities from config will NOT be sent in the claims parameter
const response = await msalInstance.acquireTokenSilent(request);
```

#### Behavior Summary

| `skipBrokerClaims` | `broker param` set | `clientCapabilities` included in claims |
|--------------------|------------------------|-----------------------------------------|
| `false` / not set  | Yes                    | Yes                                     |
| `false` / not set  | No                     | Yes                                     |
| `true`             | No                     | Yes                                     |
| `true`             | Yes                    | **No**                                  |

## DPoP request and response fields

To request sender-constrained access tokens using the DPoP standard, set `authenticationScheme` to `AuthenticationScheme.DPOP` on popup, redirect, silent, or `ssoSilent` requests and provide both `resourceRequestMethod` and `resourceRequestUri`.

```javascript
const request = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.DPOP,
    resourceRequestMethod: "GET",
    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
};
```

MSAL returns the raw DPoP access token in `AuthenticationResult.accessToken` and a separate fresh resource proof in `AuthenticationResult.dpopProof`. Attach both to the resource call:

```javascript
headers.append("Authorization", `${result.tokenType} ${result.accessToken}`);
headers.append("DPoP", result.dpopProof);
```
