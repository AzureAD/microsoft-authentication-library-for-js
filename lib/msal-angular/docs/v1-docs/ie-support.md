# Internet Explorer support for MSAL Angular v1

This library supports Internet Explorer 11 with the following configuration:

-   For CORS API calls, the Iframe needs to access the cookies for the same domain that you did the initial sign in on. IE does not allow to access cookies in Iframe for localhost. Your URL needs to be fully qualified domain i.e http://yoursite.azurewebsites.com. Chrome does not have this restriction.
-   If you put your site in the trusted site list, cookies are not accessible for Iframe requests. You need to remove protected mode for Internet zone or add the authority URL for the login to the trusted sites as well.
-   IE may clear local storage when navigating between websites in different zones (e.g. your app and the login authority), which results in a broken experience when returning from the login page. To fix, set `storeAuthStateInCookie` to `true`.
-   There are known issues with popups in IE. We recommend using redirect flows by setting `popUp` to `false`.

It is recommended that these properties are set dynamically based on the user's browser.

```js
const isIE =
    window.navigator.userAgent.indexOf("MSIE ") > -1 ||
    window.navigator.userAgent.indexOf("Trident/") > -1;

MsalModule.forRoot({
    // ...
    cache: {
        storeAuthStateInCookie: ieIE
    }
}, {
    popUp: !isIE
});
```
