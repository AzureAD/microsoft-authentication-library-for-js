Microsoft Authentication Library (MSAL) AngularJS wrapper for JavaScript
====================================
[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.svg?branch=master)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)

## Versions
Current version - 0.1.0  
Minimum recommended version - 0.1.0 
You can find the changes for each version in the [change log](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/master/changelog.md).

## Community Help and Support

We leverage [Stack Overflow](http://stackoverflow.com/) to work with the community on supporting Azure Active Directory and its SDKs, including this one! We highly recommend you ask your questions on Stack Overflow (we're all on there!) Also browser existing issues to see if someone has had your question before. 

We recommend you use the "msal" tag so we can see it! Here is the latest Q&A on Stack Overflow for MSAL: [http://stackoverflow.com/questions/tagged/msal](http://stackoverflow.com/questions/tagged/msal)

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## The Library

This is not a GA released version. The current version is **0.1.0**.

Available via NPM:

    npm install ms-msal-angularjs --save

### Getting Started - Quick usage guide
Below you can find a quick reference for the most common operations you need to perform to use MSAL ANGULARJS.

#### 1. npm install msal-angular

#### 2. Include a reference to the MSAL module in your app module.
````
var app =  angular.module('todoApp', ['ui.router', 'MsalAngular'])
````
#### 3. Initialize MSAL with the AAD app coordinates at app config time.
The minimum required object to initialize MSAL is:
````
window.applicationConfig = {
      clientID: 'f3e5cf63-6c0d-42cb-b5aa-ee58b1ef7523',
      graphEndpoint: "https://graph.microsoft.com/beta/me/photo/$value",
      graphScopes: ["user.read", "calendars.read"],
      apiEndpoint: "https://buildtodoservice.azurewebsites.net/api/todolist",
      apiScope: ['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user'],
      consentScopes: ["user.read", "calendars.read"],
};
    
app.config(['msalAuthenticationServiceProvider', function (msalProvider) {
	msalProvider.init({
		clientID: applicationConfig.clientID,
		tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
		}
	});
}]);
````

A single-tenant configuration, with CORS, looks like this:
You need to specify endpoint to resource mapping(optional)

````
var map = new Map();
map.set(applicationConfig.apiEndpoint, applicationConfig.apiScope);
map.set(applicationConfig.graphEndpoint, applicationConfig.graphScopes);
    
app.config(['msalAuthenticationServiceProvider', '$httpProvider', function (msalProvider) {
   msalProvider.init(
		{
        clientID: applicationConfig.clientID,
        tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
    
        },
        configOptions: {
           endPoints: map
        },
    }, $httpProvider);
}]);	
````

#### 4. When HTML5 mode is not configured, ensure the $locationProvider hashPrefix is set to an empty string
````
app.config(['$locationProvider', function($locationProvider) {
		$locationProvider.html5Mode(false).hashPrefix('');
}]);
````

