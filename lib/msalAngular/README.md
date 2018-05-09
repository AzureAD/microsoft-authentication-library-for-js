
Microsoft Authentication Library Preview for Angular
=========================================================

| [Getting Started](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi-v2 )| [Docs](https://aka.ms/aaddevv2) | [Library Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/docs/classes/_useragentapplication_.useragentapplication.html) | [Support](README.md#community-help-and-support) | [Samples](./devApps/VanillaJSTestApp )
| --- | --- | --- | --- | --- |


The MSAL library preview for Angular enables your app to authorize enterprise users using Microsoft Azure Active Directory (AAD), Microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io). 

The identity management services that the library interacts with are [Microsoft Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/), [Microsoft Azure B2C](https://azure.microsoft.com/services/active-directory-b2c/) and [Microsoft Accounts](https://account.microsoft.com).


[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)[![npm version](https://img.shields.io/npm/v/msal.svg?style=flat)](https://www.npmjs.com/package/msal)[![npm version](https://img.shields.io/npm/dm/msal.svg)](https://nodei.co/npm/msal/)

## Important Note about the MSAL Preview
This library is suitable for use in a production environment. We provide the same production level support for this library as we do our current production libraries. During the preview we may make changes to the API, internal cache format, and other mechanisms of this library, which you will be required to take along with bug fixes or feature improvements. This may impact your application. For instance, a change to the cache format may impact your users, such as requiring them to sign in again. An API change may require you to update your code. When we provide the General Availability release we will require you to update to the General Availability version within six months, as applications written using a preview version of library may no longer work.


## Example
This example shows how to acquire a token to read user information from Microsoft Graph.
1. Register an application in Azure AD v2.0 (using the [application registration portal](https://apps.dev.microsoft.com/)) to get your client_id. you will also need to add the Web platform, check the "Implicit Flow" checkbox, and add the redirectURI to your application.


## Installation

Via NPM:

    npm install ms-msal-angular --save
    
##Usage in Angular-cli application

1. Import MsalModule into app.module.ts. Not all config parameters are mandatory. Please see the config section to know more about the config options.
````
@NgModule({
  imports: [ MsalModule.forRoot({
                  clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
                  authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                  validateAuthority : true,
                  cacheLocation : "localStorage",
                  postLogoutRedirectUri: "http://localhost:4200/",
                  navigateToLoginRequestUrl : true,
                  popUp: true,
                  tokenReceivedCallback : null,
                  scopes: ["user.read", "mail.send"],
                  //anonymousEndpoints: ["https://graph.microsoft.com/v1.0/me"],
                  endpoints : endpointmap,
                })]
           })
           
  export class AppModule { }
````
## Adding interceptor 
 Add the msalInterceptor in your app.module.ts. MsalInterceptor will add the access token to all your http request. Using MsalInterceptor is optional.
 So if you want to write your own interceptor, ignore this.
 ````
 providers: [ProductService
    ,{ provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }
    ],
  ````
    
##Config options

clientID(Mandatory): Specifies the Azure AD client id/application Id of the calling web service;

authority(Optional): Instance host url+tenant. Default value is https://login.microsoftonline.com/common 

validateAuthority(Optional) :Validate the issuer of tokens. Default is true.

cacheLocation(Optional): Sets browser storage to either 'localStorage' or sessionStorage'. Defaults is 'sessionStorage'.

postLogoutRedirectUri(Optional): Redirects the user to postLogoutRedirectUri after logout. Defaults is 'redirectUri.

logger(Optional): Logging purpose.

loadFrameTimeout(Optional): The number of milliseconds of inactivity before a token renewal response from AAD should be considered timed out. Default is 6 seconds.

navigateToLoginRequestUrl(Optional):Ability to turn off default navigation to start page after login. Default is false.

popup(??): Show login popup or redirect. Default:?

Scopes: Allows the client to express the desired scopes that should be consented. Scopes can be from multiple resources. Passing scope here will
only consent it and no access token will be acquire till client actually calls the API.

AnonymousEndpoints(Optional): Array of  URI's. Msal will not attach a token to outgoing requests that have these uri. Defaults to 'null'. 

Endpoints(Optional) : Mapping of endpoints to scopes {"https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]}. Used internally by the MSAL for automatically attaching tokens in webApi calls. 

RedirectUrl(Optional): Location to redirect, can be a relative of absolute url. Default: window.location.href.


## Protecting routes
Routes can be protected by just adding canActivate : [MsalGuard] to your routes.
````
 { path: 'product', component: ProductComponent,canActivate : [MsalGuard],
    children: [
      { path: 'detail/:id', component: ProductDetailComponent  }
    ]
   },
  { path: 'myProfile' ,component: MyProfileComponent, canActivate : [MsalGuard]},
  ````
  
  ##Public API
We expose APIs for login, logout acquireAccessToken and more. Here is the list.
````
1.login_redirect() 
2.login_popup()
3.log_out()
4.acquire_token_silent()
5.acquire_token_popup()
6.get_user()

````
## Build and running tests

If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library and install the dependencies:

	npm install
	
Then use the following command to build the library and run all the unit tests:

	npm run ngcompile

## Community Help and Support

- [FAQ](../../wiki) for access to our frequently asked questions

- [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag MSAL.
We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before. 

- [GitHub Issues](../../issues) for reporting an bug or feature requests 

- [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. You can clone the repo and start contributing now. 

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Security Library

This library controls how users sign-in and access services. We recommend you always take the latest version of our library in your app when possible. We use [semantic versioning](http://semver.org) so you can control the risk associated with updating your app. As an example, always downloading the latest minor version number (e.g. x.*y*.x) ensures you get the latest security and feature enhanements but our API surface remains the same. You can always see the latest version and release notes under the Releases tab of GitHub.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.


Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");



## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
