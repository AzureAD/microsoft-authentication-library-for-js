# Known issues for MSAL Angular 2.x

## 2.0.0-alpha.3
* MSAL Guard's `Canload` interface has a return type of `Observable<boolean|UrlTree>`, which is incompatible with the Angular 9 `CanLoad` base type. This is addressed in version `2.0.0-alpha.4`.

## 2.0.0-alpha.0
* Warnings related to `minimatch` and `path`: These warnings should not cause any problems and will be addressed in a future release.
* IE11 is not supported: This is not currently supported in this version, but will be addressed in a future release.

Please see the `@azure/msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#why-is-there-no-access-token-returned-from-acquiretokensilent) for additional known issues.
