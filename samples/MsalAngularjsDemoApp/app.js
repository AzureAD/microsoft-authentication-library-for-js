var Msal = require('msal');
var angular = require('angular');
var MsalAngular = require('@azure/msal-angularjs');

window.applicationConfig = {
    clientID: '883bb2bc-6548-4906-b842-17014a0601a1',
    consentScopes: ["user.read"],
    webApiEndpoint: "https://buildtodoservice.azurewebsites.net/api/todolist",
    webApiScopes: ['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user'],
    userProfileEndpoint: "https://graph.microsoft.com/v1.0/me",
    userProfileScopes: ["user.read"],
};

var protectedResourceMap = new Map();
protectedResourceMap.set(applicationConfig.webApiEndpoint, applicationConfig.webApiScopes);
protectedResourceMap.set(applicationConfig.userProfileEndpoint, applicationConfig.userProfileScopes);


var logger = new Msal.Logger(loggerCallback, {level: Msal.LogLevel.Verbose, correlationId: '12345'});

function loggerCallback(logLevel, message, piiEnabled) {
    console.log(message);
}

if (window !== window.parent && !window.opener) {
    angular.module('todoApp', ['ui.router', 'MsalAngular'])
        .config(['$httpProvider', 'msalAuthenticationServiceProvider','$locationProvider', function ($httpProvider, msalProvider,$locationProvider) {
            msalProvider.init({
                clientID: applicationConfig.clientID,
                authority: 'https://login.microsoftonline.com/common',
                tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
                },
                optionalParams: {
                    cacheLocation: 'localStorage',
                    logger: logger,
                    protectedResourceMap: protectedResourceMap,
                    unprotectedResources: [],
                    storeAuthStateInCookie: true
                },
                routeProtectionConfig: {
                    consentScopes: applicationConfig.consentScopes,
                    popUp: true
                }
            }, $httpProvider);

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
            }).state("Calendar", {
                url: '/Calendar',
                controller: "calendarCtrl",
                templateUrl: "/App/Views/Calendar.html",
                requireLogin: true
            }).state("UserProfile", {
                url: '/UserProfile',
                controller: "userProfileCtrl",
                templateUrl: "/App/Views/UserProfile.html",
                requireLogin: true
            })

            $locationProvider.html5Mode(false).hashPrefix('');

            msalProvider.init({
                clientID: applicationConfig.clientID,
                authority: 'https://login.microsoftonline.com/common',
                tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
                    if (token) {
                        console.log("token received: in callback " + token)
                    } else if (error) {
                        console.log("error received: in callback " + error)
                    }
                },
                optionalParams: {
                    cacheLocation: 'localStorage',
                    logger: logger,
                    validateAuthority: true,
                    redirectUri: 'http://localhost:44302/' ,
                    postLogoutRedirectUri: 'http://localhost:44302/',
                    navigateToLoginRequestUrl: true,
                    unprotectedResources : [],
                    protectedResourceMap: protectedResourceMap,
                    storeAuthStateInCookie: true
                },
                routeProtectionConfig: {
                    popUp: true,
                    consentScopes: applicationConfig.consentScopes,
                }
            }, $httpProvider);
        }]);
}


