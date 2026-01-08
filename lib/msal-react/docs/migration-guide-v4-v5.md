# Migrating from MSAL React v3 to v5

Note: There is no MSAL React v4 release. The package version was incremented from v3 directly to v5 to align `msal-react` versioning with the other MSAL.js libraries. No separate v4 feature set exists.

Please see the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md) for browser support and other key changes.

## Dropped support for old React versions
MSAL React v5 supports React 19 or greater. It no longer supports React 16, 17, or 18.

## Correct logout bug
MSAL React v5 has fixed a bug affecting the `useMsalAuthentication` hook and `MsalAuthenticationTemplate`. Logging out now clears all state associated with the user.

## `InteractionStatus` changes
For `InteractionStatus`: `Login`, `SsoSilent`, and `AcquireToken` are now consolidated into `AcquireToken`.