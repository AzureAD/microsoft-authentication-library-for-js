# Microsoft Authentication Library for Angular

| [Getting Started](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-angular)| [AAD Docs](https://aka.ms/aaddevv2) | [Library Reference](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-angular/) | [Support](README.md#community-help-and-support) | [Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples)
| --- | --- | --- | --- | --- |

MSAL for Angular enables client-side Angular web applications, running in a web browser, to authenticate users using [Azure AD](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

![npm (scoped)](https://img.shields.io/npm/v/@azure/msal-angular)![npm](https://img.shields.io/npm/dw/@azure/msal-angular)

## Installation

The MSAL Angular package is available on NPM:

`npm install msal @azure/msal-angular --save`

## Guides

- [Quickstart](https://docs.microsoft.com/azure/active-directory/develop/quickstart-v2-angular)
- [Upgrade Guide (0.x-1.x)](./docs/0.x-1.x-upgrade-guide.md)
- [Configuration](./docs/configuration.md)

## Samples

* [Angular Quickstart](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-angular)
* [B2C Angular SPA](https://github.com/Azure-Samples/active-directory-b2c-javascript-angular-spa)
* [Angular v6](../../samples/angular6-sample-app)
* [Angular v7](../../samples/angular7-sample-app)
* [Angular v8](../../samples/angular8-sample-app)
* [Angular v9](../../samples/angular9-sample-app)

## Usage

### Prerequisites

Before using MSAL.js, [register an application in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) to get your `clientId`.

### 1. Include and initialize the MSAL module in your app module.

Import MsalModule into app.module.ts. To initialize MSAL module you are required to pass the clientId of your application which you can get from the application registration.

```js
@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: "Your client ID"
            }
        })
    ]
})
export class AppModule {}
```

#### 2. Secure the routes in your application

You can add authentication to secure specific routes in your application by just adding `canActivate : [MsalGuard]` to your route definition. It can be added at the parent or child routes.

```js
{
    path: 'product',
    component: ProductComponent,
    canActivate: [MsalGuard],
    children: [
        {
            path: 'detail/:id',
            component: ProductDetailComponent
        }
    ]
}, {
    path: 'myProfile',
    component: MsGraphComponent,
    canActivate: [MsalGuard]
},
```

When a user visits these routes, the library will prompt the user to authenticate.

### 3. Get tokens for Web API calls

MSAL Angular allows you to add an Http interceptor (`MsalInterceptor`) in your `app.module.ts` as follows. MsalInterceptor will obtain tokens and add them to all your Http requests in API calls except the API endpoints listed as `unprotectedResources`.

```js
providers: [
    ProductService, {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true
    }
],
```

Using MsalInterceptor is optional and you can write your own interceptor if you choose to. Alternatively, you can also explicitly acquire tokens using the acquireToken APIs.

### 4. Subscribe to event callbacks

MSAL wrapper provides below callbacks for various operations. For all callbacks, you need to inject BroadcastService as a dependency in your component/service.

1. Login-related events (`loginPopup`/`loginRedirect`)

```js
this.broadcastService.subscribe("msal:loginFailure", payload => {
    // do something here
});

this.broadcastService.subscribe("msal:loginSuccess", payload => {
    // do something here
});
```

2. Token-related events (`acquireTokenSilent()`/`acquireTokenPopup()`/`acquireTokenRedirect()`)

```js
this.broadcastService.subscribe("msal:acquireTokenSuccess", payload => {
    // do something here
});

this.broadcastService.subscribe("msal:acquireTokenFailure", payload => {
    // do something here
});
```

3. It is extremely important to unsubscribe. Implement `ngOnDestroy()` in your component and unsubscribe.

```js
 private subscription: Subscription;

 this.subscription = this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {});

 ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
```

## MSAL Angular Public API

### Login and AcquireToken APIs

The wrapper exposes APIs for login, logout, acquiring access token and more.

1. `loginRedirect()`
2. `loginPopup()`
3. `logOut()`
4. `acquireTokenSilent()`
5. `acquireTokenPopup()`
6. `acquireTokenRedirect()`
7. `getAccount()`

> Note: Since MSAL Angular wrapper is inheriting from UserAgentApplication of msal-core, all the public APIs of msal-core are still accessible from msal-angular. But it is recommended not to use
> any of the msal-core APIs like acquireTokenSilent(), acquireTokenPopup(), acquireTokenRedirect() etc from Angular application and use only the APIs which are exposed directly from the msal-angular wrapper itself.

## Advanced Topics

### Logging

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
        auth: {
            clientId: 'Your client ID',
        },
        system: {
            logger: new Logger(loggerCallback, {
                correlationId: '1234',
                level: LogLevel.Verbose,
                piiLoggingEnabled: true,
            }
        }
    })]
})
```

### Multi-Tenant

By default, you have multi-tenant support since MSAL sets the tenant in the authority to 'common' if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the `authority` config property as shown above.

If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

### Security

Tokens are accessible from Javascript since MSAL is using HTML5 storage. Default storage option is sessionStorage, which keeps the tokens per session. You should ask user to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [https://www.owasp.org/index.php/XSS\_(Cross_Site_Scripting)\_Prevention_Cheat_Sheet](<https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet>)

### CORS API usage

MSAL will get access tokens using a hidden Iframe for given CORS API endpoints in the config. To make CORS API call, you need to specify your CORS API endpoints as a map in the config.

```js
export const protectedResourceMap:[string, string[]][]= [
    ['https://buildtodoservice.azurewebsites.net/api/todolist', [ 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user' ]],
    ['https://graph.microsoft.com/v1.0/me', ['user.read']]
];

@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: 'Your client ID',
            },
            framework: {
                protectedResourceMap : protectedResourceMap
            }
        })
    ]
})
```

In your API project, you need to enable CORS API requests to receive flight requests.

### Internet Explorer support

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
    framework: {
        popUp: !isIE
    }
});
```

## Community Help and Support

-   [FAQs](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/FAQs) for access to our frequently asked questions
-   [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag "msal".
    We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
-   [GitHub Issues](../../issues) for reporting a bug or feature requests
-   [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Build and running tests

If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library(msal-angular) and install the dependencies:

    npm install

Then use the following command to build the library and run all the unit tests:

    npm run build

    npm run test

## Versioning

This library controls how users sign-in and access services. We recommend you always take the latest version of our library in your app when possible. We use [semantic versioning](http://semver.org) so you can control the risk associated with updating your app. As an example, always downloading the latest minor version number (e.g. x._y_.x) ensures you get the latest security and feature enhanements but our API surface remains the same. You can always see the latest version and release notes under the Releases tab of GitHub.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
