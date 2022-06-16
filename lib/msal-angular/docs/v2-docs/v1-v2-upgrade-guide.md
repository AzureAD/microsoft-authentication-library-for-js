# Upgrading from MSAL Angular v1 to v2

MSAL Angular v2 brings our Angular wrapper up-to-date with the latest version of MSAL common, and with out-of-the-box support for modern versions of Angular (9 - 12) and rxjs (6).

This guide will demonstrate changes needed to migrate an existing application from `@azure/msal-angular` v1 to v2.

## Installation

The first fundamental change to MSAL Angular v2 is that is no longer uses the core `msal` package, but wraps the `@azure/msal-browser` package as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/). 

First, uninstall any previous versions of MSAL currently being used.

To install `@azure/msal-browser` and `@azure/msal-angular`:
```
npm install @azure/msal-browser @azure/msal-angular@latest
```

## Breaking changes in `@azure/msal-browser@2`

`@azure/msal-browser@2` includes a number of breaking changes from `msal@1.x`. Many of these should be abstracted away from your application, but there are a few which will require code changes.

### MsalModule.forRoot now takes three arguments

Previously, `@azure/msal-angular` accepted two configuration objects via `MsalModule.forRoot()`, one for the core library, and one for `@azure/msal-angular`. This has been changed to take in an instance of MSAL, as well as two Angular-specific configuration objects.

1. The first argument is the MSAL instance. This can be provided as a factory which instantiates MSAL, or by passing the instance of MSAL in with configurations. 
2. The second argument is a [`MsalGuardConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.guard.config.ts) object, which specifies the `interactionType` as well as an optional `authRequest` and an optional `loginFailedRoute`. 
3. The third argument is a [`MsalInterceptorConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.interceptor.config.ts) object, which contain the values for `interactionType`, a `protectedResourceMap`, and an optional `authRequest`. `unprotectedResourceMap` has been deprecated. 

See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md) and specific docs for [MsalInterceptor](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-interceptor.md) and [MsalGuard](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-guard.md) for more information. You can also see our [updated samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.module.ts) for examples of how to pass these configuration objects.

### Logger

* The `logger` is now set through configurations for the MSAL instance, under `system.loggerOptions`, which include a `loggerCallback`, `piiLoggingEnabled` and `logLevel`, instead of an instance of a `logger`. The `logger` can also be set dynamically by using `MsalService.setLogger()`. See the [`logger documentation`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/logging.md) for more information and [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.module.ts) for usage.

### API changes

* The `acquireToken` and `login` methods now take different request objects as parameters. See the [msal.service.ts](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.service.ts) for details.
* Broadcast events now emit an `EventMessage` object, instead of just strings. See the [Angular sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.component.ts) for an example of how to implement.
* Applications using `Redirect` methods should import the `MsalRedirectComponent` and bootstrap along with `AppComponent` in their app.component.ts, which will handle all redirects. Applications are unable to do this should implement the `handleRedirectObservable` method (and have it run on every page load), which will capture the result of redirect operations. See the [redirect documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more details.

### MSAL Interceptor
* Please our [MsalInterceptor doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-interceptor.md) for more details on configuring the current `MsalInterceptor`, and differences between v1 and v2.

### MSAL Guard

* Please our [MsalGuard doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-guard.md) for more details on configuring the current `MsalGuard`, and differences between v1 and v2.

### Accounts

* We recommend subscribing to the `inProgress$` observable and filtering for `InteractionStatus.None` before retrieving account information. This ensures that all interactions have completed before getting account information. See [our sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.component.ts#L27) for an example of this use.
* When getting accounts, we recommend using `getAccountByHomeId()` and `getAccountByLocalId()`, available on the MSAL instance. `getAccount()` is now `getAccountByUsername()`, but should be a secondary choice, as it may be less reliable and is for convenience only.
* `getAllAccounts()` is also available on the MSAL instance. Please see [docs](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html) for `@azure/msal-browser` for more details on account methods.
* Additionally, you can now get and set active acccounts using `getActiveAccount()` and `setActiveAccount()`. See our [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md#how-do-i-get-and-set-active-accounts) for more information.

## Angular 9+ and rxjs@6

MSAL Angular now expects that your application is built with `@angular/core@>=9`, `@angular/common@>=9`, `rxjs@6`. As with MSAL Angular v1, `rxjs-compat` is not required.

Steps:
1. Install newer versions of Angular and rxjs: `npm install @angular/core @angular/common rxjs`
2. Uninstall `rxjs-compat` (assuming it is not needed for other libraries): `npm uninstall rxjs-compat`

## Samples

We have put together basic sample applications for Angular 9, 10, 11, and 12. These samples demonstrate basic configuration and usage, and will be improved and added to incrementally. 

See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/README.md) for a list of the MSAL Angular v2 samples and the features demonstrated.
