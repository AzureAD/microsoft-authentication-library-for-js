//----------------------------------------------------------------------
// @preserve Copyright (c) Microsoft Open Technologies, Inc.
// All Rights Reserved
// Apache License 2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//----------------------------------------------------------------------

'use strict';
// Test app Ui-Router
var stateApp = angular.module("StateApplication", ['ui.router', 'AdalAngular'])
.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'adalAuthenticationServiceProvider', function ($stateProvider, $urlRouterProvider, $httpProvider, adalProvider) {
    $stateProvider
        .state('settings', {
            url: '/settings',
            templateUrl: 'settings.html'
        })
        .state('settings.profile', {
            url: '/profile',
            templateUrl: 'profile.html',
        })
       .state('settings.profile.name', {
           url: '/name',
           templateUrl: 'name.html',
       })
       .state('settings.profile.email', {
            url: '/email',
            templateUrl: 'email.html',
        })
       .state('settings.account', {
            parent: 'settings',
            url: '/account/Id/:accountId',
            templateUrl: function (stateParams) {
                if (stateParams.accountId == 'testId')
                    return 'account.html';
            },
        })
        .state('settings.account.name', {
            parent: 'settings.account',
            url: '/name/Name/:accountName',
            templateUrl: function (stateParams) {
                if (stateParams.accountName == 'testName')
                    return 'name.html';
            }
        })
        .state('settings.account.email', {
            url: '/email',
            templateUrl: 'email.html',
        });

    $urlRouterProvider.otherwise('/settings');
    var endpoints = {};

    adalProvider.init(
         {
             tenant: 'tenantid123',
             clientId: 'clientid123',
             loginResource: 'loginResource123',
             redirectUri: 'https://myapp.com/page',
             endpoints: endpoints  // optional
         },
         $httpProvider   // pass http provider to inject request interceptor to attach tokens
         );
}]);

app.controller('StateCtrl', ['$scope', '$location', 'adalAuthenticationService', function ($scope, $location, adalAuthenticationService) { }]);
