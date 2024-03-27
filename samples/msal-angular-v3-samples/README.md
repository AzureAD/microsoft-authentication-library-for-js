# MSAL Angular v3 Samples

### Current available samples for `@azure/msal-angular`:

* [Angular 15](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples/angular15-sample-app)
    * Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/configuration.md) for more information.
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    * `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular 16](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples/angular16-sample-app)
    * Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/configuration.md) for more information.
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    * `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular v16 B2C Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples/angular-b2c-sample-app)
    * This sample demonstrates how to use Msal Angular with B2C. See our [B2C doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/working-with-b2c.md) for more information on configuration and usage.
    * `MsalRedirectComponent`: This sample uses the `MsalRedirectComponent` to handle redirects. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    * `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

* [Angular 17](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples/angular17sample-app)
    * Consenting to scopes: This sample consents to scopes upfront. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/configuration.md) for more information.
    * This sample does not use the MsalRedirectComponent, but subscribes to handleRedirectObservable in the App Component. See our doc on redirects for more information.
    * Server-side rendering: This sample application uses Angular 17's default `application` builder which allows for SSR. To accommodate this, references to browser-only objects have been removed. However, as MSAL Angular is a wrapper library for MSAL Browser, which uses browser-only global objects such as window and location objects, not all of MSAL Angular's features are available when using SSR. While login and token acquisition is not supported server-side, Angular 17 can be used with MSAL Angular without breaking your app.

* [Angular Standalone Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples/angular-standalone-sample)
    * This sample demonstrates how to use Msal Angular with Angular's standalone components.
    * This sample does not use the `MsalRedirectComponent`, but subscribes to `handleRedirectObservable` in the App Component. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
    * `PathLocationStrategy`: This sample uses the `PathLocationStrategy` for routing. See [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details.

Additional samples will continue to be added at a later date.
