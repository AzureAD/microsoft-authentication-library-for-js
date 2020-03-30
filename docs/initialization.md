# Initialization of MSAL

Before you get started, please ensure you have completed all the [prerequisites](../README.md#prerequisites).

In this document:
- [Initializing the PublicClientApplication object](#initializing-the-publicclientapplication-object)
- [(Optional) Configure Authority](#optional-configure-authority)
- [(Optional) Configure Redirect URI](#optional-configure-redirect-uri)
- [(Optional) Additional Configuration](./configuration.md)
- [Choosing an Interaction Type](#choosing-an-interaction-type)

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
        authority: 'https://login.microsoftonline.con/common/'
    }
};
```

If your application audience is a single tenant, you must provide an authority with your tenant id like below:
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.con/{your_tenant_id}'
    }
};
```

## (Optional) Configure Redirect URI

By default, MSAL is configured to set the redirect URI to the current page that it is running on. If you would like to receive the authorization code on a different page than the one running MSAL, you can set this in the configuration:
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.con/{your_tenant_id}',
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

### Redirect APIs

- `loginRedirect`
- `acquireTokenRedirect`

The redirect APIs do not use Promises, but are `void` functions which redirect the browser window after caching some basic info. If you choose to use the redirect APIs, you **MUST** call the following function **IMMEDIATELY** after the constructor in order to process the returning fragment containing the code and response and obtain an access token:
```javascript
msalInstance.handleRedirectCallback((error, response) => {
    // handle redirect response or error
});
```
This will also allow you to retrieve tokens on page reload.

It is not recommended to use both interaction types in a single application.

# Next Steps

You are ready to perform a [login](./login-user.md)!
