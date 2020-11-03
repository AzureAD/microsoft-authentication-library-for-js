# Advanced Topics for MSAL Angular

## Logging

The logger definition has the following properties. Please see the config section for more details on their use:

1. correlationId
2. logLevel
3. piiLoggingEnabled

You can enable logging in your app as shown below:

```js
export function loggerCallback(logLevel, message) {
    console.log(message);
}

@NgModule({
    imports: [ 
        MsalModule.forRoot({
            auth: {
                clientId: 'Your client ID',
            },
            system: {
                loggerOptions: {
                    loggerCallback,
                    level: LogLevel.Verbose,
                    piiLoggingEnabled: true
                }
            }
        })
    ]
})
```

The `logger` can also be set dynamically by using `MsalService.setLogger()`.

```js
this.authService.setLogger(
    (logLevel, message, piiEnabled) => {
        console.log('MSAL Logging: ', message);
    },
    correlationId: CryptoUtils.createNewGuid(),
    piiLoggingEnabled: false
);
```

## Multi-Tenant

By default, you have multi-tenant support since MSAL sets the tenant in the authority to 'common' if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the `authority` config property as shown above.

If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

## Security

Tokens are accessible from Javascript since MSAL is using HTML5 storage. Default storage option is sessionStorage, which keeps the tokens per session. You should ask user to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [https://www.owasp.org/index.php/XSS\_(Cross_Site_Scripting)\_Prevention_Cheat_Sheet](<https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet>)

## CORS API usage

MSAL will get access tokens using a hidden Iframe for given CORS API endpoints in the config. To make CORS API call, you need to specify your CORS API endpoints as a map in the Angular config.

```js
export const protectedResourceMap: new Map([
    ['https://buildtodoservice.azurewebsites.net/api/todolist', [ 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user' ]],
    ['https://graph.microsoft.com/v1.0/me', ['user.read']]
]);

@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: 'Your client ID',
            }
        }, {
            // MsalGuardConfiguration here
        }, {
            protectedResourceMap : protectedResourceMap
        })
    ]
})
```

In your API project, you need to enable CORS API requests to receive flight requests.

## Internet Explorer support

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