Without the above setting, AAD login will loop indefinitely as the callback URL from AAD (in the form of, {yourBaseUrl}/#{AADTokenAndState}) will be rewritten to remove the '#' causing the token parsing to fail and login sequence to occur again.

#### 5. Define which routes you want to secure via MSAL - by adding `requireLogin: true` to their definition
````
$stateProvider.state("TodoList", {
    url: '/TodoList',
    controller: "todoListCtrl",
    templateUrl: "/App/Views/TodoList.html",
    requireLogin: true
});
````

#### 6. configOptions This is an optional object you can pass to alter the following properties in Msal.

<b> redirectUri </b>: The redirect URI of your app, where authentication responses can be sent and received by your app. It must exactly match one of the redirect URIs you registered in the portal, except that it must be URL encoded.
	Defaults to 'window.location.href'.
	
<b>authority</b> : A URL indicating a directory that MSAL can use to obtain tokens.
		* - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;, where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
		* - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
		* - Default value is: "https://login.microsoftonline.com/common"
   
<b>validateAuthority</b> : Validate the issuer of tokens. Default is true.

<b>cacheLocation</b> : Sets browser storage to either 'localStorage' or sessionStorage'. Default is 'sessionStorage'.

<b>postlogoutRedirectUri</b>: Redirects the user to postLogoutRedirectUri after logout. Default is 'redirectUri'.

<b>authority</b> : The number of milliseconds of inactivity before a token renewal response from AAD should be considered timed out. Default is 6 seconds.

<b>navigateToLoginRequestUrl</b> : Ability to turn off default navigation to start page after login. Default is false.

<b>anonymousEndpoints</b> :  is an array of values that will be ignored by the MSAL route/state change handlers. MSAL will not attach a token to outgoing requests that have these keywords or URI. Routes that *do not* specify the ```requireADLogin=true``` property are added to the ```anonymousEndpoints``` array automatically.

<b>endpoints</b> : Mapping of endpoints to scopes {"https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]}. Used internally by  MSAL for automatically attaching tokens in webApi calls. 
	This is required only for CORS calls. Please refer to CORS API usage below.

<b>logger</b>: Logging is not enabled by default. To enable logging, you need to pass an instance of logger to configOptions. Please see the logger class definition and the code snippet to enable logging below.
	
````
constructor(localCallback: ILoggerCallback,
    options:
    {
        correlationId?: string,
        level?: LogLevel,
        piiLoggingEnabled?: boolean,
    } = {}) {
    const {
        correlationId = "",
        level = LogLevel.Info,
        piiLoggingEnabled = false
    } = options;
}

var logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose, correlationId: '12345', piiLoggingEnabled: true });
function loggerCallback(logLevel, message, piiEnabled) {
		console.log(message);// You can log the messages to the console or save it in some file as per your need
}

app.config(['msalAuthenticationServiceProvider','$httpProvider', function (msalProvider) {
   msalProvider.init({
        clientID: applicationConfig.clientID,
        authority: null,
        tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
        },
        optionalParams: {
            logger: logger,
        },
    }, $httpProvider);
}]);
````
***Optional***
#### 7. Config Object for Routes: routeProtectionConfig
This is an optional object you can pass to the wrapper. It has the following properties:

<b>consentScopes</b>: It takes an array of scopes. Allows the client to express the desired scopes that should be consented at the time of login. Scopes can be from multiple resources/endpoints. Passing scope here will only consent it and no access token will be acquired till the time the client actually calls the API. By asking for consent at the time of login, subsequest acquireToken calls to the same resources will succeed in a hidden iframe without the need to show explicit UI.
	
<b>popUp</b> : The default login triggered by route protection use the redirect flow. You can change it to popUp by setting this property to true. Default is false.

<b>requireLogin</b> : When set, this property will make the entire set of routes/states protected. It eliminates the need to specify requireLogin in every route.

````js
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
````

***Optional***
#### 8. Use userInfo object to alter SignIn/SignOut UX elements.
If you so choose, in addition (or substitution) to route level protection you can add explicit login/logout UX elements. Furthermore, you can access properties of the currently signed in user directly form JavaScript.
The userInfo.idToken property provides access to the claims in the ID token received from AAD. The claims can be used by the application for validation, to identify the subject's directory tenant, and so on. The complete list of claims with a brief description of each value is here, [Claims in Azure AD Security Tokens](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-authentication-scenarios):
(```var _oauthData = { isAuthenticated: false, userName: '', loginError: '', idToken: {} }```)
````html
<!DOCTYPE html>
<html>
<head>
    <title>Angular Msal Sample</title>
