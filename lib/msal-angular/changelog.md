# Changelog

## 1.0.0-beta.5

* Requires `msal@1.3.0-beta.0`.
* When MSAL Guard fails to silent SSO, prompt for interaction. (#1455)
* MSAL Guard should properly support hash routing and non-root base urls. (#1452)
* Fix isEmpty check for unprotectedResources. (#1454)
* Update handleRedirectCallback in Angular samples to log entire response. (#1428)
* Don't broadcast `msal:login` events from MSAL Guard. (#1435)
* Add guide for [Configuration](./docs/configuration.md).

## 1.0.0-beta.4

* Requires `msal@1.2.2-beta.2`, which add `redirectStartUrl` to `AuthenticationParameters`, so that when a redirect operation from MSAL Guard is succesfully completed, redirect to the desired destination page. (#1343)
* Short-circuit MSAL Guard if it detects it is loaded in an iframe, to prevent timeouts that occur as a result of redirecting. (#1337)
* If framework.protectedResourceMap/unprotectedResources is empty, use msalAngularConfig.protectedResourceMap/unprotectedResources. (#1355)

## 1.0.0-beta.3

Fixes issues related to support for Angular 9 and Ivy.

* Library is now built using the Angular 9 CLI and `ng-packagr`. (#1323)
* Angular 9 sample now available in the [samples folder](../../samples/angular9-sample-app/). (#1312)
* `MSAL_CONFIG` and `MSAL_CONFIG_ANGULAR` available from the package's main export. (#1323)
* Removes the `WindowWrapper` class. (#1323)

## 1.0.0-beta.2

Fixes two issues related to `aot` mode.

* Requires `msal@1.2.2-beta.0`, which adds `setLogger` function to dynamically set the logger callback when running in `aot` mode. (#1213).
* Moves `protectedResourceMap` and `unprotectedResources` to MSAL Angular-specific configuration object. `protectedResourceMap` can now be `[string, string[]][]` or a `Map`. This is also to mitigate issues with `aot` mode. (#1213).

## 1.0.0-beta.1

Initial upgrade to be compatible with new version of Angular (6+).

* Requires `msal@1.2.1`, `rxjs@6`, `@angular/core@>=6`, `@angular/common@>=6` as peer dependencies.
* `rxjs-compat` is no longer required by MSAL Angular.

### Known issues

* `aot` compiling will throw errors for `new Logger()` and `new Map()` ("Function calls are not supported in decorators but 'Logger/Map' was called."). This will be addressed in a follow up release.

## 1.0.0-alpha.1

* Requires `msal@1.2.0-beta.1`, which includes fixes for bugs with redirect methods.
* `handleRedirectCallback` will now emit events after returning from the redirect.

## 1.0.0-alpha.0

Initial upgrade to use `msal@1.2.0`.

* `msal@1.2.0` package is now a peer dependency, and must be installed alongside `@azure/msal-angular`: `npm install msal@1.2.0 @azure/msal-angular@alpha`
* `MsalModule.forRoot` now takes two arguement.
    * The first argument is the configuration object, which is the [same `Configuration` object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/src/Configuration.ts) you would pass to `msal`.
    * The second argument is a `MsalAngularConfiguration` object, containing the values for `consentScopes`, `popUp`, and `extraQueryParameters`.
    * See the [updated sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/angular6-sample-app/src/app/app.module.ts) for an example of how to pass these configuration objects.
* The `acquireToken` and `login` methods now take a single `AuthenticationParameters` object as parameters.
* `getUser()` is now `getAccount()`.
* Broadcast events now emit objects, instead of just strings.
* Applications using `Redirect` methods must implement the `handleRedirectCallback` method (and have it run on every page load), which will capture the result of redirect operations. See the [Angular sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/angular6-sample-app/src/app/app.component.ts) for an example of how to implement.

## 0.1.4
* Fix msal-angular to transpile for IE11 compatibility: https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/868
* Upgrade to msal-core version 0.2.2, namely including support for `storeAuthStateInCookie` for IE11.

## 0.1.3
* Fix msal-angular exports to properly support IE11: https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/785
  * **Note**: Unfortunately, the fix above caused breakage with `aot` compiling, so `0.1.3` has been deprecated in npm. We recommend pinning to `0.1.2` while we work on a fix. See https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/798

## 0.1.2
* AOT fix for protectedResourceMap issue  https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/407

* Broadcast message returns object

## 0.1.1
* Fixed AOT issue https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/386

* Upgraded to latest msal-core version 0.2.1


## 0.1.0
Preview Release

