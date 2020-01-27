# FAQ

## MSAL 1.x with Internet Explorer
See [here](./docs/msal-in-IE-and-edge.md).

## How to renew tokens with MSAL.js

MSAL.js provides the `acquireTokenSilent` method which handles token renewal by making silent token requests without prompting the user. The method first looks for a valid cached token in the browser storage. If it does not find one, the library makes the silent request to Azure AD and if there is an active user session (determined by a cookie set in browser on the Azure AD domain), a fresh token is returned. The library does not automatically invoke the `acquireTokenSilent` method. It is recommended that you call `acquireTokenSilent` in your app before making an API call to get the valid token.

In certain cases, the `acquireTokenSilent` method's attempt to get the token silently fails. Some examples of this are when there is an expired user session with Azure AD or a password change by the user, etc. which requires user interaction. When the `acquireTokenSilent` fails, you will need to call one of the interactive acquire token methods.(`acquireTokenPopup` or `acquireTokenRedirect`).

The tokens returned by Azure AD have a default lifetime of 1 hour. However, as long as the user is active on your application and a valid Azure AD session exists in the browser, the acquireTokenSilent method can be used to renew tokens. The Azure AD session is valid for 24 hours and can be extended by the user by choosing "Keep me signed in" at sign-in time. For more details, read the [token and session lifetimes](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-configurable-token-lifetimes) document.

## How to get single sign-on in my application with MSAL.js

Please read [Single Sign-On](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-sso) Microsoft docs page for the different scenarios in which MSAL.js enables single sign-on.

## What browsers is MSAL.js supported on?

MSAL.js has been tested with the following browsers:

IE 11, Edge, Chrome, Firefox and Safari

