# Upgrading from MSAL Angular v5 to v6

MSAL Angular v6 requires a minimum version of Angular 22 and is dropping support for Angular 19, 20, and 21.

Unlike previous major versions, MSAL Angular v6 does not bump the underlying `@azure/msal-browser` dependency. MSAL Angular v6 continues to depend on `@azure/msal-browser@5`, so no MSAL Browser migration is required for this upgrade.

## Breaking changes in `@azure/msal-angular@6`

### Minimum Angular version is now 22

`@azure/msal-angular@6` requires Angular `^22.0.0` or higher. Applications still on Angular 19, 20, or 21 should remain on `@azure/msal-angular@5` until they are ready to upgrade Angular. Follow the [Angular Update Guide](https://angular.dev/update-guide) to migrate your application to Angular 22.

## Behavior changes in `@azure/msal-angular@6`

### Interactive and silent `MsalService` methods now auto-initialize

In v6, the following `MsalService` methods internally `await instance.initialize()`, so they no longer throw `uninitialized_public_client_application`:

- `loginPopup`
- `loginRedirect`
- `logoutPopup`
- `logoutRedirect`
- `acquireTokenPopup`
- `acquireTokenRedirect`
- `acquireTokenSilent`
- `ssoSilent`

This change only removes the initialization race. You still need to:

- Subscribe to `handleRedirectObservable()` on any page where a redirect may land, so the response is processed (see [redirects](./redirects.md)).
- Gate interactive calls on `MsalBroadcastService.inProgress$ === InteractionStatus.None` if a redirect may be mid-processing on the current page. Calling an interactive method while `handleRedirectObservable` is still running throws `interaction_in_progress`; auto-initialize does not prevent this.

See [Calling interactive and silent APIs](./initialization.md#calling-interactive-and-silent-apis) for more information.

### Components must trigger change detection after RxJS-driven state changes

When mutating component state inside a subscription callback to `MsalBroadcastService.inProgress$` or `msalSubject$`, the DOM may not re-render even though the component fields have updated. Components that subscribe to MSAL observables and render based on the resulting state should inject `ChangeDetectorRef` and call `detectChanges()` (or `markForCheck()`) after mutating state:

```ts
this.msalBroadcastService.inProgress$
  .pipe(filter((status) => status === InteractionStatus.None))
  .subscribe(() => {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
    this.cdr.detectChanges();
  });
```

Alternatives that also work without explicit `detectChanges()` calls:
- Rendering via the [`async` pipe](https://angular.dev/api/common/AsyncPipe) over a derived observable, instead of assigning to a field.
- Migrating the component to [signals](https://angular.dev/guide/signals) (`signal()` / `computed()`), which integrate with Angular's reactivity automatically.

See the updated [`angular-modules-sample`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-modules-sample), [`angular-standalone-sample`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-standalone-sample), and [`angular-b2c-sample`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-b2c-sample) for end-to-end examples.
