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

# End Session Request

The logout API also accepts an object for different configuration options:

```
{
    // Account to log out of
    account?: AccountInfo,
    // postLogoutRedirectUri, overrides whatever is passed in config
    postLogoutRedirectUri?: string,
    // authority to send end session request to
    authority?: string,
    // Correlation ID to attach to URL
    correlationId?: string
    // B2C Only: id_token_hint to attach to URL
    idTokenHint?: string
}
```

## Code Snippet

```javascript
const currentAccount = msalInstance.getAccountByHomeId(homeAccountId);
msalInstance.logout({
    account: currentAccount,
    postLogoutRedirectUri: "https://contoso.com/loggedOut",
    authority: "https://loginmicrosoftonline.com/common",
    correlationId: "insert-id-here"
});
```

Important Notes:

- If no account is passed to the logout API, or no EndSessionRequest object, it will log out of all accounts.
- If an account is passed to the logout API, MSAL will only clear tokens related to that account.

# Next Steps

Dig into more advanced topics, such as:

- [Caching](./caching.md)
- [Advanced Configuration Options](./configuration.md)

...and [more](../README.md#advanced-topics)!
