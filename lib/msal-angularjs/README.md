Microsoft Authentication Library Preview for AngularJS (MSAL AngularJS)
====================================

The MSAL library preview for AngularJS is a wrapper of the core MSAL.js library which enables AngularJS(1.7+) applications to authenticate enterprise users using Microsoft Azure Active Directory (AAD), Microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io).


[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.svg?branch=master)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)

## Important Note about the MSAL AngularJS Preview
Please note that during the preview we may make changes to the API, internal cache format, and other mechanisms of this library, which you will be required to take along with bug fixes or feature improvements. This may impact your application. For instance, a change to the cache format may impact your users, such as requiring them to sign in again. An API change may require you to update your code. When we provide the General Availability release we will require you to update to the General Availability version within six months, as applications written using a preview version of library may no longer work.

This is an early preview library and we are tracking certain [known issues and requests](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3Aangularjs+) which we plan on addressing. Please watch the [Roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki#roadmap) for details.

## Installation
The msal-angularjs package is available on NPM:

`npm install @azure/msal-angularjs --save`

## Usage

#### Prerequisite

Before using MSAL.js, [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) to get your clientID.

#### 1. Include a reference to the MSAL module in your app module.
```js
var app =  angular.module('todoApp', ['MsalAngular'])
```

#### 2. Initialize MSAL with the AAD app coordinates at app config time.

To initialize the MSAL provider you will require to pass the clientID of your application and a tokenReceivedCallback function:

```js
window.applicationConfig = {
      clientID: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523'
};

app.config(['msalAuthenticationServiceProvider', function (msalProvider) {
	msalProvider.init({
		clientID: applicationConfig.clientID,
		tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
		}
	});
}]);
```
* **clientID**: The clientID of your application, you should get this from the application registration portal.

* **tokenReceivedCallBack** : The function that will get the call back once this API is completed (either successfully or with a failure).

> Note: When HTML5 mode is not configured, ensure the $locationProvider hashPrefix is set to an empty string
```js
app.config(['$locationProvider', function($locationProvider) {
	$locationProvider.html5Mode(false).hashPrefix('');
}]);
```
Without the above setting, AAD login will loop indefinitely as the callback URL from AAD (in the form of, {yourBaseUrl}/#{AADTokenAndState}) will be rewritten to remove the '#' causing the token parsing to fail and login sequence to occur again.


#### 3. Secure the routes in your application
You can add authentication to secure specific routes in your application by setting the `requireLogin: true` flag in the route definition as follows:

```js
$routeProvider.
   when("/todoList", {
       controller: "todoListController",
       templateUrl: "/App/Views/todoList.html",
       requireLogin: true
   });
```

When user visits this route, the library prompts the user to authenticate.

#### 4. Set-up login/logout in Controllers
If you choose, in addition (or substitution) to route level protection you can add explicit login/logout functions which can be called from the UI as follows:

```js
'use strict';
app.controller('homeCtrl', ['$scope', 'msalAuthenticationService', '$location', '$log', '$http', '$rootScope', function ($scope, msalService, $location, $log, $http, $rootScope) {
    // this is referencing msal module to do login
    $scope.testMessage = "";
    $scope.init = function () {
        $scope.testMessage = "";
    };

    $scope.logout = function () {
        msalService.logOut();
    };

    $scope.login = function () {
        msalService.login();
    };


}]);
```

#### 5. Callbacks
You can get callbacks for login and acquire Token success/failure.

```js

    $scope.$on("msal:loginSuccess", function () {
        $scope.testMessage = "loginSuccess";
    });


    $scope.$on("msal:loginFailure", function () {
        $scope.testMessage = "loginFailure";
    });


    $scope.$on("msal:notAuthorized", function (event, rejection, forResource) {
        $scope.testMessage = "It is not Authorized for resource:" + forResource;
    });


    $scope.$on("msal:acquireTokenFailure", function (event, errorDesc, error) {
    });


    $scope.$on("msal:acquireTokenSuccess", function (event, tokenOut) {
    });


```

#### 6. Use userInfo object to access properties of the currently signed in user.

The userInfo object is defined in the MsalAngular module with the following properties:

```{ isAuthenticated: false, userName: '', loginError: '', idToken: {} }```

The `userInfo.idToken` property provides access to the claims in the ID token received from AAD. The claims can be used by the application for validation, to identify the subject's directory tenant, and so on. The complete list of claims with a brief description of each value is here, [Claims in ID tokens](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-v2-tokens#claims-in-id-tokens).

You can use the `userInfor.isAuthenticated` property to alter login/logout UX elements as shown below.
```html
<ul class="nav navbar-nav navbar-right">
    <li><a class="btn btn-link" ng-show="userInfo.isAuthenticated" ng-click="logout()">Logout</a></li>
    <li><a class="btn btn-link" ng-hide="userInfo.isAuthenticated" ng-click="login()">Login</a></li>
</ul>
```

#### 7. Get tokens for Web API calls

MSAL AngularJS allows you to pass an Http interceptor (`$httpProvider`). This httpInterceptor will obtain token and attach it to all Http requests to web APIs except the API endpoints listed as `unprotectedResources`.

```js
app.config(['msalAuthenticationServiceProvider', '$httpProvider', function (msalProvider) {
   msalProvider.init(
    	{
            clientID: applicationConfig.clientID,
            tokenReceivedCallback: function (errorDesc, token, error, tokenType) { }
        },
        $httpProvider
    );
}]);
```
Using the interceptor is optional and you can write your own interceptor if you choose to. Alternatively, you can also explicitly acquire tokens using the acquireToken APIs.


## MSAL AngularJS public API
#### Login and AcquireToken APIs

The wrapper exposes APIs for login, logout, acquiring access token and more.
1. loginRedirect()
2. loginPopup()
4. logout()
5. acquireTokenSilent() - This will try to acquire the token silently. If the scope is not already consented then user will get a callback at msal:acquireTokenFailure event. User can call either acquire_token_popup() or acquire_token_redirect() there to acquire the token interactively.
6. acquireTokenPopup()
7. acquireTokenRedirect()
8. getUser()

## Optional Config Object for MSAL initialization
You can pass the following config options as an optional object to MSAL during initialization:

* **redirectUri** : The redirect URI of your app, where authentication responses can be sent and received by your app. It must exactly match one of the redirect URIs you registered in the portal, except that it must be URL encoded.
	Defaults to 'window.location.href'.

* **authority** : A URL indicating a directory that MSAL can use to obtain tokens.
    	* In Azure AD, it is of the form https://<instance>/<tenant>, where <instance> is the directory host (e.g. https://login.microsoftonline.com) and <tenant> is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
    	* In Azure AD B2C, it is of the form https://<instance>/tfp/<tenantId>/<policyName>/
    	* Default value is: "https://login.microsoftonline.com/common"

* **validateAuthority** : Validate the issuer of tokens. Default is true.

* **cacheLocation** : Sets browser storage to either 'localStorage' or sessionStorage'. Default is 'sessionStorage'.

* **postlogoutRedirectUri** : Redirects the user to postLogoutRedirectUri after logout. Default is 'redirectUri'.

* **loadFrameTimeout** : The number of milliseconds of inactivity before a token renewal response from AAD should be considered timed out. Default is 6 seconds.

* **navigateToLoginRequestUrl** : Ability to turn off default navigation to start page after login. Default is false.

* **unprotectedResources** :  is an array of values that will be ignored by the MSAL route/state change handlers. MSAL will not attach a token to outgoing requests that have these keywords or URI. Routes that *do not* specify the ```requireLogin=true``` property are added to the ```unprotectedResources``` array automatically.

* **protectedResourceMap** : Mapping of endpoints to scopes {"https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]}. Used internally by  MSAL for automatically attaching tokens in webApi calls. This is required only for CORS calls. Please refer to CORS API usage below.

* **logger** : Logging is not enabled by default. To enable logging, you need to pass an instance of logger to configOptions.

* **level** : Configurable log level. Default value is Info.

* **correlationId** : Unique identifier used to map the request with the response. Defaults to RFC4122 version 4 guid (128 bits).

* **storeAuthStateInCookie** : This will store the auth state (state and nonce) in cookie to handle the issue of the session storage and local storage getting cleared in IE and edge browsers during redirects across different security zones. Default value is false.


#### Optional config Object for Route protection
This is an optional object you can pass to the wrapper. It has the following properties:

* **consentScopes** : It takes an array of scopes. Allows the client to express the desired scopes that should be consented at the time of login. Scopes can be from multiple resources/endpoints. Passing scope here will only consent it and no access token will be acquired till the time the client actually calls the API. By asking for consent at the time of login, subsequest acquireToken calls to the same resources will succeed in a hidden iframe without the need to show explicit UI.

* **popUp** : The default login triggered by route protection use the redirect flow. You can change it to popUp by setting this property to true. Default is false.

* **requireLogin** : When set, this property will make the entire set of routes/states protected. It eliminates the need to specify requireLogin in every route.

```js
msalProvider.init({
        clientID: applicationConfig.clientID,
        authority: null,
        tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
        },
        optionalParams: {
        },
        routeProtectionConfig: {
        popUp: true,
        consentScopes: applicationConfig.consentScopes
        }
}, $httpProvider);
```


## Advanced Topics

#### Logging
The logger definition has the following properties. Please see the config section for more details on their use:
1. correlationId
2. level
3. piiLoggingEnabled

You can enable logging in your app as shown below:

```js
var logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose, correlationId: '12345', piiLoggingEnabled: true });
function loggerCallback(logLevel, message, piiEnabled) {
		console.log(message);// You can log the messages to the console or save it in some file as per your need
}

app.config(['msalAuthenticationServiceProvider','$httpProvider', function (msalProvider) {
   msalProvider.init({
        clientID: applicationConfig.clientID,
        tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
        },
        optionalParams: {
            logger: logger,
        },
    });
}]);
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
var endpointsMap = new Map();
map.set(applicationConfig.apiEndpoint, applicationConfig.apiScope);
map.set(applicationConfig.graphEndpoint, applicationConfig.graphScopes);

app.config(['msalAuthenticationServiceProvider', '$httpProvider', function (msalProvider) {
   msalProvider.init(
	{
        clientID: applicationConfig.clientID,
        tokenReceivedCallback: function (errorDesc, token, error, tokenType) {

        },
        configOptions: {
           protectedResourceMap: endpointsMap
        },
    }, $httpProvider);
}]);
```

 Your service will be similar to this to make the call from JS.

```js
'use strict';
app.factory('contactService', ['$http', function ($http){
	var serviceFactory = {};
	var _getItems = function () {
	$http.defaults.useXDomain = true;
	delete $http.defaults.headers.common['X-Requested-With'];
	return $http.get('https://buildtodoservice.azurewebsites.net/api/todolist');
	};
	serviceFactory.getItems = _getItems;
	return serviceFactory;
}]);
```

In your API project, you need to enable CORS API requests to receive flight requests.

> Note: The Iframe needs to access the cookies for the same domain that you did the initial sign in on. IE does not allow to access cookies in Iframe for localhost. Your URL needs to be fully qualified domain i.e http://yoursite.azurewebsites.com. Chrome does not have this restriction.

#### Trusted Site settings in IE
If you put your site in the trusted site list, cookies are not accessible for Iframe requests. You need to remove protected mode for Internet zone or add the authority URL for the login to the trusted sites as well.

## Samples

You can find a quickstart and detailed sample under the [sample directory](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angularjs/samples).

## Community Help and Support

- [FAQs](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/FAQs) for access to our frequently asked questions

- [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag "msal".
We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.

- [GitHub Issues](../../issues) for reporting a bug or feature requests

- [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Build and run tests
If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library(msal-angularjs) and install the dependencies:

	npm install

Then use the following command to build the library and run all the unit tests:

	npm run test

## Security Library

This library controls how users sign-in and access services. We recommend you always take the latest version of our library in your app when possible. We use [semantic versioning](http://semver.org) so you can control the risk associated with updating your app. As an example, always downloading the latest minor version number (e.g. x.*y*.x) ensures you get the latest security and feature enhanements but our API surface remains the same. You can always see the latest version and release notes under the Releases tab of GitHub.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
