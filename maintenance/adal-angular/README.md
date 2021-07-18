---

This library, ADAL for JavaScript, will no longer receive new feature improvements. Instead, use the new library
[MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js).

* If you are starting a new project, you can get started with the
  [MSAL.js docs](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki)
  for details about the scenarios, usage, and relevant concepts.
* If your application is using the previous ADAL JavaScript library, you can follow this
  [migration guide](https://docs.microsoft.com/azure/active-directory/develop/msal-compare-msal-js-and-adal-js)
  to update to MSAL.js.
* Existing applications relying on ADAL JavaScript will continue to work.

---

Active Directory Authentication Library (ADAL) for JavaScript
====================================
|[Getting Started](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi)| [Docs](https://aka.ms/aaddev)| [Samples](https://github.com/azure-samples?query=active-directory)| [Support](README.md#community-help-and-support) | [Feedback](https://forms.office.com/r/cnmB9FbgX9)
| --- | --- | --- | --- | --- |

Active Directory Authentication Library for JavaScript (ADAL JS) helps you to use Azure AD for handling authentication in your single page applications.
This library works with both plain JS as well as AngularJS applications.

[![npm](https://img.shields.io/npm/v/adal-angular.svg)](https://www.npmjs.com/package/adal-angular)[![npm](https://img.shields.io/npm/dm/adal-angular.svg)](https://www.npmjs.com/package/adal-angular)

## Installation

You have multiple ways of getting ADAL JS:

Via NPM:

    npm install adal-angular

*Note:* Currently there is one NPM package providing both the plain JS library (adal.js) and the AngularJS wrapper (adal-angular.js).

Via CDN:

    <!-- Latest compiled and minified JavaScript -->
    <script src="https://alcdn.msauth.net/lib/1.0.18/js/adal.min.js"></script>
    <script src="https://alcdn.msauth.net/lib/1.0.18/js/adal-angular.min.js"></script>

CDN will be updated to latest version 1.0.18.

Via Bower:

    $ bower install adal-angular

The adal.js source is [here](https://github.com/AzureAD/azure-activedirectory-library-for-js/tree/master/lib/adal.js).
The adal-angular.js source is [here](https://github.com/AzureAD/azure-activedirectory-library-for-js/tree/master/lib/adal-angular.js).

## Usage

**In JavaScript**

You can use ADAL JS as follows in a plain JavaScript application without any frameworks.

1- Include a reference to adal.js in your main app page before your application scripts.

```html
<script src="App/Scripts/adal.js"></script>
<script src="App/Scripts/app.js"></script>
```

2- Initialize ADAL with the AAD app coordinates at app config time. The minimum required config to initialize ADAL is:
```js
window.config = {
   clientId: 'g075edef-0efa-453b-997b-de1337c29185'
};
var authContext = new AuthenticationContext(config);
```

3- You can trigger the login and logout using the authContext
```js
$signInButton.click(function () {
    authContext.login();
});

$signOutButton.click(function () {
    authContext.logOut();
});
```

Refer this [sample](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi) for a full implementation example.

**In AngularJS**

ADAL also provides an AngularJS wrapper as adal-angular.js. Below you can find a quick reference for the most common operations you need to perform in AngularJS applications to use ADAL JS.

1- Include references to angular.js libraries, adal.js, adal-angular.js in your main app page. The ADAL should be included after Angular, but before your application scripts as shown below.
```html
<script src="/Scripts/angular.min.js"></script>
<script src="/Scripts/angular-route.min.js"></script>
<script src="/Scripts/adal.js"></script>
<script src="/Scripts/adal-angular.js"></script>
<script src="App/Scripts/app.js"></script>
```

2- Include a reference to the ADAL module in your app module.
```js
var app = angular.module('demoApp', ['ngRoute', 'AdalAngular']);
```

3- ***When HTML5 mode is configured***, ensure the $locationProvider hashPrefix is set

```js
// using '!' as the hashPrefix but can be a character of your choosing
app.config(['$locationProvider', function($locationProvider) {
	$locationProvider.html5Mode(true).hashPrefix('!');
}]);
```

Without the hashPrefix set, the AAD login will loop indefinitely as the callback URL from AAD (in the form of, {yourBaseUrl}/#{AADTokenAndState}) will be rewritten to remove the '#' causing the token parsing to fail and login sequence to occur again.

4- Initialize ADAL with the AAD app coordinates at app config time. The minimum required config to initialize ADAL is:
```js
adalAuthenticationServiceProvider.init({
        // clientId is the identifier assigned to your app by Azure Active Directory.
        clientId: "e9a5a8b6-8af7-4719-9821-0deef255f68e"
    },
    $httpProvider   // pass http provider to inject request interceptor to attach tokens
);
```

5- Define which routes you want to secure via ADAL - by adding `requireADLogin: true` to their definition
```js
$routeProvider.
    when("/todoList", {
        controller: "todoListController",
        templateUrl: "/App/Views/todoList.html",
        requireADLogin: true
    });

```
Any service invocation code you might have will remain unchanged. ADAL's interceptor will automatically add tokens for every outgoing call.

Anonymous endpoints, introduced in version 1.0.10, is an array of values that will be ignored by the ADAL route/state change handlers. ADAL will not attach a token to outgoing requests that have these keywords or URI. Routes that *do not* specify the ```requireADLogin=true``` property are added to the ```anonymousEndpoints``` array automatically.

***Optional***

If you so choose, in addition (or substitution) to route level protection you can add explicit login/logout UX elements. Furthermore, you can access properties of the currently signed in user directly form JavaScript (via userInfo and userInfo.profile).
The userInfo.profile property provides access to the claims in the ID token received from AAD. The claims can be used by the application for validation, to identify the subject's directory tenant, and so on. The complete list of claims with a brief description of each value is here, [Claims in Azure AD Security Tokens](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-authentication-scenarios):
```html
<!DOCTYPE html>
<html>
<head>
    <title>Angular Adal Sample</title>
</head>
<body ng-app="adalDemo" ng-controller="homeController" ng-init="hmCtl.init()">
    <a href="#">Home</a>
    <a href="#/todoList">ToDo List</a>


    <!--These links are added to manage login/logout-->
    <div data-ng-model="userInfo">
        <span data-ng-hide="!userInfo.isAuthenticated">Welcome {{userInfo.userName}} </span>
        <button data-ng-hide="!userInfo.isAuthenticated" data-ng-click="logout()">Logout</button>
        <button data-ng-hide="userInfo.isAuthenticated" data-ng-click="login()">Login</button>

        <div>
            {{userInfo.loginError}}
        </div>
        <div>
            {{testMessage}}
        </div>
    </div>
    <div ng-view>
        Your view will appear here.
    </div>

    <script src="/Scripts/angular.min.js"></script>
    <script src="/Scripts/angular-route.min.js"></script>
    <script src="/Scripts/adal.js"></script>
    <script src="/Scripts/adal-angular.js"></script>
    <script src="App/Scripts/app.js"></script>
    <script src="App/Scripts/homeController.js"></script>
    <script src="App/Scripts/todoDetailController.js"></script>
    <script src="App/Scripts/todoListController.js"></script>
    <script src="App/Scripts/todoService.js"></script>
</body>
</html>
```
6- You have full control on how to trigger sign in, sign out and how to deal with errors:

```js
'use strict';
app.controller('homeController', ['$scope', '$location', 'adalAuthenticationService', function ($scope, $location, adalAuthenticationService) {
    // this is referencing adal module to do login

    //userInfo is defined at the $rootscope with adalAngular module
    $scope.testMessage = "";
    $scope.init = function () {
        $scope.testMessage = "";
    };

    $scope.logout = function () {
        adalAuthenticationService.logOut();
    };

    $scope.login = function () {
        adalAuthenticationService.login();
    };

    // optional
    $scope.$on("adal:loginSuccess", function () {
        $scope.testMessage = "loginSuccess";
    });

    // optional
    $scope.$on("adal:loginFailure", function () {
        $scope.testMessage = "loginFailure";
        $location.path("/login");
    });

    // optional
    $scope.$on("adal:notAuthorized", function (event, rejection, forResource) {
        $scope.testMessage = "It is not Authorized for resource:" + forResource;
    });

}]);
```

### Multi-Tenant

By default, you have multi-tenant support. ADAL will set tenant to 'common', if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the ```tenant``` property as shown below.

```js
window.config = {
    tenant: "52d4b072-9470-49fb-8721-bc3a1c9912a1", // Optional by default, it sends common
    clientId: 'g075edef-0efa-453b-997b-de1337c29185'
};
```
If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

### Cache Location
Default storage location is sessionStorage. You can specify localStorage in the config as well.

```js
window.config = {
    clientId: 'g075edef-0efa-453b-997b-de1337c29185',
    cacheLocation: 'localStorage' // optional cache location. Default is sessionStorage
};
```

### Logging

Log levels are mapped as:

    0: Error
    1: Warning
    2: Info
    3: Verbose

You can add the code below to app.js to turn on logging. Implement the `log` method depending on how you want to redirect logs.

    Logging = {
        level: 3,
        log: function (message) {
            console.log(message);
        }
    };

### Security
Tokens are accessible from JavaScript since ADAL.JS is using HTML5 storage. Default storage option is sessionStorage, which keeps the tokens per session. You should prompt users to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)


### CORS API usage and IE
ADAL will get access token using Iframe for the given CORS API endpoints in the config. The Iframe needs to access cookies for the same domain that you did the initial sign in. Since IE does not allow to access cookies in an IFrame for localhost, your URL needs to be a fully qualified domain i.e http://yoursite.azurewebsites.com. Chrome does not have this restriction.

To make CORS API call, you need to specify endpoints in the config for your CORS API as shown here.

```js
// endpoint to resource mapping(optional)
var endpoints = {
    "https://yourhost/api": "b6a68585-5287-45b2-ba82-383ba1f60932",
};
adalAuthenticationServiceProvider.init(
    {
        tenant: "52d4b072-9470-49fb-8721-bc3a1c9912a1", // Optional by default, it sends common
        clientId: "e9a5a8b6-8af7-4719-9821-0deef255f68e", // Required
        endpoints: endpoints  // If you need to send CORS API requests.
    },
    $httpProvider   // pass http provider to inject request interceptor to attach tokens
);
```

Your service will be as shown below to make the call from JS. In your API project, you need to enable CORS API requests to receive pre-flight requests. You can check this [sample](https://github.com/AzureADSamples/SinglePageApp-WebAPI-AngularJS-DotNet) for CORS API.

```js
'use strict';
app.factory('contactService', ['$http', function ($http) {
    var serviceFactory = {};

    var _getItems = function () {
        $http.defaults.useXDomain = true;
        delete $http.defaults.headers.common['X-Requested-With'];
        return $http.get('http://adaljscors.azurewebsites.net/api/contacts');
    };

    serviceFactory.getItems = _getItems;

    return serviceFactory;
}]);
```

You can read extended blogs about CORS API below.

Andrew's blog related to CORS and Office365 usage

http://www.andrewconnell.com/blog/adal-js-cors-with-o365-apis-files-sharepoint

Vittorio's blog

http://www.cloudidentity.com/blog/2015/02/19/introducing-adal-js-v1/
http://www.cloudidentity.com/blog/2014/10/28/adal-javascript-and-angularjs-deep-dive/

### Trusted Site settings in IE
If you put your site in the trusted site list, cookies are not accessible for iFrame requests. You need to remove protected mode for Internet zone or add the authority URL for the login to the trusted sites as well.

### Known issues on Edge
Certain issues have been reported when using ADAL.js with the Microsoft Edge version 40.15063.0.0. Please take a look at [this page](https://github.com/AzureAD/azure-activedirectory-library-for-js/wiki/Known-issues-on-Edge) for details and workarounds before filing a new issue experienced with Edge.

## Build and run tests

**Run tests**

    npm install
    bower install
    npm test

    // angular tests
    karma start

To use Karma as test runner, you need to install the karma command line.

    npm install -g karma
    npm install -g karma-cli

**Reference doc generation**

Install grunt and run the command

    grunt doc

## Contribution

We encourage and welcome contributions to the library. Please read the [contributing guide](./contributing.md) before starting.

## Versions
This is a GA released version. Current version - **1.0.18**  
Minimum recommended version - 1.0.18  
You can find the changes for each version in the [change log](https://github.com/AzureAD/azure-activedirectory-library-for-js/blob/master/changelog.txt).

## Samples and Documentation

[We provide a full suite of sample applications and documentation on GitHub](https://github.com/azure-samples?query=active-directory) to help you get started with learning the Azure Identity system. This includes tutorials for native clients such as Windows, Windows Phone, iOS, OSX, Android, and Linux; and a detailed guide to registering your app with Azure Active Directory. We also provide full walkthroughs for authentication flows such as OAuth2, OpenID Connect, Graph API, and other awesome features.

## Community Help and Support

We leverage [Stack Overflow](http://stackoverflow.com/) to work with the community on supporting Azure Active Directory and its SDKs, including this one! We highly recommend you ask your questions on Stack Overflow (we're all on there!) Also browser existing issues to see if someone has had your question before.

We recommend you use the "adal" tag so we can see it! Here is the latest Q&A on Stack Overflow for ADAL: [http://stackoverflow.com/questions/tagged/adal](http://stackoverflow.com/questions/tagged/adal)

## Submit Feedback
We'd like your thoughts on this library. Please complete [this short survey.](https://forms.office.com/r/cnmB9FbgX9)

## Security Reporting

If you find a security issue with our libraries or services [please report it to the Microsoft Security Response Center (MSRC)](https://aka.ms/report-security-issue) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://www.microsoft.com/msrc/technical-security-notifications) and subscribing to Security Advisory Alerts.

## License
Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the Apache License, Version 2.0 (the "License");

## We value and adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
