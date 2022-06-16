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
    var scope, $httpBackend, adalServiceProvider, rootScope, controller, q, window, route, location;

    //mock Application to allow us to inject our own dependencies
    beforeEach(angular.mock.module('TestApplication'));

    //mock the controller for the same reason and include $scope and $controller
    beforeEach(angular.mock.inject(function (_adalAuthenticationService_, _$rootScope_, _$controller_, _$httpBackend_, _$q_, _$window_, _$route_, _$location_) {
        adalServiceProvider = _adalAuthenticationService_;
        rootScope = _$rootScope_;
        controller = _$controller_;
        $httpBackend = _$httpBackend_;
        q = _$q_;
        window = _$window_;
        route = _$route_;
        location = _$location_;

        //create an empty scope
        scope = rootScope.$new();

        adalServiceProvider.getCachedToken = function (resource) {
            console.log('Requesting token for resource:' + resource);
            if (resource === 'resource1') {
                return 'Token3434';
            }

            if (resource === 'resource2') {
                return 'Token123';
            }

            if (resource === adalServiceProvider.config.loginResource) {
                return 'Token456';
            }

            return '';
        };

        adalServiceProvider.acquireToken = function (resource) {
            console.log('acquire token for resource:' + resource);
            var token = '';
            if (resource === 'resource1') {
                token = 'RenewToken3434';
            }

            if (resource === 'resource2') {
                token = 'RenewToken123';
            }

            if (resource === adalServiceProvider.config.loginResource) {
                token = 'RenewToken456';
            }
            return q.when(token);
        };

        window.parent.AuthenticationContext = window.AuthenticationContext;
        window.location.hash = '';

        // to prevent full page reload error in karma
        window.onbeforeunload = function () { return };
        controller('TaskCtl', { $scope: scope, adalAuthenticationService: adalServiceProvider });

        location.$$html5 = true;
        window.event = {
            preventDefault: function () {
                return;
            }
        };

    }));

    it('assigns user', function () {
        expect(scope.user.userName).toBe('');
        expect(scope.user.isAuthenticated).toBe(false);
    });

    it('send tokens for webapi call in endpoints list', function () {
        $httpBackend.expectGET('/api/Todo/5', function (headers) {
            return headers.Authorization === 'Bearer Token3434';
        }).respond(200, { id: 5, name: 'TODOItem1' });
        scope.taskCall();
        $httpBackend.flush();

        var task = scope.task;
        expect(task.name).toBe('TODOItem1');
    });

    it('send tokens for webapi call in endpoints list', function () {
        $httpBackend.expectGET('/anotherApi/Item/13', function (headers) {
            console.log('headers test' + headers.Authorization);
            return headers.Authorization === 'Bearer Token123';
        }).respond(200, { id: 5, itemName: 'ItemWithoutAuth' });
        scope.itemCall();
        $httpBackend.flush();

        var task = scope.item;
        expect(task.itemName).toBe('ItemWithoutAuth');
    });

    it('send tokens for webapi call in endpoints list', function () {
        $httpBackend.expectGET('https://testapi.com/', function (headers) {
            return headers.Authorization === 'Bearer Token3434';
        }).respond(200);
        scope.taskCall3();
        $httpBackend.flush();
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
            return headers.Authorization === 'Bearer Token456'
        }).respond(200);
        scope.taskCall4();
        $httpBackend.flush();
    });

    it('send tokens for app backend call', function () {
        $httpBackend.expectGET('https://myapp.com/someapi/item', function (headers) {
            return headers.Authorization === 'Bearer Token456'
        }).respond(200);
        scope.taskCall5();
        $httpBackend.flush();
    });

    it('renews tokens for app backend', function () {
        // This makes adal to try renewing the token since no token is returned from cache
        adalServiceProvider.getCachedToken = function () {
            return '';
        };
        $httpBackend.expectGET('https://myapp.com/someapi/item', function (headers) {
            return headers.Authorization === 'Bearer RenewToken456';
        }).respond(200, { id: 5, name: 'TODOItem2' });
        scope.taskCall5();
        $httpBackend.flush();

        var task = scope.task;
        expect(task.name).toBe('TODOItem2');
    });

    it('renews tokens for webapi in endpoint list', function () {
        adalServiceProvider.getCachedToken = function () {
            return '';
        };
        $httpBackend.expectGET('/anotherApi/Item/13', function (headers) {
            console.log('headers test' + headers.Authorization);
            return headers.Authorization === 'Bearer RenewToken123';
        }).respond(200, { id: 5, itemName: 'ItemWithoutAuth' });
        scope.itemCall();
        $httpBackend.flush();

        var task = scope.item;
        expect(task.itemName).toBe('ItemWithoutAuth');
    });

    it('renews tokens for webapi in endpoint list', function () {
        adalServiceProvider.getCachedToken = function () {
            return '';
        };
        $httpBackend.expectGET('https://testapi.com/', function (headers) {
            return headers.Authorization === 'Bearer RenewToken3434';
        }).respond(200);
        scope.taskCall3();
        $httpBackend.flush();
    });

    it('tests errorResponse broadcast when login is in progress', function () {
        adalServiceProvider.getCachedToken = function () {
            return '';
        };
        adalServiceProvider.loginInProgress = function () {
            return true;
        };
        spyOn(rootScope, '$broadcast').andCallThrough();
        $httpBackend.expectGET('https://myapp.com/someapi/item', function (headers) {
            return headers.Authorization === 'Bearer Token456'
        }).respond(200);

        var eventName = '', msg = '';
        scope.$on('adal:errorResponse', function (event, message) {
            eventName = event.name;
            msg = message;
        });
        scope.taskCall5();
        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('adal:errorResponse');
        expect(msg.data).toBe('login in progress, cancelling the request for https://myapp.com/someapi/item');

    });

    it('tests stateMismatch broadcast when state does not match', function () {
        console.log(adalServiceProvider);

        location.hash('#id_token=sample&state=4343');
        spyOn(rootScope, '$broadcast').andCallThrough();

        var eventName = '', msg = '';
        scope.$on('adal:stateMismatch', function (event, message) {
            eventName = event.name;
            msg = message;
        });

        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('adal:stateMismatch');
        expect(msg).toBe('Invalid_state. state: 4343');
    });

    it('tests callback is called when response contains error', function () {
        var error = '', errorDesc = '';
        var callback = function (valErrorDesc, valToken, valError) {
            error = valError;
            errorDesc = valErrorDesc;
        };
        var adalInstance = window.AuthenticationContext();
        adalInstance._renewStates = ['4343'];
        adalInstance._requestType = 'RENEW_TOKEN',
        adalInstance._callBackMappedToRenewStates =  { "4343": callback }
        location.hash('#error=sample&error_description=renewfailed&state=4343');
        scope.$apply();
        expect(error).toBe('sample');
        expect(errorDesc).toBe('renewfailed');
    });

    it('tests callback is called when response contains access token', function () {
        var error = null, errorDesc = null, token = '';
        var callback = function (valErrorDesc, valToken, valError) {
            error = valError;
            errorDesc = valErrorDesc;
            token = valToken;
        };
        var adalInstance = window.AuthenticationContext();
        adalInstance._renewStates = ['4343'];
        adalInstance._requestType = 'RENEW_TOKEN',
        adalInstance._callBackMappedToRenewStates = { "4343": callback }
        location.hash('#access_token=newAccessToken123&state=4343');
        scope.$apply();
        expect(error).toBeUndefined();
        expect(errorDesc).toBeUndefined();
        expect(token).toBe('newAccessToken123');
    });

    it('tests callback is called when response contains id token', function () {
        var error = '', errorDesc = '', token = '';
        var callback = function (valErrorDesc, valToken, valError) {
            error = valError;
            errorDesc = valErrorDesc;
            token = valToken;
        };
        var adalInstance = window.AuthenticationContext();
        adalInstance._renewStates = ['4343'];
        adalInstance._requestType = 'RENEW_TOKEN',
        adalInstance._callBackMappedToRenewStates = { "4343": callback }
        var createUser = adalInstance._createUser;
        adalInstance._createUser = function (idtoken) {
            return {
                profile: {}
            }
        }
        location.hash('#id_token=newIdToken123&state=4343');
        scope.$apply();
        expect(errorDesc).toBeUndefined();
        expect(error).toBeUndefined();
        expect(token).toBe('newIdToken123');
        adalInstance._createUser = createUser;
    });


    it('tests login failure after users logs in', function () {
        var mockInvalidClientIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnQxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJ1cG4iOiJqb2huQGVtYWlsLmNvbSJ9.zNX4vfLzlbFeKHZ9BMN3sYLtEEE-0o1RoL4NUhXz-l8';
        location.hash('#'+ 'id_token=' + mockInvalidClientIdToken + '&state=1234');
        window.sessionStorage.setItem('adal.state.login', '1234');
        spyOn(rootScope, '$broadcast').andCallThrough();
        var eventName = '', error = '', errorDesc = '', token = '';
        scope.$on('adal:loginFailure', function (event, valErrorDesc, valError) {
            eventName = event.name;
            errorDesc = valErrorDesc;
            error = valError;
        });
        window.parent = window;
        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('adal:loginFailure');
        expect(errorDesc).toBe('Invalid id_token. id_token: ' + mockInvalidClientIdToken);
        expect(error).toBe('invalid id_token');
        window.sessionStorage.setItem('adal.state.login', '');
    });

    it('tests login success after users logs in', function () {
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        location.hash('#' + 'id_token=' + mockIdToken + '&state=1234');
        window.sessionStorage.setItem('adal.nonce.idtoken', '1234');
        window.sessionStorage.setItem('adal.state.login', '1234');
        spyOn(rootScope, '$broadcast').andCallThrough();
        var eventName = '', token = '';
        scope.$on('adal:loginSuccess', function (event, valToken) {
            eventName = event.name;
            token = valToken;
        });
        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('adal:loginSuccess');
        expect(adalServiceProvider.userInfo.userName).toBe('john@email.com');
        expect(adalServiceProvider.userInfo.profile.upn).toBe('john@email.com');
        expect(adalServiceProvider.userInfo.profile.aud).toBe('clientid123');
        expect(token).toBe(mockIdToken);
        adalServiceProvider.logOut();
    });

    it('tests route change handler', function () {
        var homeRoute = route.routes['/home'];
        var aboutRoute = route.routes['/about'];

        location.url('/home');
        scope.$apply();
        expect(route.current.controller).toBe(homeRoute.controller);
        expect(route.current.template).toBe(homeRoute.template);

        $httpBackend.expectGET('about.html').respond(200);
        location.url('/about');
        scope.$apply();
        expect(route.current.controller).toBe(aboutRoute.controller);
        expect(route.current.templateUrl).toBe(aboutRoute.templateUrl);
        expect(adalServiceProvider.config.anonymousEndpoints).toContain(aboutRoute.templateUrl);
        $httpBackend.flush();
    });

    it('checks if Logging is defined', function () {
        Logging.level = 2;
        Logging.log = function (message) {
            window.logMessage = message;
        }
        adalServiceProvider.info("test message");
        expect(window.logMessage).toContain("test message");
        expect(Logging.level).toEqual(2);
    });
});

