# Initialization of MSAL

Before you get started, please ensure you have completed all the [prerequisites](../README.md#prerequisites).

In this document:
- [Initialization of MSAL](#initialization-of-msal)
  - [Initializing the PublicClientApplication object](#initializing-the-publicclientapplication-object)
  - [(Optional) Configure Authority](#optional-configure-authority)
  - [(Optional) Configure Redirect URI](#optional-configure-redirect-uri)
  - [(Optional) Additional Configuration](#optional-additional-configuration)
  - [Choosing an Interaction Type](#choosing-an-interaction-type)
    - [Popup APIs](#popup-apis)
    - [Redirect APIs](#redirect-apis)
- [Next Steps](#next-steps)

## Initializing the PublicClientApplication object

In order to use MSAL.js, you need to instantiate a `PublicClientApplication` object. You must provide the `client id` (`appId`) of your application. 
```javascript
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
```

## (Optional) Configure Authority

By default, MSAL is configured with the `common` tenant, which is used for multi-tenant applications and applications allowing personal accounts (not B2C).
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.com/common/'
    }
};
```

If your application audience is a single tenant, you must provide an authority with your tenant id like below:
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.com/{your_tenant_id}'
    }
};
```

If your application is using a separate OIDC-compliant authority like `"https://login.live.com"` or an IdentityServer, you will need to provide it in the `knownAuthorities` field and set your `protocolMode` to `"OIDC"`.
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.live.com',
        knownAuthorities: ["login.live.com"],
        protocolMode: "OIDC"
    }
};
```

**Note**: The `protocolMode` configuration option, which tells MSAL whether to enable AAD-specific quirks, changes the following behavior:

- Authority metadata (since `v2.4.0`):
  - When set to `OIDC`, the library will not include `/v2.0/` in the authority path when fetching authority metadata.
  - When set to `AAD` (the default value), the library will include `/v2.0/` in the authority path when fetching authority metadata.

For more information on authority, please refer to: [Authority in MSAL](../../msal-common/docs/authority.md).

## (Optional) Configure Redirect URI

By default, MSAL is configured to set the redirect URI to the current page that it is running on. If you would like to receive the authorization code on a different page than the one running MSAL, you can set this in the configuration:
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.com/{your_tenant_id}',
        redirectUri: 'https://contoso.com'
    }
};
```

Any redirect URI used must be configured in the portal registration. You can also set the redirect URI per request using the [login](./login-user.md) and [request APIs](./acquire-token.md).

## (Optional) Additional Configuration

MSAL has additional configuration options which you can review [here](./configuration.md).

## Choosing an Interaction Type

In the browser, there are two ways you can present the login screen to your users from your application: 
- [presenting a popup window from the current page](#popup-apis)
- [redirecting the browser window to the login server](#redirect-apis)

### Popup APIs

- `loginPopup`
- `acquireTokenPopup`

The popup APIs use ES6 Promises that resolve when the authentication flow in the popup concludes and returns to the redirect URI specified, or reject if there are issues in the code or the popup is blocked.

#### RedirectUri Considerations

When using popup APIs we recommend setting the `redirectUri` to a blank page or a page that does not implement MSAL. This will help prevent potential issues as well as improve performance. If your application is only using popup and silent APIs you can set this on the `PublicClientApplication` config. If your application also needs to support redirect APIs you can set the `redirectUri` on a per request basis:

```javascript
msalInstance.loginPopup({
    redirectUri: "http://localhost:3000/blank.html"
});
```

### Redirect APIs

- `loginRedirect`
- `acquireTokenRedirect`

Note: If you are using `msal-angular` or `msal-react`, redirects are handled differently, and you should see the [`msal-angular` redirect doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) and [`msal-react` FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/FAQ.md#how-do-i-handle-the-redirect-flow-in-a-react-app) for more details.

The redirect APIs are asynchronous (i.e. return a promise) `void` functions which redirect the browser window after caching some basic info. If you choose to use the redirect APIs, be aware that **you MUST call `handleRedirectPromise()` to correctly handle the API**. You can use the following function to perform an action when this token exchange is completed:

```javascript
msalInstance.handleRedirectPromise().then((tokenResponse) => {
    // Check if the tokenResponse is null
    // If the tokenResponse !== null, then you are coming back from a successful authentication redirect. 
    // If the tokenResponse === null, you are not coming back from an auth redirect.
}).catch((error) => {
    // handle error, either in the library or coming back from the server
});
```

This will also allow you to retrieve tokens on page reload. See the [onPageLoad sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/onPageLoad/) for more information on usage.

It is not recommended to use both interaction types in a single application.

**Note:** `handleRedirectPromise` will optionally accept a hash value to be processed, defaulting to the current value of `window.location.hash`. This parameter only needs to be provided in scenarios where the current value of `window.location.hash` does not contain the redirect response that needs to be processed. **For almost all scenarios, applications should not need to provide this parameter explicitly.**

# Next Steps

You are ready to perform a [login](./login-user.md)!
