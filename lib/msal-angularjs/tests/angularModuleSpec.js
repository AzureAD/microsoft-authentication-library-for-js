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
    var scope, $httpBackend, msalServiceProvider, rootScope, controller, q, window, route, location, $httpProvider, deferred;

    //mock Application to allow us to inject our own dependencies
    beforeEach(angular.mock.module('TestApplication'));

    var isEqualScopes = function (scopes1, scopes2) {
        scopes1.length == scopes2.length && scopes1.every(function (v, i) { return v === scopes2[i] });
    }

    //mock the controller for the same reason and include $scope and $controller
    beforeEach(angular.mock.inject(function (_msalAuthenticationService_, _$rootScope_, _$controller_, _$httpBackend_, _$q_, _$window_, _$route_, _$location_, _$http_) {
        msalServiceProvider = _msalAuthenticationService_;
        rootScope = _$rootScope_;
        controller = _$controller_;
        $httpBackend = _$httpBackend_;
        q = _$q_;
        deferred = _$q_.defer();
        window = _$window_;
        route = _$route_;
        location = _$location_;
        $httpProvider = _$http_;

        //create an empty scope
        scope = rootScope.$new();

        msalServiceProvider._getCachedToken = function (scopes) {
            console.log('Requesting token for scopes:' + scopes);
            if (JSON.stringify(scopes) === JSON.stringify(applicationConfig.apiScopes)) {
                return {
                    token: 'Token123'
                };
            }
            if (JSON.stringify(scopes) === JSON.stringify(applicationConfig.anotherApiScopes)) {
                return {
                    token: 'Token456'
                };
            }
            if (scopes.length == 1 && scopes.indexOf('clientId123')!=-1) {// if clientID of app is passed as single scope
                return {
                    token: 'Token678'
                };
            }
            return null;
        };

        controller('TaskCtl', { $scope: scope, msalAuthenticationService: msalServiceProvider });

        window.parent = {};
        window.opener = {};
        window.openedWindows = [];
        window.sessionStorage.clear();

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

    it('tests errorResponse broadcast when login is in progress', function () {
        var _getCachedToken = msalServiceProvider._getCachedToken;
        msalServiceProvider._getCachedToken = function () {
            return '';
        };

        msalServiceProvider.loginInProgress = function () {
            return true;
        };

        spyOn(rootScope, '$broadcast').and.callThrough();
        $httpBackend.expectGET('https://myapp.com/someapi/item', function (headers) {
            return headers.Authorization === 'Bearer Token456'
        }).respond(200);

        var eventName = '', msg = '';
        scope.$on('msal:errorResponse', function (event, message) {
            eventName = event.name;
            msg = message;
        });

        scope.taskCall5();
        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('msal:errorResponse');
        expect(msg.data).toBe('login in progress, cancelling the request for https://myapp.com/someapi/item');
        msalServiceProvider._getCachedToken = _getCachedToken;

    });

    it('tests stateMismatch broadcast when state does not match', function () {
        window.parent = {
            callBackMappedToRenewStates: { "4344": null }
        };

        window.parent.msal = window.msal;
        location.hash('#id_token=sample&state=4343');
        spyOn(rootScope, '$broadcast').and.callThrough();

        var eventName = '', error = '', errorDesc = '';
        scope.$on('msal:stateMismatch', function (event,errorDesc, error) {
            eventName = event.name;
            errorDesc = errorDesc;
            error = error;
            expect(eventName).toBe('msal:stateMismatch');
            expect(error).toBe('Invalid_state');
            expect(errorDesc).toBe('Invalid_state. state: 4343');
        });

        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
    });

    it('tests callback is called when response contains error', function () {
        var error = '', errorDesc = '', tokenType;
        var callback = function (valErrorDesc, valToken, valError, valTokenType) {
            errorDesc = valErrorDesc;
            error = valError;
            tokenType = valTokenType;
        };

        window.parent = {
            callBackMappedToRenewStates: { "4343": callback }
        };

        window.renewStates = ['4343'];
        window.requestType = 'RENEW_TOKEN';
        window.parent.msal = window.msal;
        location.hash('#error=sample&error_description=renewfailed&state=4343');
        scope.$apply();
        expect(error).toBe('sample');
        expect(errorDesc).toBe('renewfailed');
    });

    it('tests callback is called when response contains access token', function () {
        var mockInvalidClientIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnQxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJ1cG4iOiJqb2huQGVtYWlsLmNvbSJ9.zNX4vfLzlbFeKHZ9BMN3sYLtEEE-0o1RoL4NUhXz-l8';
        window.sessionStorage.setItem("msal.idtoken", mockInvalidClientIdToken);
        var error = null, errorDesc = null, token = '';
        var callback = function (valErrorDesc, valToken, valError) {
            error = valError;
            errorDesc = valErrorDesc;
            token = valToken;
        };

        window.parent = {
            callBackMappedToRenewStates: { "4343": callback }
        };

        window.renewStates = ['4343'];
        window.requestType = 'RENEW_TOKEN';
        window.parent.msal = window.msal;
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

        window.parent = {
            callBackMappedToRenewStates: {}
        };

        window.sessionStorage.setItem('msal.state.login','4343')
        window.parent.msal = window.msal;
        window.parent.msal._tokenReceivedCallback = callback;
        location.hash('#id_token=newIdToken123&state=4343');
        scope.$apply();
        expect(errorDesc).toBe('Invalid idToken. idToken: newIdToken123');
        expect(error).toBe('invalid idToken');
        expect(token).toBe('newIdToken123');
    });

    it('tests if loginFailure event is broadcasted if an error occurs during login', function () {
        var mockInvalidClientIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnQxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJ1cG4iOiJqb2huQGVtYWlsLmNvbSJ9.zNX4vfLzlbFeKHZ9BMN3sYLtEEE-0o1RoL4NUhXz-l8';
        window.sessionStorage.setItem('msal.state.login', '1234');
        window.parent = {
            callBackMappedToRenewStates: {}
        };

        window.parent.msal = window.msal;
        var getUser = window.parent.msal.getUser();
        window.parent.msal.getUser = function () {
            return {
                userName: null
            };
        };

        location.hash('#' + 'id_token=' + mockInvalidClientIdToken + '&state=1234');
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', error = '', errorDesc = '', token = '';
        scope.$on('msal:loginFailure', function (event,  valErrorDesc, valError) {
            eventName = event.name;
            errorDesc = valErrorDesc;
            error = valError;
        });

        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('msal:loginFailure');
        expect(errorDesc).toBe('Invalid idToken. idToken: ' + mockInvalidClientIdToken);
        expect(error).toBe('invalid idToken');
        window.parent.msal.getUser = getUser;
    });

    it('tests if loginSuccess event is broadcasted after successful sign in', function () {
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        window.parent = {
            callBackMappedToRenewStates: {}
        };
        window.sessionStorage.setItem('msal.nonce.idtoken', '1234');
        window.sessionStorage.setItem('msal.state.login', '1234');
        var getCachedToken = window.msal.getCachedToken;
        window.msal.getCachedToken = function () {
            return null;
        };
        window.parent.msal = window.msal;
        location.hash('#' + 'id_token=' + mockIdToken + '&state=1234');
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', token = '';
        scope.$on('msal:loginSuccess', function (event, valToken) {
            eventName = event.name;
            token = valToken;
        });
        scope.$apply();
        expect(rootScope.$broadcast).toHaveBeenCalled();
        expect(eventName).toBe('msal:loginSuccess');
        expect(msalServiceProvider.userInfo.userName).toBe('John Doe');
        expect(msalServiceProvider.userInfo.idToken.upn).toBe('john@email.com');
        expect(msalServiceProvider.userInfo.idToken.aud).toBe('clientid123');
        expect(token).toBe(mockIdToken);
        window.msal.getCachedToken = getCachedToken;
    });

    it('tests if login success event is broadcasted after a successful sign in if popup mode is on', function () {
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        var error = '', errorDesc = '', token = '';
        var callback = function (valErrorDesc, valToken, valError) {
            error = valError;
            errorDesc = valErrorDesc;
            token = valToken;
        };
        window.sessionStorage.setItem('msal.nonce.idtoken', '1234');
        window.sessionStorage.setItem('msal.authority|1234', 'https://login.microsoftonline.com/common');
        window.callBackMappedToRenewStates = { "1234": callback };
        window.renewStates = ['1234'];
        window.requestType = 'LOGIN';
        window.opener = window;
        window.openedWindows = [window];
        location.hash('#' + 'id_token=' + mockIdToken + '&state=1234');
        scope.$apply();
        expect(errorDesc).toBeUndefined();
        expect(error).toBeUndefined();
        expect(token).toBe(mockIdToken);
    });

    it('tests acquireTokenPopup function for success case', function () {
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        var acquireTokenPopup = window.msal.acquireTokenPopup;
        window.msal.acquireTokenPopup = function () {
            var p = q.defer();
            p.resolve(mockIdToken);
            return p.promise;
        };

        msalServiceProvider.acquireTokenPopup();
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', token = '';
        scope.$on('msal:acquireTokenSuccess', function (event, valToken) {
            eventName = event.name;
            token = valToken;
        });
        scope.$apply();
        expect(eventName).toBe('msal:acquireTokenSuccess');
        expect(token).toBe(mockIdToken);
        window.msal.acquireTokenPopup = acquireTokenPopup;
    });

    it('tests acquireTokenPopup function for failure case', function () {
        var acquireTokenPopup = window.msal.acquireTokenPopup;
        window.msal.acquireTokenPopup = function () {
            var p = q.defer();
            p.reject('errorDesc|error');
            return p.promise;
        };

        msalServiceProvider.acquireTokenPopup();
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', error, errorDesc;
        scope.$on('msal:acquireTokenFailure', function (event, valErrorDesc, valError) {
            eventName = event.name;
            errorDesc = valErrorDesc;
            error = valError;
        });
        scope.$apply();
        expect(eventName).toBe('msal:acquireTokenFailure');
        expect(errorDesc).toBe('errorDesc');
        expect(error).toBe('error');
        window.msal.acquireTokenPopup = acquireTokenPopup;
    });

    it('tests loginPopup function for success case', function () {
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        var loginPopup = window.msal.loginPopup;
        window.msal.loginPopup = function () {
            var p = q.defer();
            p.resolve(mockIdToken);
            return p.promise;
        };

        msalServiceProvider.loginPopup();
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', token = '';
        scope.$on('msal:loginSuccess', function (event, valToken) {
            eventName = event.name;
            token = valToken;
        });
        scope.$apply();
        expect(eventName).toBe('msal:loginSuccess');
        expect(token).toBe(mockIdToken);
        window.msal.loginPopup = loginPopup;
    });

    it('tests loginPopup function for failure case', function () {
        var loginPopup = window.msal.loginPopup;
        window.msal.loginPopup = function () {
            var p = q.defer();
            p.reject('errorDesc|error');
            return p.promise;
        };

        msalServiceProvider.loginPopup();
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', error, errorDesc;
        scope.$on('msal:loginFailure', function (event, valErrorDesc, valError) {
            eventName = event.name;
            errorDesc = valErrorDesc;
            error = valError;
        });
        scope.$apply();
        expect(eventName).toBe('msal:loginFailure');
        expect(errorDesc).toBe('errorDesc');
        expect(error).toBe('error');
        window.msal.loginPopup = loginPopup;
    });

    it('tests acquireTokenSilent function for success case', function () {
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        var acquireTokenSilent = window.msal.acquireTokenSilent;
        window.msal.acquireTokenSilent = function () {
            var p = q.defer();
            p.resolve(mockIdToken);
            return p.promise;
        };

        msalServiceProvider.acquireTokenSilent();
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', token = '';
        scope.$on('msal:acquireTokenSuccess', function (event, valToken) {
            eventName = event.name;
            token = valToken;
        });
        scope.$apply();
        expect(eventName).toBe('msal:acquireTokenSuccess');
        expect(token).toBe(mockIdToken);
        window.msal.acquireTokenSilent = acquireTokenSilent;
    });

    it('tests acquireTokenSilent function for failure case', function () {
        var acquireTokenSilent = window.msal.acquireTokenSilent;
        window.msal.acquireTokenSilent = function () {
            var p = q.defer();
            p.reject('errorDesc|error');
            return p.promise;
        };

        msalServiceProvider.acquireTokenSilent();
        spyOn(rootScope, '$broadcast').and.callThrough();
        var eventName = '', error, errorDesc;
        scope.$on('msal:acquireTokenFailure', function (event, valErrorDesc, valError) {
            eventName = event.name;
            errorDesc = valErrorDesc;
            error = valError;
        });
        scope.$apply();
        expect(eventName).toBe('msal:acquireTokenFailure');
        expect(errorDesc).toBe('errorDesc');
        expect(error).toBe('error');
        window.msal.acquireTokenSilent = acquireTokenSilent;
    });
});