describe('StateCtrl', function () {
    var $httpBackend, adalServiceProvider, rootScope, $state, location, $templateCache, $stateParams;

    //mock Application to allow us to inject our own dependencies
    beforeEach(angular.mock.module('StateApplication'));

    //mock the controller for the same reason and include $scope and $controller
    beforeEach(angular.mock.inject(function (_adalAuthenticationService_, _$rootScope_, _$httpBackend_, _$state_, _$location_, _$templateCache_, _$stateParams_) {
        adalServiceProvider = _adalAuthenticationService_;
        rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $state = _$state_;
        location = _$location_;
        $templateCache = _$templateCache_;
        $stateParams = _$stateParams_;
        $httpBackend.expectGET('settings.html').respond(200);
        $httpBackend.expectGET('profile.html').respond(200);
        $httpBackend.expectGET('name.html').respond(200);
        $httpBackend.expectGET('account.html').respond(200);
        $templateCache.put('profile.html', '');
        $templateCache.put('settings.html', '');
        $templateCache.put('account.html', '');
        $templateCache.put('name.html', '');
        adalServiceProvider.config.anonymousEndpoints = [];
    }));

    it('checks if anonymous endpoints are populated on statechange event if states are nested and separated by .', function () {
        var state;
        rootScope.$on('$stateChangeSuccess', function (event, toState) {
            state = toState;
        });
        var urlNavigate = 'settings/profile/name';
        location.url(urlNavigate);
        rootScope.$digest();
        expect(state.name).toEqual('settings.profile.name');
        var states = urlNavigate.split('/');
        for (var i = 0; i < states.length; i++) {
            expect(adalServiceProvider.config.anonymousEndpoints[i]).toEqual(states[i] + '.html');
        }
    });

    it('checks if state is resolved when templateUrl is a function which depends on stateParams and states have parent property', function () {
        var state;
        rootScope.$on('$stateChangeSuccess', function (event, toState) {
            state = toState;
        });
        var urlNavigate = 'settings/account/Id/testId/name/Name/testName';
        location.url(urlNavigate);
        rootScope.$digest();
        expect($stateParams.accountId).toEqual('testId');
        expect($stateParams.accountName).toEqual('testName');
        expect(state.name).toEqual('settings.account.name');
        var states = state.name.split('.');
        for (var i = 0; i < states.length ; i++) {
            expect(adalServiceProvider.config.anonymousEndpoints[i]).toEqual(states[i] + '.html');
        }
    });
});

