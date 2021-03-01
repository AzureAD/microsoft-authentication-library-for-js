# Angular Universal SSR with MSAL Angular v2

Angular Universal is supported in MSAL Angular v2. Please see instructions from the [Angular docs](https://angular.io/guide/universal) on how to install Angular Universal with an existing application.

As Angular Universal executes on the server, browser-only global objects such as `window` or `location` cannot be used. The [Angular docs](https://angular.io/guide/universal#working-around-the-browser-apis) provide more details. As our Angular sample apps do use `window`, two adjustments could be made to use our apps with Angular Universal.

1. References to browser-only global objects can be removed. In our [Angular 11 sample app](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app), comments have been put next to the relevant lines, indicating which ones would need to be removed for Angular Universal to work. Removing these lines do not affect the sample apps if using Angular Universal.

    ```js 
    this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal
    ```

2. Alternatively, checks could be added before any lines that use browser-only global objects.

    ```js
    if (typeof window !== "undefined") {
        this.isIframe = window !== window.parent && !window.opener;
    }
    ```
