# Changelog

## 1.0.0-alpha.0

Initial upgrade to use `msal@1.2.0`.

* `msal@1.2.0` package is now a peer dependency, and must be installed alongside `@azure/msal-angular`.
* `MsalModule.forRoot` now takes two arguement.
    * The first argument is the configuration object, which is the [same `Configuration` object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/src/Configuration.ts) you would pass to `msal`.
    * The second argument is a `MsalAngularConfiguration` object, containing the values for `consentScopes`, `popUp`, and `extraQueryParameters`.
    * See the [updated sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/918830f9750a43567f1dbc01bc6492481d267ed6/samples/MSALAngularDemoApp/src/app/app.module.ts#L41) for an example of how to pass these configuration objects.
* The `acquireToken` and `login` methods now take a single `AuthenticationParameters` object as parameters.

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

