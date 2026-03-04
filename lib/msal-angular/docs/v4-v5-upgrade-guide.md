# Upgrading from MSAL Angular v4 to v5

MSAL Angular v5 requires a minimum version of Angular 19 and is dropping support for Angular 15, 16, 17, and 18.

Please see the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md) for browser support and other key changes.

## Breaking changes in `@azure/msal-angular@5`

### Strict matching for `protectedResourceMap`

In msal-angular v5, URL pattern matching for protectedResourceMap entries uses strict matching semantics by default. Strict matching treats pattern metacharacters as literals, anchors matches to the full URL component, and applies host wildcard rules that do not span dot separators. If your v4 configuration relied on looser matching behavior, update your protectedResourceMap patterns to align with strict matching, or set strictMatching to false to retain legacy behavior temporarily. See [MSAL Interceptor docs](./msal-interceptor.md#strict-matching-strictmatching) for more details.

## Other changes in `@azure/msal-angular@5`

### `inject(TOKEN)` syntax

`MSAL_INSTANCE`, `MSAL_GUARD_CONFIG`, `MSAL_INTERCEPTOR_CONFIG`, and `MSAL_BROADCAST_CONFIG` now resolve to types instead of strings in order to support `inject(TOKEN)` syntax. This change may cause TypeScript errors in applications without explicit typing.

### `handleRedirectObservable()` options

`handleRedirectObservable()` now accepts an optional `HandleRedirectPromiseOptions` object, which includes the `navigateToLoginRequestUrl` option that was moved from the configuration in `@azure/msal-browser@5`. See the [redirects documentation](./redirects.md#handleredirectobservable-options) for more details.

```typescript
// Before (msal-browser v4 configuration)
const msalConfig = {
  auth: {
    clientId: 'your-client-id',
    navigateToLoginRequestUrl: false // This option has moved
  }
};

// After (msal-angular v5)
this.authService.handleRedirectObservable({ 
  navigateToLoginRequestUrl: false 
}).subscribe();
```

Note: Passing a hash string directly to `handleRedirectObservable(hash)` is now deprecated. Use the options object instead: `handleRedirectObservable({ hash: "#..." })`.

### `logout()`

`logout()` has been removed. Please use `logoutRedirect()` or `logoutPopup()` instead.
