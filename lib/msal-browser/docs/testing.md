# Testing

## The loadExternalTokens() API

The `loadExternalTokens()` API allows the loading of id, access and refresh tokens to the MSAL cache, which can then be fetched using `acquireTokenSilent()`.

**Note: This is an advanced feature that is intended for testing purposes in the browser environment only. We do not recommend using this in a production app. For E2E testing recommendations, please refer to our [TestingSample](../../../samples/msal-browser-samples/TestingSample) instead.**

The `loadExternalTokens()` API can be accessed by calling `getTokenCache()` on MSAL Browser's `PublicClientApplication` instance.

```js
const msalTokenCache = myMSALObj.getTokenCache();
await msalTokenCache.loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

`loadExternalTokens()` takes in a request of type `SilentRequest`, a response of type `ExternalTokenResponse`, and options of type `LoadTokenOptions`.

See the type definitions for each, which can be imported from `@azure/msal-browser`:

-   [`SilentRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.SilentRequest.html)
-   [`ExternalTokenResponse`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.ExternalTokenResponse.html)
-   [`LoadTokenOptions`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.LoadTokenOptions.html)

## Loading tokens

You can provide any combination of id, access and refresh tokens for caching but at a minimum the `loadExternalTokens` API requires one of the following sets of input parameters to identify token associations and cache appropriately:

-   A `SilentRequest` object with [account information](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.AccountInfo.html), OR
-   A `SilentRequest` object with the authority AND a `LoadTokenOptions` object with `clientInfo`, OR
-   A `SilentRequest` object with the authority AND a server response object with `client_info`
-   A `SilentRequest` object with the authority AND a server response object with `id_token`

The examples below show loading tokens individually, however, you may provide any 1, 2 or all 3 in a single request.

### Loading id tokens

In addition to the parameters listed [above](#loading-tokens) provide the following to load an id token:

1. A server response with the id_token field

An account will also be set in the cache based on the information provided above.

See the code examples below:

```ts
const silentRequest: SilentRequest = {
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id",
    },
};

const serverResponse: ExternalTokenResponse = {
    id_token: "id-token-here",
};

const loadTokenOptions: LoadTokenOptions = {};

const pca = new PublicClientApplication({
    auth: { clientId: "your-client-id" },
});
await pca.getTokenCache().loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);

// OR

const silentRequest: SilentRequest = {
    scopes: [],
    authority: "https://login.microsoftonline.com/your-tenant-id",
};

const serverResponse: ExternalTokenResponse = {
    id_token: "id-token-here",
};

const loadTokenOptions: LoadTokenOptions = {
    clientInfo: "client-info-here",
};

const pca = new PublicClientApplication({
    auth: { clientId: "your-client-id" },
});
await pca.getTokenCache().loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);

// OR

const silentRequest: SilentRequest = {
    scopes: [],
    authority: "https://login.microsoftonline.com/your-tenant-id",
};

const serverResponse: ExternalTokenResponse = {
    id_token: "id-token-here",
    client_info: "client-info-here",
};

const loadTokenOptions: LoadTokenOptions = {};

const pca = new PublicClientApplication({
    auth: { clientId: "your-client-id" },
});
await pca.getTokenCache().loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### Loading access tokens

In addition to the parameters listed [above](#loading-tokens) provide the following to load an access token:

1. A server response with an `access_token`, `expires_in`, `token_type`, and `scope`

See the code examples below:

```ts
const silentRequest: SilentRequest = {
    scopes: ["User.Read", "email"],
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id",
    },
};

const serverResponse: ExternalTokenResponse = {
    token_type: AuthenticationScheme.BEARER, // "Bearer"
    scope: "User.Read email",
    expires_in: 3599,
    access_token: "access-token-here",
};

const loadTokenOptions: LoadTokenOptions = {
    extendedExpiresOn: 6599,
};

const pca = new PublicClientApplication({
    auth: { clientId: "your-client-id" },
});
await pca.getTokenCache().loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### Loading refresh tokens

In addition to the parameters listed [above](#loading-tokens) provide the following to load a refresh token:

1. A server response with a `refresh_token` and optionally `refresh_token_expires_in`

See the code examples below:

```ts
const silentRequest: SilentRequest = {
    scopes: [],
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id",
    },
};

const serverResponse: ExternalTokenResponse = {
    refresh_token: "refresh-token-here",
    refresh_token_expires_in: "86399",
};

const loadTokenOptions: LoadTokenOptions = {};

const pca = new PublicClientApplication({
    auth: { clientId: "your-client-id" },
});
await pca.getTokenCache().loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```
