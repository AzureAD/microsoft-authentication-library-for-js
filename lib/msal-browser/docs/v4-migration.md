# Migrating from MSAL v4 to MSAL v5

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from MSAL v2, you should check [this guide](v2-migration.md) first to migrate to MSAL v3. If you are coming from MSAL v3, you should check [this guide](v4-migration.md) first to migrate to MSAL v4 and then follow next steps.

If you are coming from MSAL v4, you can follow this guide to update your code to use MSAL v5.

## API Breaking Changes

## Configuration changes

### BrowserAuthOptions changes

1. The `skipAuthorityMetadataCache` parameter has been removed from BrowserAuthOptions in Configuration.
1. The `protocolMode` parameter has been moved to SystemOptions instead of BrowserAuthOptions in Configuration.
1. The `supportsNestedAppAuth` parameter has been removed. Use the `createNestablePublicClientApplication` API for Nested Apps instead. Read more about Nested Apps [here](./initialization.md#nested-app-configuration).

### CacheOptions changes

The following parameters were deprecated in MSAL Browser v4 and has been removed from CacheOptions in

1. `temporaryCacheLocation`
1. `claimsBasedCachingEnabled` - Access tokens are no longer being stored based on requested claims.
1. `storeAuthStateInCookie`
1. `secureCookies` - All cookies are now only ever securely sent over HTTPS.
1. `cacheMigrationEnabled`

### SystemOptions

1. The `protocolMode` parameter has been added to SystemOptions from BrowserAuthOptions in Configuration. 
1. The `asyncPopups` parameter has been renamed to `navigatePopups` in SystemOptions. See the [Configuration doc](./configuration.md#system-config-options) for more details.

## Changes on request

## Behavioral Breaking Changes

