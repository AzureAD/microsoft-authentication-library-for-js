# Token Lifetimes, Expiration, and Renewal

Before you start here, make sure you understand how to [login](./login-user.md) and [acquire tokens](./acquire-token.md).

While using MSAL.js, you should understand the implications of retrieving tokens for users and how to manage the lifetimes for these tokens.

## Token Lifetimes and Expiration

A more detailed explanation of token lifetimes can be found [here](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes). Some of the information is summarized below.

### ID tokens

ID tokens are bound to a specific combination of account and client, and usually contain profile information about the user. Typically, a web application's user session lifetime will match that of the ID token session lifetime, which is by default 24 hours. You can read more about configuring token lifetimes [here](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes).

### Access tokens

Access tokens in the browser have a default recommended expiration of 1 hour. After this 1 hour, any bearer calls with the expired token will be rejected. This token can be refreshed silently using the refresh token retrieved with this token. You can read more about configuring token lifetimes [here](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes).

### Refresh tokens

Refresh tokens given to Single-Page Applications are limited-time refresh tokens (usually 24 hours from the time of retrieval). This is a non-adjustable, non-sliding window, lifetime. Whenever a refresh token is used to renew an access token, a new refresh token is fetched with the renewed access token. This new refresh token will have a lifetime equal to the remaining lifetime of the original refresh token. Once a refresh token has expired, a new authorization code flow must be initiated to retrieve an authorization code and trade it for a new set of tokens.

Note: When a new refresh token is obtained, msal.js replaces the cached refresh token with the new refresh token, however the old refresh token is not invalidated by the server and may still be used to obtain access tokens until its expiration.

## Token Renewal

The `PublicClientApplication` object exposes an API called `acquireTokenSilent` which is meant to retrieve non-expired token silently. It does this in a few steps:

1. Check if a token already exists in the token cache for the given `scopes`, `client id`, `authority`, and/or `homeAccountIdentifier`.
2. If a token exists for the given parameters, then ensure we get a single match and check the expiration.
3. If the access token is not expired, MSAL will return a response with the relevant tokens.
4. If the access token is expired but the refresh token is still valid, MSAL will use the given refresh token to retrieve a new set of tokens, and then return a response.
5. If the refresh token is expired, MSAL will attempt to retrieve an access tokens silently using a hidden iframe. This will use the sid or username in the account's claims object to retrieve a hint about the user's session. If this hidden iframe call fails, MSAL will pass on an error from the server as an `InteractionRequiredAuthError`, asking to retrieve an authorization code to retrieve a new set of tokens. You can do this by performing a login or acquireToken API call with the `PublicClientApplication` object. If the session is still active, the server will send a code without any user prompts. Otherwise, the user will be required to enter their credentials.

See [here](./request-response-object.md#silentflowrequest) for more information on what configuration parameters you can set for the `acquireTokenSilent` method.

### Cache Lookup Policy

A Cache Lookup Policy can be optionally provided to the request. The Cache Lookup Policies are:

- `CacheLookupPolicy.Default` - `acquireTokenSilent` will attempt to retrieve an access token from the cache. If the access token is expired or cannot be found the refresh token will be used to acquire a new one. Finally, if the refresh token is expired, `acquireTokenSilent` will attempt to silently acquire a new access token, id token, and refresh token.
- `CacheLookupPolicy.AccessToken` - `acquireTokenSilent` will only look for access tokens in the cache. It will not attempt to renew access or refresh tokens.
- `CacheLookupPolicy.AccessTokenAndRefreshToken` - `acquireTokenSilent` will attempt to retrieve an access token from the cache. If the access token is expired or cannot be found, the refresh token will be used to acquire a new one. If the refresh token is expired, it will not be renewed and `acquireTokenSilent` will fail.
- `CacheLookupPolicy.RefreshToken` - `acquireTokenSilent` will not attempt to retrieve access tokens from the cache and will instead attempt to exchange the cached refresh token for a new access token. If the refresh token is expired, it will not be renewed and `acquireTokenSilent` will fail.
- `CacheLookupPolicy.RefreshTokenAndNetwork` - `acquireTokenSilent` will not look in the cache for the access token. It will go directly to network with the cached refresh token. If the refresh token is expired an attempt will be made to renew it. This is equivalent to setting `forceRefresh: true`.
- `CacheLookupPolicy.Skip` - `acquireTokenSilent` will attempt to renew both access and refresh tokens. It will not look in the cache. This will always fail if 3rd party cookies are blocked by the browser.

### Code Snippets

#### Popup

```javascript
var username = "test@contoso.com";
var currentAccount = msalInstance.getAccountByUsername(username);
var silentRequest = {
    scopes: ["Mail.Read"],
    account: currentAccount,
    forceRefresh: false
    cacheLookupPolicy: CacheLookupPolicy.Default // will default to CacheLookupPolicy.Default if omitted
};

var request = {
    scopes: ["Mail.Read"],
    loginHint: currentAccount.username // For v1 endpoints, use upn from idToken claims
};

const tokenResponse = await msalInstance.acquireTokenSilent(silentRequest).catch(async (error) => {
    if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        return await msalInstance.acquireTokenPopup(request).catch(error => {
            if (error instanceof InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails
                return msalInstance.acquireTokenRedirect(request)
            }
        });
    }
});
```

#### Redirect

```javascript
var username = "test@contoso.com";
var currentAccount = msalInstance.getAccountByUsername(username);
var silentRequest = {
    scopes: ["Mail.Read"],
    account: currentAccount,
    forceRefresh: false
    cacheLookupPolicy: cacheLookupPolicy.Default // will default to CacheLookupPolicy.Default if omitted
};

var request = {
    scopes: ["Mail.Read"],
    loginHint: currentAccount.username // For v1 endpoints, use upn from idToken claims
};

const tokenResponse = await msalInstance.acquireTokenSilent(silentRequest).catch(error => {
    if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        return msalInstance.acquireTokenRedirect(request)
    }
});
```

## Next Steps

Learn how to perform [log out](./logout.md).
