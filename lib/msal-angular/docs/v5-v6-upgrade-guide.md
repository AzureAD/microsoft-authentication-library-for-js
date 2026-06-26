# Upgrading from MSAL Angular v5 to v6

MSAL Angular v6 requires a minimum version of Angular 22 and is dropping support for Angular 19, 20, and 21.

Unlike previous major versions, MSAL Angular v6 does not bump the underlying `@azure/msal-browser` dependency. MSAL Angular v6 continues to depend on `@azure/msal-browser@5`, so no MSAL Browser migration is required for this upgrade.

## Breaking changes in `@azure/msal-angular@6`

### Minimum Angular version is now 22

`@azure/msal-angular@6` requires Angular `^22.0.0` or higher. Applications still on Angular 19, 20, or 21 should remain on `@azure/msal-angular@5` until they are ready to upgrade Angular. Follow the [Angular Update Guide](https://angular.dev/update-guide) to migrate your application to Angular 22.

## Behavior changes in `@azure/msal-angular@6`

### Interactive and silent `MsalService` methods now auto-initialize

`@azure/msal-browser@5` requires `await instance.initialize()` to resolve before any interactive or silent API can be called; calling one before initialization throws `BrowserAuthError: uninitialized_public_client_application`. In v5, consumers were expected to gate their UI on `handleRedirectObservable()` (which internally awaits initialize) before allowing any login/acquireToken call. In practice this race was easy to lose — for example, a Login button clicked before `handleRedirectObservable` resolves would throw.

In v6, the following `MsalService` methods internally `await instance.initialize()` before delegating to `@azure/msal-browser`, so they are safe to call at any time:

- `loginPopup`
- `loginRedirect`
- `logoutPopup`
- `logoutRedirect`
- `acquireTokenPopup`
- `acquireTokenRedirect`
- `acquireTokenSilent`
- `ssoSilent`

`initialize()` on `@azure/msal-browser` is idempotent and caches its promise, so the additional cost after the first call is a single microtask.

You still need to subscribe to `handleRedirectObservable()` on any page where a redirect may land, in order to process the redirect response (see [redirects](./redirects.md)). Auto-initialize only removes the requirement that initialization complete *before* you trigger an interactive method — it does not replace redirect handling.

#### Implication for tests: stop `await`-ing observables

Because each method now defers by one microtask while it awaits initialization, the (incorrect but previously tolerated) pattern of `await`-ing the returned `Observable` no longer triggers the underlying `@azure/msal-browser` call before your assertions run:

```ts
// Broken in v6 — `await` on an Observable resolves immediately to the
// Observable itself, before the inner work has been scheduled.
await authService.loginRedirect();
expect(msalInstanceSpy.loginRedirect).toHaveBeenCalled(); // ❌ not yet called
```

Use `firstValueFrom` (or a normal `.subscribe`) instead:

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(authService.loginRedirect());
expect(msalInstanceSpy.loginRedirect).toHaveBeenCalled(); // ✅
```

This was always the correct way to consume the observable-returning APIs; v6 just makes the bug observable.

### Components must trigger change detection after RxJS-driven state changes

Angular 22 (with zone-based change detection) only runs change detection on views that have been marked dirty. When you mutate component state inside a subscription callback to `MsalBroadcastService.inProgress$` or `msalSubject$`, Angular does not automatically know that the view needs to re-render — calls to `ApplicationRef.tick()` will walk the tree but skip clean views, so the DOM will appear stale even though the component fields have updated.

Components that subscribe to MSAL observables and render based on the resulting state should inject `ChangeDetectorRef` and call `detectChanges()` (or `markForCheck()`) after mutating state:

```ts
import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from "@angular/core";
import { MsalBroadcastService, MsalService } from "@azure/msal-angular";
import { InteractionStatus } from "@azure/msal-browser";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";

@Component({ /* ... */ })
export class HomeComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly authService = inject(MsalService);
  private readonly _destroying$ = new Subject<void>();

  loginDisplay = false;

  ngOnInit(): void {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
  }
}
```

Alternatives that also work without explicit `detectChanges()` calls:
- Render via the `async` pipe over a derived observable, instead of assigning to a field.
- Migrate the component to signals (`signal()` / `computed()`), which integrate with Angular's reactivity automatically.

See the updated [`angular-modules-sample`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-modules-sample), [`angular-standalone-sample`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-standalone-sample), and [`angular-b2c-sample`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-b2c-sample) for end-to-end examples.

### `MsalBroadcastService` event callbacks now run inside `NgZone`

`MsalBroadcastService` now subscribes to `@azure/msal-browser` events inside `NgZone.run(...)`, so event handlers that mutate component state will participate in change detection by default. No consumer change is required for this; it is mentioned here for completeness.
