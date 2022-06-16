# Internet Explorer support for MSAL Angular v2

`@azure/msal-angular` supports Internet Explorer 11 with the following changes.

## MSAL configuration

-   For CORS API calls, the Iframe needs to access the cookies for the same domain that you did the initial sign in on. IE does not allow to access cookies in Iframe for localhost. Your URL needs to be fully qualified domain i.e http://yoursite.azurewebsites.com. Chrome does not have this restriction.
-   If you put your site in the trusted site list, cookies are not accessible for Iframe requests. You need to remove protected mode for Internet zone or add the authority URL for the login to the trusted sites as well.
-   IE may clear local storage when navigating between websites in different zones (e.g. your app and the login authority), which results in a broken experience when returning from the login page. To fix, set `storeAuthStateInCookie` to `true`.
-   There are known issues with popups in IE. We recommend using redirect flows by setting `storeAuthStateInCookie` to `false`.

It is recommended that these properties are set dynamically based on the user's browser.

```js
const isIE =
    window.navigator.userAgent.indexOf("MSIE ") > -1 ||
    window.navigator.userAgent.indexOf("Trident/") > -1;

MsalModule.forRoot({
    // ... MSAL Configuration
    cache: {
        storeAuthStateInCookie: isIE
    }
}, {
    interactionType: InteractionType.Popup // MSAL Guard Configuration
}, {
    interactionType: InteractionType.Popup // MSAL Interceptor Configuration
})
```

For more details on IE11 support in MSAL.js v2, see [this document](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/internet-explorer.md).

## Angular app configuration

To support IE11, your Angular application should make the following changes:

1. In `tsconfig.json`, set `target` to `es5`.
2. Install the `core-js` package, and import it in `src/polyfills.ts`.
3. In `.browserslistrc`, add/uncomment a line for `IE 11`.

You can see [these changes](https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/2688/files) in our [Angular 11 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app).