describe('AcquireTokenCtl', function () {
    var scope, adalServiceProvider, rootScope, controller, window, $httpBackend, route, location;
    var store = {};
    //mock Application to allow us to inject our own dependencies
    beforeEach(angular.mock.module('TestApplication'));

    //mock the controller for the same reason and include $scope and $controller
    beforeEach(angular.mock.inject(function (_adalAuthenticationService_, _$rootScope_, _$controller_, _$window_, _$httpBackend_, _$route_, _$location_) {
        adalServiceProvider = _adalAuthenticationService_;
        rootScope = _$rootScope_;
        controller = _$controller_;
        window = _$window_;
        $httpBackend = _$httpBackend_;
        route = _$route_;
        location = _$location_;
        //create an empty scope
        scope = rootScope.$new();

        spyOn(sessionStorage, 'getItem').andCallFake(function (key) {
            return store[key];
        });
        spyOn(sessionStorage, 'setItem').andCallFake(function (key, value) {
            store[key] = value;
        });
        spyOn(sessionStorage, 'removeItem').andCallFake(function (key) {
            delete store[key];
        });
        spyOn(window, 'Date').andCallFake(function () {
            return {
                getTime: function () {
                    return 1000;
                },
                toUTCString: function () {
                    return "";
                }
            };
        });
    }));

    afterEach(function () {
        store = {};
    });

    it('checks if acquireTokenSuccess/acquireTokenFailure events are broadcasted in case of acquireToken', function () {
        var error = '', errorDesc = '';
        var tokenOut = '';
        var token = 'token123';
        spyOn(rootScope, '$broadcast').andCallThrough();
        scope.$on('adal:acquireTokenFailure', function (event, valErrorDesc, valError) {
            errorDesc = valErrorDesc;
            error = valError;
        });
        adalServiceProvider.acquireToken(adalServiceProvider.config.loginResource);
        expect(errorDesc).toBe('User login is required');
        expect(error).toBe('login required');
        store = {
            'adal.token.keys': adalServiceProvider.config.loginResource + '|',
            'adal.access.token.keyloginResource123': token,
            'adal.expiration.keyloginResource123': 302
        };
        scope.$on('adal:acquireTokenSuccess', function (event, message) {
            tokenOut = message;
        });
        adalServiceProvider.acquireToken(adalServiceProvider.config.loginResource);
        expect(tokenOut).toBe(token);
    });


    it('checks if user is redirected to the custom Login Page when localLoginUrl is specified', function () {
        spyOn(rootScope, '$broadcast').andCallThrough();

        adalServiceProvider.config.localLoginUrl = '/login';
        $httpBackend.expectGET('login.html').respond(200);
        var loginRoute = route.routes['/login'];
        location.url('/todoList');
        scope.$apply();
        expect(route.current.controller).toBe(loginRoute.controller);
        expect(route.current.templateUrl).toBe(loginRoute.templateUrl);
        expect(adalServiceProvider.loginInProgress()).toBe(false);
        adalServiceProvider.config.localLoginUrl = null;
    });

    it('checks if loginRedirect event is fired when localLoginUrl is not specified', function () {
        spyOn(rootScope, '$broadcast').andCallThrough();

        adalServiceProvider.config.localLoginUrl = null;
        location.url('/todoList');
        var eventName = '';
        scope.$on('adal:loginRedirect', function (event) {
            eventName = event.name;
        });
        scope.$apply();
        expect(adalServiceProvider.loginInProgress()).toBe(true);
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('adal:loginRedirect');
    });

    it('tests auto id token renew when id token expires', function () {
        spyOn(rootScope, '$broadcast').andCallThrough();

        var loginResourceOldValue = adalServiceProvider.config.loginResource;
        adalServiceProvider.config.loginResource = null;
        window.location.hash = 'hash';
        var eventName = '', error = '', errorDesc = '', token = '';
        scope.$on('adal:loginFailure', function (event, valErrorDesc, valError) {
            eventName = event.name;
            errorDesc = valErrorDesc;
            error = valError;
        });

        store = {
            'adal.idtoken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOm51bGx9.DLCO6yIWhnNBYfHH8qFPswcH4M2Alpjn6AZy7K6HENY'
        }
        scope.$apply();

        adalServiceProvider.config.loginResource = loginResourceOldValue;
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('adal:loginFailure');
        expect(errorDesc).toBe('resource is required');
        expect(error).toBe('resource is required');
        adalServiceProvider.logOut();
    });
});
