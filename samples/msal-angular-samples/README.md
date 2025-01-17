# MSAL Angular Samples

### Current available samples for `@azure/msal-angular`:

-   [Angular B2C Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-b2c-sample)

    -   This sample demonstrates how to use MSAL Angular with B2C. See our [B2C doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/working-with-b2c.md) for more information on configuration and usage.
    -   `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    -   `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

-   [Angular Modules Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-modules-sample)

    -   This sample demonstrates how to use MSAL Angular with Angular's NgModules.
    -   Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/configuration.md) for more information.
    -   `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    -   `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

-   [Angular Standalone Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-samples/angular-standalone-sample)

    -   This sample demonstrates how to use MSAL Angular with Angular's standalone components.
    -   This sample uses Angular 19's application builder, but **does not** demonstrate use of server-side and prerendering capabilities. See [Angular's docs](https://angular.io/guide/esbuild) for more details.
    -   This sample does not use the `MsalRedirectComponent`, but subscribes to `handleRedirectObservable` in the App Component. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    -   `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.
