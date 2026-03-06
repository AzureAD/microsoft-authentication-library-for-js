# Upgrading from MSAL Angular v4 to v5

MSAL Angular v5 requires a minimum version of Angular 19 and is dropping support for Angular 15, 16, 17, and 18.

Please see the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md) for browser support and other key changes.

## Breaking changes in `@azure/msal-angular@5`

### Strict matching for `protectedResourceMap`

In msal-angular v5, URL pattern matching for protectedResourceMap entries uses strict matching semantics by default. Strict matching treats pattern metacharacters as literals, anchors matches to the full URL component, and applies host wildcard rules that do not span dot separators. If your v4 configuration relied on looser matching behavior, update your protectedResourceMap patterns to align with strict matching, or set strictMatching to false to retain legacy behavior temporarily. See [MSAL Interceptor docs](./msal-interceptor.md#strict-matching-strictmatching) for more details.

> **⚠️ This change can also affect v5 minor upgrades.** If strict matching was not yet the default in the v5 minor version you originally adopted (e.g. 5.0.x), upgrading to a later v5 minor (e.g. 5.1.x) where strict matching is the default can silently break token attachment. The primary symptom is identical: **401 errors** — a runtime warning is now emitted when `strictMatching` is not explicitly configured, but the match failure itself remains silent and the `Authorization` header is no longer attached.

#### Quick checklist

1. **Review your `protectedResourceMap` keys.** Keys that are bare base URLs (e.g. `https://api.example.com`) without wildcards or sub-paths will no longer match requests to sub-paths of that URL. See [common failure patterns](./msal-interceptor.md#common-failure-patterns).
2. **Update keys to use exact paths or wildcards.** Each key should either match the exact URL your application requests, or use a `/*` wildcard suffix to match sub-paths. See [fix options](./msal-interceptor.md#fix-options).
3. **If your keys are loaded dynamically at runtime**, set `strictMatching: false` as a temporary safe default. See [guidance for environment-driven configurations](./msal-interceptor.md#guidance-for-environment-driven-configurations).

#### Environment-driven `protectedResourceMap`

If your `protectedResourceMap` keys come from Angular `environment` files, `APP_INITIALIZER`, JSON configuration, or `platformBrowserDynamic`, set `strictMatching: false` as a safe default during migration:

```javascript
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(environment.apiConfig.uri, environment.apiConfig.scopes);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
    // TODO: Remove once protectedResourceMap keys are updated to use
    // exact paths or wildcard patterns (e.g. "https://api.example.com/*").
    strictMatching: false,
  };
}
```

Once all keys are migrated to exact paths or wildcards, remove `strictMatching: false` (or set it to `true`) to benefit from the stricter, safer matching behaviour. See [guidance for environment-driven configurations](./msal-interceptor.md#guidance-for-environment-driven-configurations) for more details.

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
