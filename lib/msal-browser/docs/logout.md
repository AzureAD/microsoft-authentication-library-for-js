# Logging Out of MSAL

Before you start here, make sure you understand how to [login](./login-user.md), [acquire tokens](./acquire-token.md), and [manage token lifetimes](./token-lifetimes.md).

## Logging out

The logout process for MSAL takes two steps.

1. Clear the MSAL cache.
2. Clear the session on the identity server.

The `PublicClientApplication` object exposes 2 APIs that perform these actions.

```javascript
msalInstance.logoutRedirect();
msalInstance.logoutPopup();
```

These APIs will clear the token cache of any user and session data, then navigate the browser window or popup window to the server's logout page. The server will then prompt the user to select the account they would like to be signed out of and redirect back to the page the url provided as `postLogoutRedirectUri`.

**IMPORTANT:** If this logout navigation is interrupted in any way, your MSAL cache may be cleared but the session may still persist on the server. Ensure the navigation fully completes before returning to your application.

```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.con/{your_tenant_id}',
        redirectUri: 'https://contoso.com',
        postLogoutRedirectUri: 'https://contoso.com/homepage'
    }
};
```

## Request objects

Configuration options can be provided to each of the logout APIs to customize the behavior:

- [logoutRedirect request](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest)
- [logoutPopup request](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest)

## logoutRedirect

Using `logoutRedirect` will clear local cache of user tokens then redirect the window to the server signout page. The promise returned by `logoutRedirect` is not expected to resolve but you can await it if you need to block other code from running before the redirect is initiated.

[Configuration options](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest) can be provided to customize the behavior:

```javascript
const currentAccount = msalInstance.getAccountByHomeId(homeAccountId);
await msalInstance.logoutRedirect({
    account: currentAccount,
    postLogoutRedirectUri: "https://contoso.com/loggedOut"
});
```

### Skipping the server sign-out

**WARNING:** Skipping the server sign-out means the user's session will remain active on the server and can be signed back into your application without providing credentials again.

If you want your application to only perform local logout you can provide a callback to the `onRedirectNavigate` parameter on the request and have the callback return false.

```javascript
msalInstance.logoutRedirect({
    onRedirectNavigate: (url) => {
        // Return false if you would like to stop navigation after local logout
        return false;
    }
});
```

## logoutPopup

The `logoutPopup` API will open the server signout page in a popup, allowing your application to maintain its current state. Due to this there are a few additional considerations over `logoutRedirect` when choosing to use popups to logout:

- The promise returned by `logoutPopup` is expected to resolve after the popup closes
- `postLogoutRedirectUri` is **required** in order for MSAL to be able to close the popup when signout is complete
- `postLogoutRedirectUri` will be opened in the popup window, not the main frame. If you need your top level app to be redirected after logout you can use the `mainWindowRedirectUri` parameter on the logout request.

[Configuration options](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest) can be provided to customize the behavior.

```javascript
const currentAccount = msalInstance.getAccountByHomeId(homeAccountId);
await msalInstance.logoutPopup({
    account: currentAccount,
    postLogoutRedirectUri: "https://contoso.com/loggedOut",
    mainWindowRedirectUri: "https://contoso.com/homePage"
});
```

## Front-channel logout

Azure AD and Azure AD B2C support the [OAuth front-channel logout feature](https://openid.net/specs/openid-connect-frontchannel-1_0.html), which enables single-sign out across all applications when a user initiates logout. To take advantage of this feature with MSAL.js, perform the following steps:

1. In your application, create a dedicated logout page. This page **should not** perform any other function, such as acquiring tokens on page load (see below for details). Note, this page will be loaded in a hidden iframe, and for Azure AD and MSA users, will include the `iss` and `sid` query parameters.
2. In the Azure Portal, navigate to the **Authentication** page for your application, and register the page from step one under **Front-channel logout URL**. Note, this page must be loaded via `https`.

### Requirements for front-channel logout page

The page used for front-channel logout should be built as follows:

1. On page load, automatically invoke the MSAL `logoutRedirect` API.
2. In the `PublicClientApplication` configuration, set `system.allowRedirectInIframe` to `true`.
3. When invoking `logout`, we recommend preventing the redirect in the iframe to the logout page (see [above](#skipping-the-server-sign-out)).

Example:

```typescript
const msal = new PublicClientApplication({
    auth: {
        clientId: "my-client-id"
    },
    system: {
        allowRedirectInIframe: true
    }
})

// Automatically on page load
msal.logoutRedirect({
    onRedirectNavigate: () => {
        // Return false to stop navigation after local logout
        return false;
    }
});
```

Now when a user logouts out of another application, your application's front-channel logout url will be loaded in a hidden iframe, and MSAL.js will clear its cache to complete single-sign out.


### Front-channel logout samples

The following samples demonstrate how to implement front-channel logout using MSAL.js:

- MSAL Angular v2: [Angular 11 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app)
- MSAL React: [React Router sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/react-router-sample)

## Events

If different parts of your app need to react to logout status without direct access to the promise returned by `logoutRedirect` or `logoutPopup` you can use the [event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md).

Events will be emitted when logout succeeds or fails and when the popup is opened when using `logoutPopup`.

## Important Notes

- If no account is passed to the logout API, or no EndSessionRequest object, it will log out of all accounts.
- If an account is passed to the logout API, MSAL will only clear tokens related to that account.
- Server signout is a convenience feature and, as such, is done with best effort. Logout APIs will resolve successfully as long as the local application cache has been successfully cleared, regardless of whether or not server signout is successful.

## Next Steps

Dig into more advanced topics, such as:

- [Caching](./caching.md)
- [Advanced Configuration Options](./configuration.md)

...and [more](../README.md#advanced-topics)!
