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

## Configuration changes

### BrowserAuthOptions changes

1. The `skipAuthorityMetadataCache` parameter has been removed from BrowserAuthOptions in Configuration.
1. The `protocolMode` parameter has been moved to SystemOptions instead of BrowserAuthOptions in Configuration.
1. The `supportsNestedAppAuth` parameter has been removed. Use the `createNestablePublicClientApplication` API for Nested Apps instead. Read more about Nested Apps [here](./initialization.md#nested-app-configuration).
1. The `navigateTologinRequestUrl` parameter has been removed from BrowserAuthOptions in Configuration and can instead now be provided on the call to `handleRedirectPromise`:

    ```typescript
      pca.handleRedirectPromise(hash, { navigateToLoginRequestUrl: false })
    ```

### CacheOptions changes

The following parameters were deprecated in MSAL Browser v4 and have been removed from `CacheOptions` in v5

1. `temporaryCacheLocation`
1. `claimsBasedCachingEnabled` - Access tokens are no longer being stored based on requested claims.
1. `storeAuthStateInCookie`
1. `secureCookies` - All cookies are now only ever securely sent over HTTPS.
1. `cacheMigrationEnabled`

### SystemOptions

1. The `protocolMode` parameter has been moved to `SystemOptions` from `BrowserAuthOptions` in Configuration. There are no changes to its options or functionality.

#### `asyncPopups`

The `asyncPopups` parameter has been renamed to `navigatePopups` in `SystemOptions` and the options reversed. This sets whether popups are opened and navigated to later. When set to true, blank popups are opened and navigates to login domain. When set to false, popups are opened directly to the login domain. This can be set to false for scenarios where `about:blank` is not supported, e.g. desktop apps or progressive web apps.

**Note that by default, `navigatePopups` is now set to true**. If you were using `asyncPopups` before, you will now have to change it to `navigatePopups` and reverse your configuration.

See the [Configuration doc](./configuration.md#system-config-options) for more details.

## Changes on request

[TBD]

## Behavioral Breaking Changes

[TBD]
