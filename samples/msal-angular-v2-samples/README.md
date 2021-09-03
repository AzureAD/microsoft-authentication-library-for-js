# MSAL Angular v2 Samples

**`@azure/msal-angular` is now available for public preview. Please see the [`@azure/msal-angular` README](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) for information on installation and changes.** 

### Current available samples for `@azure/msal-angular`:

* [Angular v9](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular9-v2-sample-app)
    * `handleRedirectObservable`: This sample demonstrates how to call `handleRedirectObservable` manually to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information. 
    * Consenting to scopes: This sample consents to scopes incrementally. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/configuration.md) for more information.
    * `HashLocationStrategy`: This sample uses the `HashLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular v10](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-sample-app)
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information.
    * Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/configuration.md) for more information.
    * Client-side navigation: This sample demonstrates how to setting up a custom navigation client for client-side navigation. See our [performance doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/performance.md) for more information.
    * `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular v11](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app)
    * Angular Universal: Angular universal SSR is supported, and notes have been added to this sample for where adjustments need to be made. Please see the [our Angular Universal doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/angular-universal.md).
    * `canLoad`, `canActivateChild` and lazy-loading modules: This sample demonstrates additional interfaces available on the `MsalGuard`. See our [initialization doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#secure-the-routes-in-your-application) for additional details.
    * `loginFailedRoute`: This sample demonstrates use of the `loginFailedRoute` field in the `MsalGuardConfiguration`. See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/1.x-2.x-upgrade-guide.md#msal-guard) for more details.
    * Setting active accounts: This sample also demonstrates our recommendation for setting and getting active accounts. See our [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md#how-do-i-get-and-set-active-accounts) for more information on active accounts.
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information.
    * Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/configuration.md) for more information.
    * `HashLocationStrategy`: This sample uses the `HashLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular v11 B2C Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-b2c-sample)
    * This sample demonstrates how to use Msal Angular with B2C. See our [B2C doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/working-with-b2c.md) for more information on configuration and usage.
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information.
    * `HashLocationStrategy`: This sample uses the `HashLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular v12](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular12-sample-app)
    * Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/configuration.md) for more information.
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information.
    * `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

### Advanced Samples using `@azure/msal-angular`:
* [Angular SPA with ASP.NET Core web API](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/3-Authorization-II/1-call-api)
* [Angular SPA with APS.NET Core web API using App Roles and RBAC](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/5-AccessControl/1-call-api-roles)
* [Multi-tenant tutorial using MSAL Angular v2](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/6-Multitenancy/1-call-api-mt)

### Pre-MSAL Angular v2 samples

* [Angular 10 Browser Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-browser-sample)
    * **Note:** This sample was created before `@azure/msal-angular@2` was available to demonstrate how to use `@azure/msal-browser` in an Angular application directly.
