# Testing

## The loadExternalTokens() API

MSAL Browser starting version 2.17.0 has added the `loadExternalTokens()` API, which allows the loading of id tokens and access tokens to the MSAL cache, which can then be fetched using `acquireTokenSilent()`. 

**Note: This is an advanced feature that is intended for testing purposes in the browser environment only. Loading tokens to your application's cache may cause your app to break. Additionally, we recommend `loadExternalTokens()` API to be used with unit and integration tests. For E2E testing, please refer to our [TestingSample](../../../samples/msal-browser-samples/TestingSample) instead.**

The `loadExternalTokens()` API can be accessed by calling `getTokenCache()` on MSAL Browser's `PublicClientApplication` instance. 

```js
const msalTokenCache = myMSALObj.getTokenCache();
msalTokenCache.loadExternalTokens(silentRequest, serverResponse, loadTokenOptions);
```

`loadExternalTokens()` takes in a request of type `SilentRequest`, a response of type `ExternalTokenResponse`, and options of type `LoadTokenOptions`.

See the type definitions for each, which can be imported from `@azure/msal-browser`:

- [`SilentRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#silentrequest)
- [`ExternalTokenResponse`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#externaltokenresponse)
    - Note that the server response you receive will also have a refresh token attached. Currently, `loadExternalTokens()` does not load refresh tokens.

```ts
export type LoadTokenOptions = {
    clientInfo?: string,
    extendedExpiresOn?: number
};
```

### Loading id tokens

Provide the following to load an id token:

1. A server response with the id token, scopes, token_type, and expires_in value, and
1. Either:
    - A `SilentRequest` object with account information, OR
    - A `SilentRequest` object with the authority AND a `LoadTokenOptions` object with `clientInfo`, OR
    - A `SilentRequest` object with the authority AND a server response object with `client_info`

An account will also be set in the cache based on the information provided above.

See the code examples below:

```ts
const silentRequest: SilentRequest = {
    scopes: ["User.Read", "email"],
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id"
    }
};

const serverResponse: ExternalTokenResponse = {
    token_type: AuthenticationScheme.BEARER, // "Bearer"
    scope: "User.Read email",
    expires_in: 3599,
    id_token: "id-token-here"
}

const loadTokenOptions: LoadTokenOptions = {};

// OR

const silentRequest: SilentRequest = {
    scopes: ["User.Read", "email"],
    authority: "https://login.microsoftonline.com/your-tenant-id"
};

const serverResponse: ExternalTokenResponse = {
    token_type: AuthenticationScheme.BEARER, // "Bearer"
    scope: "User.Read email",
    expires_in: 3599,
    id_token: "id-token-here",
}

const loadTokenOptions: LoadTokenOptions = {
    clientInfo: "client-info-here"
};

// OR

const silentRequest: SilentRequest = {
    scopes: ["User.Read", "email"],
    authority: "https://login.microsoftonline.com/your-tenant-id"
};

const serverResponse: ExternalTokenResponse = {
    token_type: AuthenticationScheme.BEARER, // "Bearer"
    scope: "User.Read email",
    expires_in: 3599,
    id_token: "id-token-here",
    client_info: "client-info-here"
}

const loadTokenOptions: LoadTokenOptions = {};
```

### Loading access tokens

Access tokens can optionally be loaded using `loadExternalTokens()`. Provide the following to load an access token (note that an id token is mandatory and will be loaded when loading access tokens):

1. A server response with and id token, an access token, `expires_in` value, token_type, and scopes, and
1. Either:
    - A `SilentRequest` object with account information, OR
    - A `SilentRequest` object with the authority AND a `LoadTokenOptions` object with `clientInfo`, 
    - A `SilentRequest` object with the authority AND a server response object with `client_info`
    and
1. The `LoadTokenOptions` object must also have an `extendedExpiresOn` value.

See the code examples below:

```ts
const silentRequest: SilentRequest = {
    scopes: ["User.Read", "email"],
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id"
    }
};

const serverResponse: ExternalTokenResponse = {
    token_type: AuthenticationScheme.BEARER, // "Bearer"
    scope: "User.Read email",
    expires_in: 3599,
    id_token: "id-token-here",
    access_token: "access-token-here"
}

const loadTokenOptions: LoadTokenOptions = {
    extendedExpiresOn: 6599
};
```
