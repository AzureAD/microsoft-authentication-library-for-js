# Upgrading from MSAL Angular v0 to v1

MSAL Angular v1 brings our Angular wrapper up-to-date with the latest version of MSAL core, and with out-of-the-box support for modern versions of Angular (6+) and rxjs (6).

This guide will demonstrate changes needed to migrate an existing application from `@azure/msal-angular@0.x` to `@azure/msal-angular@1.0.0`.

A detailed list of changes can be found in the [CHANGELOG](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/CHANGELOG.md).

## Installation

The first fundamental change to MSAL Angular is that the core `msal` package is no longer a regular dependency, and instead a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/). This means your application must also include `msal` as a normal dependency, instead of relying on MSAL Angular to include it. This allows for your application to either use the latest version of `msal` (recommended), or you can pick a custom version/range, while still using the latest version of MSAL Angular itself. Note, you should still provide a version that satisfies the semver range provided for the peer dependency, or else MSAL Angular may not function as intended.

Steps:
1. Install `msal` and `@azure/msal-angular`: `npm install msal@beta @azure/msal-angular@beta`.

## Breaking changes in MSAL.js v1

`msal@1` includes a number of breaking changes from `msal@0.2.x`. Many of these should be abstracted away from your application, but there are a few which will require code changes.

### MsalModule.forRoot now takes two arguments.

Previously, MSAL Angular accepted one configuration object via `MsalModule.forRoot()`. To more closely align with `msal@1` and to provide more flexibility to MSAL Angular, this has been split into two objects, one for the core library and one for the wrapper.

Steps:
1. The first argument is the configuration object, which is the [same `Configuration` object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/src/Configuration.ts) you would pass to `msal`.
2. The second argument is a [`MsalAngularConfiguration object`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-angular-v1/lib/msal-angular/src/msal-angular.configuration.ts), containing the values for `consentScopes`, `popUp`, `extraQueryParameters`, and `protectedResourceMap`. `unprotectedResources` has been deprecated.

See the [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-samples/angular6-sample-app/src/app/app.module.ts) for an example of how to pass these configuration objects.

### Mitigations for AOT mode errors

The new `msal` configuration object takes a function for `system.logger` and `framework.protectedResourceMap`, which does not work properly when running in `aot` mode. There are now two workarounds available:

1. `protectedResourceMap` has been moved to `MsalAngularConfiguration` object, and can be passed as `[string, string[]][]` or as a `Map`. `framework.protectedResourceMap` still works, but has been deprecated. See the [updated samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-samples/angular6-sample-app/src/app/app.module.ts) for usage.
2. `logger` can now be set dynamically by using `MsalService.setLogger()`. See the [updated samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-samples/angular6-sample-app/src/app/app.component.ts) for usage.

### Other breaking changes

* The `acquireToken` and `login` methods now take a single `AuthenticationParameters` object as parameters.
* `getUser()` is now `getAccount()`.
* Broadcast events now emit objects, instead of just strings.
* Applications using `Redirect` methods must implement the `handleRedirectCallback` method (and have it run on every page load), which will capture the result of redirect operations. See the [Angular sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-samples/angular6-sample-app/src/app/app.component.ts) for an example of how to implement.

## Angular 6+ and rxjs@6

MSAL Angular now expects that your application is built with `@angular/core@>=6`, `@angular/common@>=6`, `rxjs@6`. And `rxjs-compat` is no longer required.

Steps:
1. Install newer versions of Angular and rxjs: `npm install @angular/core @angular/common rxjs`
2. Uninstall `rxjs-compat` (assuming it is not needed for other libraries): `npm uninstall rxjs-compat`

## Samples

We have put together basic sample applications for Angular 6, 7, 8, and 9. These samples demonstrate basic configuration and usage, and will be improved and added to incrementally. We also are planning to include more samples for more scenarios and use cases.

* [Angular 6](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular6-sample-app)
* [Angular 7](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular7-sample-app)
* [Angular 8](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular8-sample-app)
* [Angular 9](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular9-sample-app)
