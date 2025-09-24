# Migrating from MSAL React v3 to v4

## Dropped support for old React versions
MSAL React v4 supports React 19 or greater. It no longer supports React 16, 17, or 18.

## Correct logout bug
MSAL React v4 has fixed a bug affecting the `useMsalAuthentication` hook and `MsalAuthenticationTemplate`. Logging out now clears all state associated with the user.

## `InteractionStatus` changes
For `InteractionStatus`: `Login`, `SsoSilent`, and `AcquireToken` are now consolidated into `AcquireToken`.