</head>
<body ng-app="todoApp" ng-controller="homeCtrl" role="document">
    <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed"
                        data-toggle="collapse"
                        data-target=".navbar-collapse">
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
            </div>
            <div class="navbar-collapse collapse">
                <ul class="nav navbar-nav">
                    <li ng-class="{ active: isActive('/Home') }"><a ui-sref="Home">Home</a></li>
                    <li ng-class="{ active: isActive('/TodoList') }"><a ui-sref="TodoList">To Do List</a></li>
                    <li ng-class="{ active: isActive('/Calendar') }"><a ui-sref="Calendar">Calendar</a></li>
                </ul>
                <ul class="nav navbar-nav navbar-right">
                    <li><a class="btn btn-link" ng-show="userInfo.isAuthenticated" ng-click="logout()">Logout</a></li>
                    <li><a class="btn btn-link" ng-hide="userInfo.isAuthenticated" ng-click="login()">Login</a></li>
                </ul>
            </div>
        </div>
    </div>
    <br />
    <div class="container" role="main">
        <div class="row">
            <div class="col-xs-10 col-xs-offset-1">
                <div class="page-header">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-10 col-xs-offset-1">
                <div ui-view class="panel-body">
                </div>
            </div>
        </div>
    </div>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="bundle.js"></script>
    <script src="//unpkg.com/@uirouter/angularjs@1.0.7/release/angular-ui-router.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
    <script src="App/Scripts/homeCtrl.js"></script>
    <script src="App/Scripts/calendarCtrl.js"></script>
    <script src="App/Scripts/todoListCtrl.js"></script>
    <script src="App/Scripts/todoListSvc.js"></script>
</body>
</html>
````

#### 9. Set-up SignIn/SignOut in Controllers and register for events:

````js
'use strict';
app.controller('homeCtrl', ['$scope', 'msalAuthenticationService', '$location', '$log', '$http', '$rootScope', function ($scope, msalService, $location, $log, $http, $rootScope) {
    // this is referencing msal module to do login

    //userInfo object is defined at the $rootscope with MsalAngular module with the following properties { isAuthenticated: false, userName: '', loginError: '', idToken: {} }
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

    // optional
    $scope.$on("msal:loginSuccess", function () {
        $scope.testMessage = "loginSuccess";
    });

    // optional
    $scope.$on("msal:loginFailure", function () {
        $scope.testMessage = "loginFailure";
    });

    // optional
    $scope.$on("msal:notAuthorized", function (event, rejection, forResource) {
        $scope.testMessage = "It is not Authorized for resource:" + forResource;
    });

}]);
````
#### CORS API usage and IE
MSAL will get access token for given CORS API endpoints in the config. Access token is requested using Iframe. Iframe needs to access the cookies for the same domain that you did the initial sign in. IE does not allow to access cookies in IFrame for localhost. Your url needs to be fully qualified domain i.e http://yoursite.azurewebsites.com. Chrome does not have this restriction.
To make CORS API call, you need to specify endpoints in the config for your CORS API. Your service will be similar to this to make the call from JS. In your API project, you need to enable CORS API requests to receive flight requests. You can check the sample for CORS API [sample](https://github.com/AzureADSamples/SinglePageApp-WebAPI-AngularJS-DotNet).
```js
'use strict';
app.factory('contactService', ['$http', function ($http) {
	var serviceFactory = {};
	var _getItems = function () {
    $http.defaults.useXDomain = true;
    delete $http.defaults.headers.common['X-Requested-With'];
    return $http.get('https://buildtodoservice.azurewebsites.net/api/todolist');
	};
	
	serviceFactory.getItems = _getItems;
	return serviceFactory;
}]);
````
#### Multi-Tenant

By default, you have multi-tenant support. MSAL will set tenant to 'common', if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the ```authority``` property as shown above.

If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

#### Security
Tokens are accessible from javascript since MSAL JS is using HTML5 storage. Default storage option is sessionStorage, which keeps the tokens per session. You should ask user to login again for important operations on your app.
You should protect your site for XSS. Please check the article here: [https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)

#### Trusted Site settings in IE
If you put your site in the trusted site list, cookies are not accessible for iFrame requests. You need to remove protected mode for Internet zone or add the authority url for the login to the trusted sites as well.

#### We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.