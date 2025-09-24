# Migrating from MSAL v4 to MSAL v5

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from MSAL v2, you should check [this guide](v2-migration.md) first to migrate to MSAL v3. If you are coming from MSAL v3, you should check [this guide](v4-migration.md) first to migrate to MSAL v4 and then follow next steps.

If you are coming from MSAL v4, you can follow this guide to update your code to use MSAL v5.

## API Breaking Changes

### SignedHttpRequest.removeKeys return type has changed

The `removeKeys` function on the `SignedHttpRequest` class now returns `Promise<void>` instead of `Promise<boolean>`. A successful resolution of the promise is now equivalent to what was previously a return value of `true`. If a failure occurs it will now be thrown as an error instead of returning `false`

```javascript
// BEFORE
const shr = new SignedHttpRequest(shrParameters, shrOptions);
const result = await shr.removeKeys(thumbprint);
if (result) {
    // do something on success
} else {
    // do something on failure
}

// AFTER
const shr = new SignedHttpRequest(shrParameters, shrOptions);
await shr.removeKeys(thumbprint).then(() => {
    // do something on success
}).catch(e => {
    // do something on failure
    console.log(e);
});
```

### TokenCache and loadExternalTokens

MSAL JS API for [loadExternalTokens](../testing.md#the-loadexternaltokens-api) is modified. The changes include:
* `TokenCache` object and `getTokenCache()` have been removed
* The `loadExternalTokens()` API is now a separate export and requires `Configuration` as a parameter

```js
// BEFORE

const pca = new PublicClientApplication(config);
await pca.getTokenCache().loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);

//AFTER

await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### `handleRedirectPromise` API signature has changed

Previously, `PublicClientApplication.handleRedirectPromise` took in an optional hash parameter. A new options type called `HandleRedirectPromiseOptions` has been introduced. As of MSAL Browser v5, an optional object with type `HandleRedirectPromiseOptions` is the only parameter `handleRedirectPromise()` accepts.

```javascript
// BEFORE
const hash = window.location.hash; // Arbitrary example value
pca.handleRedirectPromise(hash)


// AFTER
pca.handleRedirectPromise({
    hash: window.location.hash, // Option nested inside a `HandleRedirectPromiseOptions` object
    navigateToLoginRequestUrl: true // Additional option
})
```

### Removal of some functions in `PublicClientApplication` 

The following functions in `PublicClientApplication` have been removed:
1. `enableAccountStorageEvents()` and `disableAccountStorageEvents()`: account storage events are now always enabled. These function calls are no longer necessary.
1. `getAccountByHomeId()`, `getAccountByLocalId()`, and `getAccountByUsername()`: use `getAccount()` instead.

    ```typescript
    // BEFORE
    const account1 = accountManager.getAccountByHomeId(yourHomeAccountId);
    const account2 = accountManager.getAccountByLocalId(yourLocalAccountId);
    const account3 = accountManager.getAccountByUsername(yourUsername);

    // AFTER
    const account1 = accountManager.getAccount({ homeAccountId: yourHomeAccountId });
    const account2 = accountManager.getAccount({ localAccountId: yourLocalAccountId });
    const account3 = accountManager.getAccount({ username: yourUsername });
    ```
1. `logout()`: use `logoutRedirect()` or `logoutPopup()` instead.

### Removal of `startPerformanceMeasurement()`

`startPerformanceMeasurement()` has been removed. Please use `startMeasurement()` instead.

## Configuration changes

### BrowserAuthOptions changes

1. The `skipAuthorityMetadataCache` parameter has been removed from BrowserAuthOptions in Configuration.
1. The `protocolMode` parameter has been moved to SystemOptions instead of BrowserAuthOptions in Configuration.
1. The `supportsNestedAppAuth` parameter has been removed. Use the `createNestablePublicClientApplication` API for Nested Apps instead. Read more about Nested Apps [here](./initialization.md#nested-app-configuration).
1. The `navigateTologinRequestUrl` parameter has been removed from BrowserAuthOptions in Configuration and can instead now be provided inside an options object as a parameter on the call to `handleRedirectPromise`:

    ```typescript
      pca.handleRedirectPromise({ navigateToLoginRequestUrl: false })
    ```
1. The `encodeExtraQueryParams` parameter has been removed. All extra query params will be encoded.
1. The `supportsNestedAppAuth` parameter has been removed. Use `createNestablePublicClientApplication()` instead.
    ```typescript
        // BEFORE
        const pca = new PublicClientApplication({
            auth: {
                clientId: "your-client-id",
                authority: "https://login.microsoftonline.com/common"
                supportsNestedAppAuth: true
            },
        });

        // AFTER
        const pca = await createNestablePublicClientApplication({
            auth: {
                clientId: "your-client-id",
                authority: "https://login.microsoftonline.com/common"
            }
        });
    ```
1. The `OIDCOptions` parameter now takes in a `ResponseMode` instead of a `ServerResponseType`. Please use `ResponseMode.QUERY` in place of `ServerResponseType.QUERY` and `ResponseMode.FRAGMENT` instead of `ServerResponseType.FRAGMENT`.

### CacheOptions changes

The following parameters were deprecated in MSAL Browser v4 and have been removed from `CacheOptions` in v5

1. `temporaryCacheLocation`
1. `claimsBasedCachingEnabled` - Access tokens are no longer being stored based on requested claims.
1. `storeAuthStateInCookie`
1. `secureCookies` - All cookies are now only ever securely sent over HTTPS.
1. `cacheMigrationEnabled`

### SystemOptions

1. The `protocolMode` parameter has been moved to `SystemOptions` from `BrowserAuthOptions` in Configuration. There are no changes to its options or functionality.
1. The `navigateFrameWait` parameter has been removed. This was previously needed by older browsers which are no longer supported by MSAL.js.

#### `asyncPopups`

The `asyncPopups` parameter has been renamed to `navigatePopups` in `SystemOptions` and the options reversed. This sets whether popups are opened and navigated to later. When set to true, blank popups are opened and navigates to login domain. When set to false, popups are opened directly to the login domain. This can be set to false for scenarios where `about:blank` is not supported, e.g. desktop apps or progressive web apps.

**Note that by default, `navigatePopups` is now set to true**. If you were using `asyncPopups` before, you will now have to change it to `navigatePopups` and reverse your configuration.

See the [Configuration doc](./configuration.md#system-config-options) for more details.

## Changes on request

### Removal of `onRedirectNavigate` parameter

The `onRedirectNavigate` parameter has been removed from the `RedirectRequest` object. It has *not* been removed from the `Configuration` object and can continue to be set there.

## Behavioral Breaking Changes

### Event types and InteractionStatus changes

We have consolidated event types and InteractionStatus to reflect what happened rather than what API it happened in.

1. `SSO_SILENT` and `ACQUIRE_TOKEN_BY_CODE` events have been consolidated into `ACQUIRE_TOKEN` events (`START`/`SUCCESS`/`FAILURE` variants)
1. `ACCOUNT_ADDED` and `ACCOUNT_REMOVED` have been replaced with `LOGIN_SUCCESS` and `LOGOUT_SUCCESS`, respectively.
1. `LOGIN_START` and `LOGIN_FAILURE` have been replaced with `ACQUIRE_TOKEN_START` and `ACQUIRE_TOKEN_FAILURE`, respectively.
1. The payload for `LOGIN_SUCCESS` is now an `AccountInfo` object.
1. Any successful login now emits both a `LOGIN_SUCCESS` and `ACQUIRE_TOKEN_SUCCESS` event.
1. For `InteractionStatus`: `Login`, `SsoSilent`, and `AcquireToken` are now consolidated into `AcquireToken`.
