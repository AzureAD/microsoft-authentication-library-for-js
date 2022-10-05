# Acquiring and Using an Access Token

> :information_source: Before you start here, make sure you understand how to [initialize the application object](./initialization.md).

In MSAL, you can get access tokens for the APIs your app needs to call using the `acquireToken*` methods provided by the library. The `acquireToken*` methods abstract away the 2 steps involved in acquiring tokens with the [OAuth 2.0 authorization code flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow):

1. make a request to Azure AD to obtain an `authorization code`
1. exchange that code for an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes

You can read more about access tokens [here](https://docs.microsoft.com/azure/active-directory/develop/access-tokens).

## Choosing an Interaction Type

See [here](./initialization.md#choosing-an-interaction-type) if you are uncertain about the differences between `acquireTokenRedirect` and `acquireTokenPopup`.

## Acquiring an Access Token

MSAL uses a [cache](./caching.md) to store tokens based on specific parameters including scopes, resource and authority, and will retrieve the token from the cache when needed. It also can perform silent renewal of those tokens when they have expired. MSAL exposes this functionality through the `acquireTokenSilent` method.

It is best practice to attempt an `acquireTokenSilent` call before using the interactive APIs if you have already logged in. This allows you to prevent unnecessary user interactions. `acquireTokenSilent` will look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you. You should use a `loginXXXXX` or `acquireTokenXXXXX` (interactive) API before this to establish a session with the server.

If the `acquireTokenSilent` call attempts a refresh token call and the refresh token is expired, MSAL will attempt to make a silent request in an iframe for a new authorization code. If your session still exists, you will obtain a new authorization code silently, which will be immediately traded for an access token.

If the silent iframe call for a new authorization code fails, you need to initiate an interactive request. This could happen for many reasons including scopes that have been revoked, expired tokens, or password changes. MSAL will throw a specific InteractionRequiredAuthError error type when this error occurs.

You can read more about using `acquireTokenSilent` [here](./token-lifetimes.md).

You must pass a request object to the acquireToken APIs. This object allows you to use different parameters in the request. See [here](./request-response-object.md) for more information on the request object parameters. Scopes are required for all acquireToken calls.

A Cache Lookup Policy can be optionally provided to the request. The Cache Lookup Policies are:
- `CacheLookupPolicy.Default` - `acquireTokenSilent` will attempt to retrieve an access token from the cache. If the access token is expired or cannot be found the refresh token will be used to acquire a new one. Finally, if the refresh token is expired, `acquireTokenSilent` will attempt to silently acquire a new access token, id token, and refresh token.
- `CacheLookupPolicy.AccessToken` - `acquireTokenSilent` will only look for access tokens in the cache. It will not attempt to renew access or refresh tokens.
- `CacheLookupPolicy.AccessTokenAndRefreshToken` - `acquireTokenSilent` will attempt to retrieve an access token from the cache. If the access token is expired or cannot be found, the refresh token will be used to acquire a new one. If the refresh token is expired, it will not be renewed and `acquireTokenSilent` will fail.
- `CacheLookupPolicy.RefreshToken` - `acquireTokenSilent` will not attempt to retrieve access tokens from the cache and will instead attempt to exchange the cached refresh token for a new access token. If the refresh token is expired, it will not be renewed and `acquireTokenSilent` will fail.
- `CacheLookupPolicy.RefreshTokenAndNetwork` - `acquireTokenSilent` will not look in the cache for the access token. It will go directly to network with the cached refresh token. If the refresh token is expired an attempt will be made to renew it. This is equivalent to setting `forceRefresh: true`.
- `CacheLookupPolicy.Skip` - `acquireTokenSilent` will attempt to renew both access and refresh tokens. It will not look in the cache. This will always fail if 3rd party cookies are blocked by the browser.

- Popup

```javascript
var request = {
    scopes: ["Mail.Read"],
    cacheLookupPolicy: CachePolicyLookup.Default // will default to CacheLookupPolicy.Default if omitted
};

msalInstance.acquireTokenSilent(request).then(tokenResponse => {
    // Do something with the tokenResponse
}).catch(async (error) => {
    if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        return msalInstance.acquireTokenPopup(request);
    }
}).catch(error => {
    handleError(error);
});
```

- Redirect

```javascript
var request = {
    scopes: ["Mail.Read"],
    cacheLookupPolicy: CachePolicyLookup.Default // will default to CacheLookupPolicy.Default if omitted
};

msalInstance.acquireTokenSilent(request).then(tokenResponse => {
    // Do something with the tokenResponse
}).catch(error => {
    if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        return msalInstance.acquireTokenRedirect(request)
    }
});
```

## Using the Access Token

Once you have retrieved the access token, you must include it in the `Authorization` header as a bearer token for the request to the resource you obtained the token for, as shown below:

```JavaScript
var headers = new Headers();
var bearer = "Bearer " + tokenResponse.accessToken;
headers.append("Authorization", bearer);
var options = {
        method: "GET",
        headers: headers
};
var graphEndpoint = "https://graph.microsoft.com/v1.0/me";

fetch(graphEndpoint, options)
    .then(resp => {
            //do something with response
    });
```

## Next Steps

Learn about [token lifetimes, expiration and renewal](./token-lifetimes.md).