Keep [these steps](./docs/msal-in-IE.md) in mind when using MSAL.js with IE.
There are certain known issues and mitigations documented for Safari, IE and Edge. Please check out:
* [Known issues on IE and Edge](./docs/msal-in-IE-and-edge.md#issues-due-to-security-zones)
* [Known issue on Safari](./docs/safari-issues.md)

## How to avoid page reloads when acquiring and renewing tokens silently?

MSAL.js uses hidden iframes to acquire and renew tokens silently in the background. Azure AD returns the token back to the registered `redirect_uri` specified in the token request(by default this is the app's root page). Since the response is a 302, it results in the HTML corresponding to the `redirect_uri` getting loaded in the iframe. Usually the app's redirect_uri is the root page and this causes it to reload.

In other cases, if navigating to the app's root page requires authentication, it might lead to **nested iframes** or **xframe deny error**.

Since, MSAL.js cannot dismiss the 302 issued by Azure AD and is required to process the returned token, it cannot prevent the `redirect_uri` from getting loaded in the iframe.

To avoid the entire app reloading again or other errors caused due to this, please follow these workarounds:

* **Specify a different html for the iframe:**

    Set `redirect_uri` property on config to a simple page, that does not require authentication. You have to make sure that it matches with the `redirect_uri` registered in Azure portal. This will not affect user's login experience as MSAL saves the start page when user begins the login process and redirects back to the exact location after login is completed.

* **Conditional initialization in your main app file:**

    If your app is structured such that there is one central Javascript file that defines the app's initialization, routing and other stuff, you can conditionally load your app modules based on whether the app is loading in an iframe or not. For example:

    *In AngularJS: app.js*
    ```js

    // Check that the window is an iframe and not popup
    if (window !== window.parent && !window.opener) {
    angular.module('todoApp', ['ui.router', 'MsalAngular'])
        .config(['$httpProvider', 'msalAuthenticationServiceProvider','$locationProvider', function ($httpProvider, msalProvider,$locationProvider) {
            msalProvider.init(
                // msal configuration
            );

            $locationProvider.html5Mode(false).hashPrefix('');
        }]);
    }
    else {
        angular.module('todoApp', ['ui.router', 'MsalAngular'])
            .config(['$stateProvider', '$httpProvider', 'msalAuthenticationServiceProvider', '$locationProvider', function ($stateProvider, $httpProvider, msalProvider, $locationProvider) {
                $stateProvider.state("Home", {
                    url: '/Home',
                    controller: "homeCtrl",
                    templateUrl: "/App/Views/Home.html",
                }).state("TodoList", {
                    url: '/TodoList',
                    controller: "todoListCtrl",
                    templateUrl: "/App/Views/TodoList.html",
                    requireLogin: true
                })

                $locationProvider.html5Mode(false).hashPrefix('');

                msalProvider.init(
                    // msal configuration
                );
            }]);
    }
    ```

    *In Angular: app.module.ts*

    ```js
    // Imports...
    @NgModule({
      declarations: [
        AppComponent,
        MsalComponent,
        MainMenuComponent,
        AccountMenuComponent,
        OsNavComponent
      ],
      imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        MsalModule.forRoot(environment.MsalConfig),
        SuiModule,
        PagesModule
      ],
      providers: [
        HttpServiceHelper,
        {provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true},
        AuthService
      ],
      entryComponents: [
        AppComponent,
        MsalComponent
      ]
    })
    export class AppModule {
      constructor() {
        console.log('APP Module Constructor!');
      }

      ngDoBootstrap(ref: ApplicationRef) {
        if (window !== window.parent && !window.opener)
        {
          console.log("Bootstrap: MSAL");
          ref.bootstrap(MsalComponent);
        }
        else
        {
        //this.router.resetConfig(RouterModule);
          console.log("Bootstrap: App");
          ref.bootstrap(AppComponent);
        }
      }
    }
    ```
    *MsalComponent:*

    ```js
    import { Component} from '@angular/core';
    import { MsalService } from '@azure/msal-angular';

    // This component is used only to avoid Angular reload
    // when doing acquireTokenSilent()

    @Component({
      selector: 'app-root',
      template: '',
    })
    export class MsalComponent {
      constructor(private Msal: MsalService) {
      }
    }
    ```

## I get this error "Refused to display ... in a frame because it set 'X-Frame-Options' to 'DENY'.

The root cause for this is same as described [above in the answer](#how-to-avoid-page-reloads-when-acquiring-and-renewing-tokens-silently) to avoiding page reloads when acquiring and renewing tokens silently. Please try one of the solutions suggested in the answer.

## MSAL goes into infinite loop when renewing token and creates nested iframes.

The root cause for this is same as described [above in the answer](#how-to-avoid-page-reloads-when-acquiring-and-renewing-tokens-silently) to avoiding page reloads when acquiring and renewing tokens silently. Please try one of the solutions suggested in the answer.

## AADSTS50058: A silent sign-in request was sent but no user is signed in.

**Cause**: This error can occur when MSAL.js sends a silent request(`acquireTokenSilent`) to Azure AD to get a new access_token or id_token but there is no valid authentication cookie representing a user session sent along with the request. As a result, Azure AD cannot identify the user and returns the above error. One of the following might be the reason for the cookie not being present:

* **Cookie Expired**: If the authentication cookie set by Azure AD in the browser when user logged in is expired or deleted. Usually, the cookie is valid until browsing session is valid which means closing the browser or leaving the browser idle for extended time can delete/expire the cookie.  
**Solution:** User needs to check the "Keep Me Signed In" checkbox if the authentication session should be persisted for longer period of time. Otherwise, application needs to log back the user in to create a new session.

* **Using IE/Edge**: The silent token acquisition in MSAL.js happens using hidden iframe. IE/Edge have security zones that prevent sending cookies in an iframe if the iframe's and main app's domains are in different security zones. This means if your app's domain and Azure AD authority url are in different security zones, browser will not send the Azure AD cookie in the iframe request.  
**Solution:** Both app and Azure AD authority url need to be added in the same security zone in the browser settings.

* **3rd Party Cookies Blocked**: If the 3rd party cookies are blocked by the browser, then cookies will not be sent along in the token request.  
**Solution:** User (or admin) needs to allow the 3rd party cookies for MSAL.JS silent request to work as expected.

## How to pass custom state parameter value in MSAL.js authentication request? For example: When you want to pass the page the user is on or custom info to your redirect uri.

The state parameter as defined by OAuth 2.0 is a value included in the request that will also be returned in the token response typically used for preventing cross-site request forgery attacks. By default, MSAL.js passes a randomly generated unique value for this purpose in the authentication requests.

This parameter can also be used to encode information of the app's state before redirect. You can pass the user's state in the app, such as the page or view they were on as input to this parameter.
The MSAL.js library allows you to pass your custom state as `state` parameter in the Request object.

```javascript
// Request type
export type AuthenticationParameters = {
    scopes?: Array<string>;
    extraScopesToConsent?: Array<string>;
    prompt?: string;
    extraQueryParameters?: QPDict;
    claimsRequest?: string;
    authority?: string;
    state?: string;
    correlationId?: string;
    account?: Account;
    sid?: string;
    loginHint?: string;
};
```

For example:

```javascript
let loginRequest = {
    scopes: ["user.read", "user.write"],
    state: “page_url”
}

myMSALObj.loginPopup(loginRequest);
```

The passed in state is appended to the unique guid set by MSAL.js when sending the request. When the response is returned, MSAL.js checks for a state match and then returns the custom passed in state in the Response object as `accountState`.

```javascript
export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: IdToken;
    accessToken: string;
    scopes: Array<string>;
    expiresOn: Date;
    account: Account;
    accountState: string;
};
```
