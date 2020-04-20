# Logging Out of MSAL

Before you start here, make sure you understand how to [login](./login-user.md), [acquire tokens](./acquire-token.md), and [manage token lifetimes](./token-lifetimes.md).

## Logging out

The logout process for MSAL takes two steps.

1. Clear the MSAL cache.
2. Clear the session on the identity server.

The `PublicClientApplication` object exposes an API that performs these actions. 

```javascript
msalInstance.logout();
```

This API will clear the token cache of any user and session data, then navigate the browser window to the server's logout page. The server will then redirect back to the page that initiated the logout request. You can configure the location that the server redirects after logout using the `postLogoutRedirectUri` option when instantiating the `PublicClientApplication` object.

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

# Next Steps

Dig into more advanced topics, such as:

- [Caching](./caching.md)
- [Advanced Configuration Options](./configuration.md)

...and [more](../README.md#advanced-topics)!
