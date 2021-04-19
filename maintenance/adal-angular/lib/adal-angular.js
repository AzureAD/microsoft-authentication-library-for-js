//----------------------------------------------------------------------
// AdalJS v1.0.18
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

(function () {
    // ============= Angular modules- Start =============
    'use strict';

    if (typeof module !== 'undefined' && module.exports) {
        module.exports.inject = function (conf) {
            return new AuthenticationContext(conf);
        };
    }

    if (angular) {

        var AdalModule = angular.module('AdalAngular', []);

        AdalModule.provider('adalAuthenticationService', function () {
            var _adal = null;
            var _oauthData = { isAuthenticated: false, userName: '', loginError: '', profile: '' };

            var updateDataFromCache = function (resource) {
                // only cache lookup here to not interrupt with events
                var token = _adal.getCachedToken(resource);
                _oauthData.isAuthenticated = token !== null && token.length > 0;
                var user = _adal.getCachedUser() || { userName: '' };
                _oauthData.userName = user.userName;
                _oauthData.profile = user.profile;
                _oauthData.loginError = _adal.getLoginError();
            };

            this.init = function (configOptions, httpProvider) {
                if (configOptions) {
                    configOptions.isAngular = true;

                    if (httpProvider && httpProvider.interceptors) {
                        httpProvider.interceptors.push('ProtectedResourceInterceptor');
                    }

                    // create instance with given config
                    _adal = new AuthenticationContext(configOptions);
                } else {
                    throw new Error('You must set configOptions, when calling init');
                }

                // loginResource is used to set authenticated status
                updateDataFromCache(_adal.config.loginResource);
            };

            // special function that exposes methods in Angular controller
            // $rootScope, $window, $q, $location, $timeout are injected by Angular
            this.$get = ['$rootScope', '$window', '$q', '$location', '$timeout', '$injector', function ($rootScope, $window, $q, $location, $timeout, $injector) {

                var locationChangeHandler = function (event, newUrl, oldUrl) {
                    _adal.verbose('Location change event from ' + oldUrl + ' to ' + newUrl);
                    if ($location.$$html5) {
                        var hash = $location.hash();
                    }
                    else {
                        var hash = '#' + $location.path();
                    }
                    processHash(hash, event);

                    $timeout(function () {
                        updateDataFromCache(_adal.config.loginResource);
                        $rootScope.userInfo = _oauthData;
                    }, 1);
                };

                var processHash = function (hash, event) {

                    if (_adal.isCallback(hash)) {
                        var isPopup = false;

                        if (_adal._openedWindows.length > 0 && _adal._openedWindows[_adal._openedWindows.length - 1].opener
                   && _adal._openedWindows[_adal._openedWindows.length - 1].opener._adalInstance) {
                            _adal = _adal._openedWindows[_adal._openedWindows.length - 1].opener._adalInstance;
                            isPopup = true;
                        }
                        else if ($window.parent && $window.parent._adalInstance) {
                            _adal = $window.parent._adalInstance;
                        }

                        // callback can come from login or iframe request
                        _adal.verbose('Processing the hash: ' + hash);
                        var requestInfo = _adal.getRequestInfo(hash);
                        _adal.saveTokenFromHash(requestInfo);
                        // Return to callback if it is sent from iframe
                        var token = requestInfo.parameters['access_token'] || requestInfo.parameters['id_token'];
                        var error = requestInfo.parameters['error'];
                        var errorDescription = requestInfo.parameters['error_description'];
                        var tokenType = null;
                        var callback = _adal._callBackMappedToRenewStates[requestInfo.stateResponse] || _adal.callback;

                        if (requestInfo.stateMatch) {
                            if (requestInfo.requestType === _adal.REQUEST_TYPE.RENEW_TOKEN) {
                                tokenType = _adal.CONSTANTS.ACCESS_TOKEN;
                                _adal._renewActive = false;

                                // Call within the same context without full page redirect keeps the callback
                                // id_token or access_token can be renewed
                                if ($window.parent === $window && !_adal._callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                    if (token) {
                                        $rootScope.$broadcast('adal:acquireTokenSuccess', token);
                                    }
                                    else if (error && errorDescription) {
                                        $rootScope.$broadcast('adal:acquireTokenFailure', errorDescription, error);
                                    }
                                }

                            } else if (requestInfo.requestType === _adal.REQUEST_TYPE.LOGIN) {
                                tokenType = _adal.CONSTANTS.ID_TOKEN;
                                updateDataFromCache(_adal.config.loginResource);

                                if (_oauthData.userName) {
                                    $timeout(function () {
                                        // id_token is added as token for the app
                                        updateDataFromCache(_adal.config.loginResource);
                                        $rootScope.userInfo = _oauthData;
                                    }, 1);

                                    $rootScope.$broadcast('adal:loginSuccess', token);
                                } else {
                                    $rootScope.$broadcast('adal:loginFailure', errorDescription, error);
                                }

                            }

                            if (callback && typeof callback === 'function') {
                                callback(errorDescription, token, error, tokenType);
                            }

                            // since this is a token renewal request in iFrame, we don't need to proceed with the location change.
                            if (window.parent !== window) {//in iframe
                                if (event && event.preventDefault) {
                                    event.preventDefault();
                                }
                                return;
                            }

                            // redirect to login start page
                            if ($window.parent === window && !isPopup) {
                                if (_adal.config.navigateToLoginRequestUrl) {
                                    var loginStartPage = _adal._getItem(_adal.CONSTANTS.STORAGE.LOGIN_REQUEST);
                                    if (typeof loginStartPage !== 'undefined' && loginStartPage && loginStartPage.length !== 0) {
                                        // prevent the current location change and redirect the user back to the login start page
                                        _adal.verbose('Redirecting to start page: ' + loginStartPage);
                                        if (!$location.$$html5 && loginStartPage.indexOf('#') > -1) {
                                            $location.url(loginStartPage.substring(loginStartPage.indexOf('#') + 1));
                                        }

                                        $window.location.href = loginStartPage;
                                    }
                                }
                                else {
                                    // resetting the hash to null
                                    if ($location.$$html5) {
                                        $location.hash('');
                                    }
                                    else {
                                        $location.path('');
                                    }
                                }
                            }
                        }
                        else {
                            // state did not match, broadcast an error
                            $rootScope.$broadcast('adal:stateMismatch', errorDescription, error);
                        }
                    } else {
                        // No callback. App resumes after closing or moving to new page.
                        // Check token and username
                        updateDataFromCache(_adal.config.loginResource);
                        if (!_oauthData.isAuthenticated && _oauthData.userName && !_adal._renewActive) {
                            // id_token is expired or not present
                            var self = $injector.get('adalAuthenticationService');
                            self.acquireToken(_adal.config.loginResource).then(function (token) {
                                if (token) {
                                    _oauthData.isAuthenticated = true;
                                }
                            }, function (error) {
                                var errorParts = error.split('|');
                                $rootScope.$broadcast('adal:loginFailure', errorParts[0], errorParts[1]);
                            });
                        }
                    }

                };

                var loginHandler = function (loginStartPage) {
                    if (loginStartPage) {
                        _adal._saveItem(_adal.CONSTANTS.STORAGE.ANGULAR_LOGIN_REQUEST, loginStartPage);
                    }

                    if (_adal.config && _adal.config.localLoginUrl) {
                        _adal.info('Login event for:' + _adal.config.localLoginUrl);
                        $location.path(_adal.config.localLoginUrl);
                    }
                    else {
                        // directly start login flow
                        _adal.info('Start login at:' + $window.location.href);
                        $rootScope.$broadcast('adal:loginRedirect');
                        _adal.login();
                    }
                };

                function isADLoginRequired(route, global) {
                    return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
                }

                function isAnonymousEndpoint(url) {
                    if (_adal.config && _adal.config.anonymousEndpoints) {
                        for (var i = 0; i < _adal.config.anonymousEndpoints.length; i++) {
                            if (url.indexOf(_adal.config.anonymousEndpoints[i]) > -1) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function getStates(toState) {
                    var state = null;
                    var states = [];
                    if (toState.hasOwnProperty('parent')) {
                        state = toState;
                        while (state) {
                            states.unshift(state);
                            state = $injector.get('$state').get(state.parent);
                        }
                    }
                    else {
                        var stateNames = toState.name.split('.');
                        for (var i = 0, stateName = stateNames[0]; i < stateNames.length; i++) {
                            state = $injector.get('$state').get(stateName);
                            if (state) {
                                states.push(state);
                            }
                            stateName += '.' + stateNames[i + 1];
                        }
                    }
                    return states;
                }

                var routeChangeHandler = function (e, nextRoute) {
                    if (nextRoute && nextRoute.$$route) {
                        if (isADLoginRequired(nextRoute.$$route, _adal.config)) {
                            if (!_oauthData.isAuthenticated) {
                                if (!_adal._renewActive && !_adal.loginInProgress()) {
                                    _adal.info('Route change event for:' + $location.$$url);
                                    loginHandler();
                                }
                            }
                        }
                        else {
                            var nextRouteUrl;
                            if (typeof nextRoute.$$route.templateUrl === "function") {
                                nextRouteUrl = nextRoute.$$route.templateUrl(nextRoute.params);
                            } else {
                                nextRouteUrl = nextRoute.$$route.templateUrl;
                            }
                            if (nextRouteUrl && !isAnonymousEndpoint(nextRouteUrl)) {
                                _adal.config.anonymousEndpoints.push(nextRouteUrl);
                            }
                        }
                    }
                };

                var stateChangeHandler = function (e, toState, toParams, fromState, fromParams) {
                    if (toState) {
                        var states = getStates(toState);
                        var state = null;
                        for (var i = 0; i < states.length; i++) {
                            state = states[i];
                            if (isADLoginRequired(state, _adal.config)) {
                                if (!_oauthData.isAuthenticated) {
                                    if (!_adal._renewActive && !_adal.loginInProgress()) {
                                        _adal.info('State change event for:' + $location.$$url);
                                        var $state = $injector.get('$state');
                                        var loginStartPage = $state.href(toState, toParams, { absolute: true })
                                        loginHandler(loginStartPage);
                                    }
                                }
                            }
                            else if (state.templateUrl) {
                                var nextStateUrl;
                                if (typeof state.templateUrl === 'function') {
                                    nextStateUrl = state.templateUrl(toParams);
                                }
                                else {
                                    nextStateUrl = state.templateUrl;
                                }
                                if (nextStateUrl && !isAnonymousEndpoint(nextStateUrl)) {
                                    _adal.config.anonymousEndpoints.push(nextStateUrl);
                                }
                            }
                        }
                    }
                };

                var stateChangeErrorHandler = function (event, toState, toParams, fromState, fromParams, error) {
                    _adal.verbose("State change error occured. Error: " + typeof (error) === 'string' ? error : JSON.stringify(error));
                    // adal interceptor sets the error on config.data property. If it is set, it means state change is rejected by adal,
                    // in which case set the defaultPrevented to true to avoid url update as that sometimesleads to infinte loop.
                    if (error && error.data) {
                        _adal.info("Setting defaultPrevented to true if state change error occured because adal rejected a request. Error: " + error.data);
                        if (event)
                            event.preventDefault();
                    }
                };

                if ($injector.has('$transitions')) {
                    var $transitions = $injector.get('$transitions');

                    function onStartStateChangeHandler(transition) {
                        stateChangeHandler(null, transition.to(), transition.params('to'), transition.from(), transition.params('from'));
                    }

                    function onErrorStateChangeHandler(transition) {
                        stateChangeErrorHandler(null, transition.to(), transition.params('to'), transition.from(), transition.params('from'), transition.error());
                    }

                    $transitions.onStart({}, onStartStateChangeHandler);
                    $transitions.onError({}, onErrorStateChangeHandler);
                }

                // Route change event tracking to receive fragment and also auto renew tokens
                $rootScope.$on('$routeChangeStart', routeChangeHandler);

                $rootScope.$on('$stateChangeStart', stateChangeHandler);

                $rootScope.$on('$locationChangeStart', locationChangeHandler);

                $rootScope.$on('$stateChangeError', stateChangeErrorHandler);

                //Event to track hash change of 
                $window.addEventListener('adal:popUpHashChanged', function (e) {
                    processHash(e.detail);
                });

                $window.addEventListener('adal:popUpClosed', function (e) {
                    var errorParts = e.detail.split('|');

                    if (_adal._loginInProgress) {
                        $rootScope.$broadcast('adal:loginFailure', errorParts[0], errorParts[1]);
                        _adal._loginInProgress = false;
                    }
                    else if (_adal._acquireTokenInProgress) {
                        $rootScope.$broadcast('adal:acquireTokenFailure', errorParts[0], errorParts[1]);
                        _adal._acquireTokenInProgress = false;
                    }
                });

                updateDataFromCache(_adal.config.loginResource);
                $rootScope.userInfo = _oauthData;

                return {
                    // public methods will be here that are accessible from Controller
                    config: _adal.config,
                    login: function () {
                        _adal.login();
                    },
                    loginInProgress: function () {
                        return _adal.loginInProgress();
                    },
                    logOut: function () {
                        _adal.logOut();
                        //call signout related method
                    },
                    getCachedToken: function (resource) {
                        return _adal.getCachedToken(resource);
                    },
                    userInfo: _oauthData,
                    acquireToken: function (resource) {
                        // automated token request call
                        var deferred = $q.defer();
                        _adal._renewActive = true;
                        _adal.acquireToken(resource, function (errorDesc, tokenOut, error) {
                            _adal._renewActive = false;
                            if (error) {
                                $rootScope.$broadcast('adal:acquireTokenFailure', errorDesc, error);
                                _adal.error('Error when acquiring token for resource: ' + resource, error);
                                deferred.reject(errorDesc + "|" + error);
                            } else {
                                $rootScope.$broadcast('adal:acquireTokenSuccess', tokenOut);
                                deferred.resolve(tokenOut);
                            }
                        });

                        return deferred.promise;
                    },

                    acquireTokenPopup: function (resource, extraQueryParameters, claims) {
                        var deferred = $q.defer();
                        _adal.acquireTokenPopup(resource, extraQueryParameters, claims, function (errorDesc, tokenOut, error) {
                            if (error) {
                                $rootScope.$broadcast('adal:acquireTokenFailure', errorDesc, error);
                                _adal.error('Error when acquiring token for resource: ' + resource, error);
                                deferred.reject(errorDesc + "|" + error);
                            } else {
                                $rootScope.$broadcast('adal:acquireTokenSuccess', tokenOut);
                                deferred.resolve(tokenOut);
                            }
                        });

                        return deferred.promise;
                    },

                    acquireTokenRedirect: function (resource, extraQueryParameters, claims) {
                        _adal.acquireTokenRedirect(resource, extraQueryParameters, claims);
                    },

                    getUser: function () {
                        var deferred = $q.defer();
                        _adal.getUser(function (error, user) {
                            if (error) {
                                _adal.error('Error when getting user', error);
                                deferred.reject(error);
                            } else {
                                deferred.resolve(user);
                            }
                        });

                        return deferred.promise;
                    },
                    getResourceForEndpoint: function (endpoint) {
                        return _adal.getResourceForEndpoint(endpoint);
                    },
                    clearCache: function () {
                        _adal.clearCache();
                    },
                    clearCacheForResource: function (resource) {
                        _adal.clearCacheForResource(resource);
                    },
                    info: function (message) {
                        _adal.info(message);
                    },
                    verbose: function (message) {
                        _adal.verbose(message);
                    }
                };
            }];
        });

        // Interceptor for http if needed
        AdalModule.factory('ProtectedResourceInterceptor', ['adalAuthenticationService', '$q', '$rootScope', '$templateCache', function (authService, $q, $rootScope, $templateCache) {

            return {
                request: function (config) {
                    if (config) {

                        config.headers = config.headers || {};

                        // if the request can be served via templateCache, no need to token
                        if ($templateCache.get(config.url)) return config;

                        var resource = authService.getResourceForEndpoint(config.url);
                        authService.verbose('Url: ' + config.url + ' maps to resource: ' + resource);
                        if (resource === null) {
                            return config;
                        }
                        var tokenStored = authService.getCachedToken(resource);
                        if (tokenStored) {
                            authService.info('Token is available for this url ' + config.url);
                            // check endpoint mapping if provided
                            config.headers.Authorization = 'Bearer ' + tokenStored;
                            return config;
                        }
                        else {
                            // Cancel request if login is starting
                            if (authService.loginInProgress()) {
                                if (authService.config.popUp) {
                                    authService.info('Url: ' + config.url + ' will be loaded after login is successful');
                                    var delayedRequest = $q.defer();
                                    $rootScope.$on('adal:loginSuccess', function (event, token) {
                                        if (token) {
                                            authService.info('Login completed, sending request for ' + config.url);
                                            config.headers.Authorization = 'Bearer ' + tokenStored;
                                            delayedRequest.resolve(config);
                                        }
                                    });
                                    $rootScope.$on('adal:loginFailure', function (event, error) {
                                        if (error) {
                                            config.data = error;
                                            delayedRequest.reject(config);
                                        }
                                    });
                                    return delayedRequest.promise;
                                }
                                else {
                                    authService.info('login is in progress.');
                                    config.data = 'login in progress, cancelling the request for ' + config.url;
                                    return $q.reject(config);
                                }
                            }
                            else {
                                // delayed request to return after iframe completes
                                var delayedRequest = $q.defer();
                                authService.acquireToken(resource).then(function (token) {
                                    authService.verbose('Token is available');
                                    config.headers.Authorization = 'Bearer ' + token;
                                    delayedRequest.resolve(config);
                                }, function (error) {
                                    config.data = error;
                                    delayedRequest.reject(config);
                                });

                                return delayedRequest.promise;
                            }
                        }
                    }
                },
                responseError: function (rejection) {
                    authService.info('Getting error in the response: ' + JSON.stringify(rejection));
                    if (rejection) {
                        if (rejection.status === 401) {
                            var resource = authService.getResourceForEndpoint(rejection.config.url);
                            authService.clearCacheForResource(resource);
                            $rootScope.$broadcast('adal:notAuthorized', rejection, resource);
                        }
                        else {
                            $rootScope.$broadcast('adal:errorResponse', rejection);
                        }
                        return $q.reject(rejection);
                    }
                }
            };
        }]);
    } else {
        console.error('Angular.JS is not included');
    }
}());
