//----------------------------------------------------------------------
// Copyright (c) Microsoft Open Technologies, Inc.
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
'use strict'
/* Directive tells jshint that it, describe are globals defined by jasmine */
/* global it */
/* global describe */

'use strict';

describe('TaskCtl', function () {
    var scope, $httpBackend, msalServiceProvider, rootScope, controller, q, window, route, location, $httpProvider;

    //mock Application to allow us to inject our own dependencies
    beforeEach(angular.mock.module('TestApplication'));

    var isEqualScopes = function (scopes1, scopes2) {
        scopes1.length == scopes2.length && scopes1.every(function (v, i) { return v === scopes2[i] });
    }

    //mock the controller for the same reason and include $scope and $controller
    beforeEach(angular.mock.inject(function (_msalAuthenticationService_, _$rootScope_, _$controller_, _$httpBackend_, _$q_, _$window_, _$route_, _$location_,_$http_) {
        msalServiceProvider = _msalAuthenticationService_;
        rootScope = _$rootScope_;
        controller = _$controller_;
        $httpBackend = _$httpBackend_;
        q = _$q_;
        window = _$window_;
        route = _$route_;
        location = _$location_;
        $httpProvider = _$http_;

        //create an empty scope
        scope = rootScope.$new();

        msalServiceProvider.getCachedToken = function (scopes) {
            console.log('Requesting token for scopes:' + scopes);
            if (JSON.stringify(scopes) === JSON.stringify(applicationConfig.apiScopes)) {
                return {
                    token :'Token123'
                    };
            }
            if (JSON.stringify(scopes) === JSON.stringify(applicationConfig.anotherApiScopes)) {
                return {
                    token: 'Token456'
                };
            }
            if (scopes.length == 1 && scopes.indexOf(msalServiceProvider.config.clientId)) {
                return {
                    token: 'Token678'
                };
            }
            return null;
        };

        msalServiceProvider.acquireTokenSilent = function (scopes) {
            console.log('Requesting token for scopes:' + scopes);
            if (JSON.stringify(scopes) === JSON.stringify(applicationConfig.apiScopes)) {
                return {
                    token: 'RenewToken123'
                };
            }
            if (JSON.stringify(scopes) === JSON.stringify(applicationConfig.anotherApiScopes)) {
                return {
                    token: 'RenewToken456'
                };
            }
            if (scopes.length == 1 && scopes.indexOf(msalServiceProvider.config.clientId)) {
                return {
                    token: 'RenewToken678'
                };
            }
            return null;
        };

        controller('TaskCtl', { $scope: scope, msalAuthenticationService: msalServiceProvider });

    }));

    it('checks userInfo Object', function () {
        console.log(scope.userInfo);
        expect(scope.userInfo.isAuthenticated).toBe(false);
        expect(scope.userInfo.userName).toBe('');
        expect(scope.userInfo.loginError).toBe('');
        expect(scope.userInfo.idToken).toEqual({});

    });

    it('send tokens for webapi call in endpoints list', function () {
        $httpBackend.expectGET('/api/Todo/5', function (headers) {
            return headers.Authorization === 'Bearer Token123';
        }).respond(200, { id: 5, name: 'TODOItem1' });
        scope.taskCall();
        $httpBackend.flush();
        var task = scope.task;
        expect(task.name).toBe('TODOItem1');
    });

    it('send tokens for webapi call in endpoints list', function () {
        $httpBackend.expectGET('/anotherApi/Item/13', function (headers) {
            console.log('headers test' + headers.Authorization);
            return headers.Authorization === 'Bearer Token456';
        }).respond(200, { id: 5, itemName: 'ItemWithoutAuth' });
        scope.itemCall();
        $httpBackend.flush();

        var task = scope.item;
        expect(task.itemName).toBe('ItemWithoutAuth');
    });

    it('does not send tokens for webapi(https) call not in endpoints list', function () {
        $httpBackend.expectGET('https://test.com/', function (headers) {
            return headers.hasOwnProperty('Authorization') === false;
        }).respond(200);
        scope.taskCall2();
        $httpBackend.flush();
    });

    it('does not send tokens for webapi(http) call not in endpoint list', function () {
        $httpBackend.expectGET('http://testwebapi.com/', function (headers) {
            return headers.hasOwnProperty('Authorization') === false;
        }).respond(200);
        scope.taskCall6();
        $httpBackend.flush();
    });

    it('send tokens for app backend call not in endpoints list', function () {
        $httpBackend.expectGET('/someapi/item', function (headers) {
            return headers.Authorization === 'Bearer Token678'
        }).respond(200);
        scope.taskCall4();
        $httpBackend.flush();
    });

});
