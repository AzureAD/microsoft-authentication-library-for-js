# Known issues for MSAL Angular v2

## 2.0.0-beta.6
* Due to a security fix, the `MsalCustomNavigationClient` will not navigate client-side when `navigateToLoginRequestUrl` is set to true and handling redirects. This will be addressed in a future release.

## 2.0.0-beta.4
* When the MSAL Guard is used on the page used for the redirect URI, the `code=` hash may remain in the url. This is addressed in `2.0.0-beta.5`, except when the MSAL Guard is used for `canLoad`. To mitigate this issue, applications should not put the MSAL Guard on the page used for the redirect URI.

## 2.0.0-alpha.3
* MSAL Guard's `Canload` interface has a return type of `Observable<boolean|UrlTree>`, which is incompatible with the Angular 9 `CanLoad` base type. This is addressed in version `2.0.0-alpha.4`.

## 2.0.0-alpha.0
* Warnings related to `minimatch` and `path`: These warnings should not cause any problems and will be addressed in a future release.
* IE11 is not supported: This is not currently supported in this version, but will be addressed in a future release.

Please see the `@azure/msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#why-is-there-no-access-token-returned-from-acquiretokensilent) for additional known issues.
