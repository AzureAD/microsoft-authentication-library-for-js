
Microsoft Authentication Library for Angular Preview
=========================================================

The MSAL library preview for Angular is a wrapper of the core MSAL.js library which enables Angular(4.3 to 5) applications to authenticate enterprise users using Microsoft Azure Active Directory (AAD), Microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io).

[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)

## Important Note about the MSAL Angular Preview
Please note that during the preview we may make changes to the API, internal cache format, and other mechanisms of this library, which you will be required to take along with bug fixes or feature improvements. This may impact your application. For instance, a change to the cache format may impact your users, such as requiring them to sign in again. An API change may require you to update your code. When we provide the General Availability release we will require you to update to the General Availability version within six months, as applications written using a preview version of library may no longer work.

This is an early preview library and we are tracking certain [known issues and requests](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues?q=is%3Aopen+is%3Aissue+label%3Aangular) which we plan on addressing. Please watch the [Roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki#roadmap) for details.

## Installation
The msal-angular package is available on NPM:

`npm install @azure/msal-angular --save`

## Usage

#### Prerequisite

Before using MSAL.js, [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) to get your clientID.

> NOTE: To use MSAL Angular with Angular 6, please install the `rxjs-compat` NPM module for now. In future, we plan to add support for Angular 6 in the library and you can track this [issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/421) for more information.

#### 1. Include and initialize the MSAL module in your app module.
Import MsalModule into app.module.ts. To initialize MSAL module you are required to pass the clientID of your application which you can get from the application registration.

```js
@NgModule({
  imports: [ MsalModule.forRoot({
                    clientID: "Your client ID"
                })]
         })

  export class AppModule { }
```

#### 2. Secure the routes in your application
You can add authentication to secure specific routes in your application by just adding `canActivate : [MsalGuard]` to your route definition. It can be added at the parent or child routes.

```js
 { path: 'product', component: ProductComponent, canActivate : [MsalGuard],
    children: [
      { path: 'detail/:id', component: ProductDetailComponent  }
    ]
   },
  { path: 'myProfile' ,component: MsGraphComponent, canActivate : [MsalGuard] },
```

When user visits these routes, the library prompts the user to authenticate.

#### 3. Get tokens for Web API calls
MSAL Angular allows you to add an Http interceptor (`MsalInterceptor`) in your app.module.ts as follows. MsalInterceptor will obtain tokens and add them to all your Http requests in API calls except the API endpoints listed as `unprotectedResources`.

```js
providers: [ ProductService, {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true
    }
   ],
 ```

Using MsalInterceptor is optional and you can write your own interceptor if you choose to. Alternatively, you can also explicitly acquire tokens using the acquireToken APIs.

#### 4. Subscribe to event callbacks

MSAL wrapper provides below callbacks for various operations. For all callbacks, you need to inject BroadcastService as a dependency in your component/service.

1. loginPopup()/loginRedirect using api or using routes.

```js
this.broadcastService.subscribe("msal:loginFailure", (payload) => {
// do something here
});

this.broadcastService.subscribe("msal:loginSuccess", (payload) => {
// do something here
});
```

2. acquireTokenSilent()/acquireTokenPopup()/acquireTokenRedirect()

```js
this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
     // do something here
});

this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      // do something here
});
```

3. It is extremely important to unsubscribe. Implement ngOnDestroy() in your component and unsubscribe.

```js
 private subscription: Subscription;

 this.subscription=  this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
 });

 ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }
```


## MSAL Angular public API
#### Login and AcquireToken APIs

The wrapper exposes APIs for login, logout, acquiring access token and more.
1. loginRedirect()
2. loginPopup()
3. logOut()
4. acquireTokenSilent() - This will try to acquire the token silently. If the scope is not already consented then user will get a callback at msal:acquireTokenFailure event. User can call either acquireTokenPopup() or acquireTokenRedirect() there to acquire the token interactively.
5. acquireTokenPopup()
6. acquireTokenRedirect()
7. getUser()

> Note: Since MSAL Angular wrapper is inheriting from UserAgentApplication of msal-core, all the public APIs of msal-core are still accessible from msal-angular. But it is recommended not to use
any of the msal-core APIs like acquireTokenSilent(), acquireTokenPopup(), acquireTokenRedirect() etc from Angular application and use only the APIs which are exposed directly from the msal-angular wrapper itself.

#### Config options for MSAL initialization

Besides the required clientID, you can optionally pass the following config options to MSAL module during initialization. For example:

```js
@NgModule({
  imports: [ MsalModule.forRoot({
                  clientID: "Your client ID",
                  authority: "https://login.microsoftonline.com/contoso.onmicrosoft.com/",
                  redirectUri: "http://localhost:4200/",
                  validateAuthority : true,
                  cacheLocation : "localStorage",
                  postLogoutRedirectUri: "http://localhost:4200/",
                  navigateToLoginRequestUrl : true,
                  popUp: true,
                  consentScopes: ["user.read", "api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"],
                  unprotectedResources: ["https://angularjs.org/"],
                  protectedResourceMap : protectedResourceMap,
                  logger :loggerCallback,
                  correlationId: '1234',
                  level: LogLevel.Verbose,
                  piiLoggingEnabled: true,
                })]
           })

  export class AppModule { }
```

* **redirectUri** : The redirect URI of your app, where authentication responses can be sent and received by your app. It must exactly match one of the redirect URIs you registered in the portal, except that it must be URL encoded.
Defaults to `window.location.href`.

* **authority** : A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;, where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
   * - Default value is: "https://login.microsoftonline.com/common"

* **validateAuthority** : Validate the issuer of tokens. Default is true.

* **cacheLocation** : Sets browser storage to either 'localStorage' or sessionStorage'. Defaults is 'sessionStorage'.

* **postLogoutRedirectUri** : Redirects the user to postLogoutRedirectUri after logout. Defaults is 'redirectUri'.

* **loadFrameTimeout** : The number of milliseconds of inactivity before a token renewal response from AAD should be considered timed out. Default is 6 seconds.

* **navigateToLoginRequestUrl** :Ability to turn off default navigation to start page after login. Default is true. This is used only for redirect flows.

* **popup** : Show login popup or redirect. Default:Redirect

* **consentScopes** : Allows the client to express the desired scopes that should be consented. Scopes can be from multiple resources/endpoints. Passing scope here will
only consent it and no access token will be acquired till the time client actually calls the API. This is optional if you are using MSAL for only login(Authentication).

* **unprotectedResources** : Array of  URI's. Msal will not attach a token to outgoing requests that have these uri. Defaults to 'null'.

* **protectedResourceMap** : Mapping of resources to scopes  {"https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]}. Used internally by the MSAL for automatically attaching tokens in webApi calls.
                             This is required only for CORS calls.

export const protectedResourceMap:[string, string[]][]=[ ['https://buildtodoservice.azurewebsites.net/api/todolist',['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user']] , ['https://graph.microsoft.com/v1.0/me', ['user.read']] ];

* **level** : Configurable log level. Default value is Info.

* **logger** : Callback instance that can be provided by the developer to consume and publish logs in a custom manner. Callback method must follow this signature.
loggerCallback(logLevel, message, piiEnabled) { }

* **piiLoggingEnabled** : PII stands for Personal Identifiable Information. By default, MSAL does not capture or log any PII. By turning on PII, the app takes responsibility for safely handling highly-sensitive data and complying with any regulatory requirements.
 This flag is to enable/disable logging of PII data. PII logs are never written to default outputs like Console, Logcat or NSLog. Default is set to false.

* **correlationId** : Unique identifier used to map the request with the response. Defaults to RFC4122 version 4 guid (128 bits).


## Advanced Topics

#### Logging
The logger definition has the following properties. Please see the config section for more details on their use:
1. correlationId
2. level
3. piiLoggingEnabled

You can enable logging in your app as shown below:

```js
export function loggerCallback(logLevel, message, piiEnabled) {
    console.log(message);
}

@NgModule({
  imports: [ MsalModule.forRoot({
                  clientID: Your client ID,
                  logger :loggerCallback,
                  correlationId: '1234',
                  level: LogLevel.Verbose,
                  piiLoggingEnabled: true,
                })]
           })
```

#### Multi-Tenant

By default, you have multi-tenant support since MSAL sets the tenant in the authority to 'common' if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the `authority` config property as shown above.

If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

#### Security
Tokens are accessible from Javascript since MSAL is using HTML5 storage. Default storage option is sessionStorage, which keeps the tokens per session. You should ask user to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)

#### CORS API usage
MSAL will get access tokens using a hidden Iframe for given CORS API endpoints in the config. To make CORS API call, you need to specify your CORS API endpoints as a map in the config.

```js
export const protectedResourceMap:[string, string[]][]=[ ['https://buildtodoservice.azurewebsites.net/api/todolist',['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user']] , ['https://graph.microsoft.com/v1.0/me', ['user.read']] ];

@NgModule({
  imports: [ MsalModule.forRoot({
                  clientID: Your client ID,
                  protectedResourceMap : protectedResourceMap
                })]
           })
```

In your API project, you need to enable CORS API requests to receive flight requests.

> Note: The Iframe needs to access the cookies for the same domain that you did the initial sign in on. IE does not allow to access cookies in Iframe for localhost. Your URL needs to be fully qualified domain i.e http://yoursite.azurewebsites.com. Chrome does not have this restriction.

#### Trusted Site settings in IE
If you put your site in the trusted site list, cookies are not accessible for Iframe requests. You need to remove protected mode for Internet zone or add the authority URL for the login to the trusted sites as well.

## Samples

You can find a quickstart and detailed sample under the [sample directory](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/samples).

## Community Help and Support

- [FAQs](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/FAQs) for access to our frequently asked questions

- [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag "msal".
We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.

- [GitHub Issues](../../issues) for reporting a bug or feature requests

- [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Build and running tests

If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library(msal-angular) and install the dependencies:

	npm install

Then use the following command to build the library and run all the unit tests:

	npm run ngcompile

	npm run test

## Security Library

This library controls how users sign-in and access services. We recommend you always take the latest version of our library in your app when possible. We use [semantic versioning](http://semver.org) so you can control the risk associated with updating your app. As an example, always downloading the latest minor version number (e.g. x.*y*.x) ensures you get the latest security and feature enhanements but our API surface remains the same. You can always see the latest version and release notes under the Releases tab of GitHub.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
