# Upgrading from MSAL Angular v4 to v5

MSAL Angular v5 requires a minimum version of Angular 19 and is dropping support for Angular 15, 16, 17, and 18.

## Changes in `@azure/msal-angular@5`

### `inject(TOKEN)` syntax

`MSAL_INSTANCE`, `MSAL_GUARD_CONFIG`, `MSAL_INTERCEPTOR_CONFIG`, and `MSAL_BROADCAST_CONFIG` now resolve to types instead of strings in order to support `inject(TOKEN)` syntax. This change may cause TypeScript errors in applications without explicit typing.

### `logout()`

`logout()` has been removed. Please use `logoutRedirect()` or `logoutPopup()` instead.