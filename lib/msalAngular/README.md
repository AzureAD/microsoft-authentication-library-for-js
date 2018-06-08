
Microsoft Authentication Library for Angular Preview
=========================================================

| [Getting Started](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi-v2 )| [Docs](https://aka.ms/aaddevv2) | [Library Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/docs/classes/_useragentapplication_.useragentapplication.html) | [Support](README.md#community-help-and-support) | [Samples](./devApps/VanillaJSTestApp )
| --- | --- | --- | --- | --- |


The MSAL library preview for Angular enables your app to authorize enterprise users using Microsoft Azure Active Directory (AAD), Microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io). 

The identity management services that the library interacts with are [Microsoft Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/), [Microsoft Azure B2C](https://azure.microsoft.com/services/active-directory-b2c/) and [Microsoft Accounts](https://account.microsoft.com).


[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)[![npm version](https://img.shields.io/npm/v/msal.svg?style=flat)](https://www.npmjs.com/package/msal)[![npm version](https://img.shields.io/npm/dm/msal.svg)](https://nodei.co/npm/msal/)

## Important Note about the MSAL-Angular Preview
This library is suitable for use in a production environment. We provide the same production level support for this library as we do our current production libraries. During the preview we may make changes to the API, internal cache format, and other mechanisms of this library, which you will be required to take along with bug fixes or feature improvements. This may impact your application. For instance, a change to the cache format may impact your users, such as requiring them to sign in again. An API change may require you to update your code. When we provide the General Availability release we will require you to update to the General Availability version within six months, as applications written using a preview version of library may no longer work.


## Example
This example shows how to acquire a token to read user information from Microsoft Graph.
1. Register an application in Azure AD v2.0 (using the [application registration portal](https://ms.portal.azure.com)) to get your client_id. you will also need to add the Web platform, check the "Implicit Flow" checkbox, and add the redirectURI to your application.


## Installation

Via NPM:

    npm install ms-msal-angular --save
    
## Usage in Angular-cli application

1. Import MsalModule into app.module.ts. Not all config parameters are mandatory. Please see the config section below to know more about the config options.
````
export const  protectedResourceMap: Map<string, Array<string>> = new Map<string, Array<string>>();

protectedResourceMap.set ("https://graph.microsoft.com/v1.0/me", ["user.read"]);
protectedResourceMap.set("https://buildtodoservice.azurewebsites.net/api/todolist", ["api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"]);

export function loggerCallback(logLevel, message, piiEnabled) {
  
}

@NgModule({
  imports: [ MsalModule.forRoot({
                  clientID: Your client ID,
                  authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
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
````
## Config options

<b>clientID(Mandatory)</b>: The clientID of your application, you should get this from the application registration portal.

<b>redirectUri(Optional)</b> : The redirect URI of your app, where authentication responses can be sent and received by your app. It must exactly match one of the redirect URIs you registered in the portal, except that it must be URL encoded.
Defaults to `window.location.href`.
 
<b>authority(Optional)</b>:  A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;, where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
   * - Default value is: "https://login.microsoftonline.com/common"
   
<b>validateAuthority(Optional)</b> :Validate the issuer of tokens. Default is true.

<b>cacheLocation(Optional)</b>: Sets browser storage to either 'localStorage' or sessionStorage'. Defaults is 'sessionStorage'.

<b>postLogoutRedirectUri(Optional)</b>: Redirects the user to postLogoutRedirectUri after logout. Defaults is 'redirectUri'.

<b>loadFrameTimeout(Optional)</b>: The number of milliseconds of inactivity before a token renewal response from AAD should be considered timed out. Default is 6 seconds.

<b>navigateToLoginRequestUrl(Optional)</b>:Ability to turn off default navigation to start page after login. Default is true. This is used only for redirect flows.

<b>popup(Optional)</b>: Show login popup or redirect. Default:Redirect

<b>consentScopes(Optional)</b>: Allows the client to express the desired scopes that should be consented. Scopes can be from multiple resources/endpoints. Passing scope here will
only consent it and no access token will be acquired till the time client actually calls the API. This is optional if you are using MSAL for only login(Authentication).

<b>unprotectedResources(Optional)</b>: Array of  URI's. Msal will not attach a token to outgoing requests that have these uri. Defaults to 'null'. 

<b>protectedResourceMap(Optional)</b>: Mapping of resources to scopes {"https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]}. Used internally by the MSAL for automatically attaching tokens in webApi calls. 
This is required only for CORS calls.

<b>level(Optional)</b>: Configurable log level. Default value is Info.

<b>logger(Optional)</b>: Callback instance that can be provided by the developer to consume and publish logs in a custom manner. Callback method must follow this signature. 
loggerCallback(logLevel, message, piiEnabled) { }

<b>piiLoggingEnabled(Optional)</b>: PII stands for Personal Identifiable Information. By default, MSAL does not capture or log any PII. By turning on PII, the app takes responsibility for safely handling highly-sensitive data and complying with any regulatory requirements.
 This Flag is to enable/disable logging of PII data. PII logs are never written to default outputs like Console, Logcat or NSLog. Default is set to false.


## Adding interceptor 
 Add the msalInterceptor in your app.module.ts. MsalInterceptor will add the access token to all your http request except the unprotectedResources. Using MsalInterceptor is optional.
 If user wants to write their own interceptor, please ignore this.
 ````
 providers: [ProductService
    ,{ provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }
    ],
  ````
  

## Protecting routes
Routes can be protected by just adding canActivate : [MsalGuard] to your routes. It can be added at the parent or child routes.
````
 { path: 'product', component: ProductComponent,canActivate : [MsalGuard],
    children: [
      { path: 'detail/:id', component: ProductDetailComponent  }
    ]
   },
  { path: 'myProfile' ,component: MsGraphComponent, canActivate : [MsalGuard]},
  ````
  
## Public API
We expose APIs for login, logout, acquiring access token and more. Here is a detailed list.
````
1.login_redirect() 
2.login_popup() 
3.log_out()
4.acquire_token_silent() - This will try to acquire the token silently. If the scope is not already consented then user will get a callback at msal:acquireTokenFailure event. User can call either acquire_token_popup() or acquire_token_redirect() there to acquire the token interactively.
5.acquire_token_popup()
6.acquire_token_redirect()
7.get_user()

Since MSAL Angular wrapper is inheriting from UserAgentApplication of MSAL-core,all the public apis of msal-core are still accessible from msal-angular. But user should not try to use
any of the msal-core apis like acquireTokenSilent(), acquireTokenPopup(), acquireTokenRedirect() etc from angular application. User should use only the apis which are exposed directly from the msal-angular wrapper itself.
````

## Callbacks
MSAL wrapper provides below callbacks for various operations. For all callbacks, you need to inject BroadcastService as a dependency in your component/service.

1)login_popup()/login_redirect using api or using routes.

````
this.broadcastService.subscribe("msal:loginFailure", (payload) => {
// do something here
});
    
this.broadcastService.subscribe("msal:loginSuccess", (payload) => {
// do something here 
});
````
   
2)acquire_token_silent()/acquire_token_popup()/acquire_token_redirect()
````
this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
     // do something here 
});

this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      // do something here 
});
````  

## Unsubscribe
It is extremely important to unsubscribe. Implement ngOnDestroy() in your component and unsubscribe.
````
 private subscription: Subscription;
 
 this.subscription=  this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
 }

 ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }
````

## Logging
These 4 properties in config are used for logging. Please see the config section for more details.

1)logger
 
2)correlationId

3)level

4)piiLoggingEnabled

  
## Build and running tests

If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library(msalAngular) and install the dependencies:

	npm install
	
Then use the following command to build the library and run all the unit tests:

	npm run ngcompile

