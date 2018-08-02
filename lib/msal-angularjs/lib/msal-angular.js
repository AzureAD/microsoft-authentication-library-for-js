//----------------------------------------------------------------------
// msal-angular v0.0.1
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
    if (angular) {
        var Msal = require('msal');
        var MsalModule = angular.module('MsalAngular', []);
        
        MsalModule.provider('msalAuthenticationService', function () {
            var _msal = null;
            var _config = null;
            var _constants = null;
            var _oauthData = { isAuthenticated: false, userName: '', loginError: '', idToken: {} };

            var updateDataFromCache = function (scopes) {
                // only cache lookup here to not interrupt with events
                var cacheResult = _msal.getCachedToken({ scopes: scopes }, _msal.getUser());
                _oauthData.isAuthenticated = cacheResult != null && cacheResult.token !== null && cacheResult.token.length > 0;
                var user = _msal.getUser();
                if (user) {
                    _oauthData.userName = user.name;
                    _oauthData.idToken = user.idToken;
                }

                if (cacheResult && cacheResult.error) {
                    _oauthData.loginError = cacheResult.error;
                }
            };

            this.init = function (configOptions, httpProvider) {
                if (configOptions) {
                    _config = configOptions;
                    if (!configOptions.optionalParams) {
                        configOptions.optionalParams = {};
                    }

                    configOptions.optionalParams.isAngular = true;

                    if (httpProvider && httpProvider.interceptors) {
                        httpProvider.interceptors.push('ProtectedResourceInterceptor');
                    }

                    // create instance with given config
                    _msal = new Msal.UserAgentApplication(configOptions.clientID, configOptions.authority, configOptions.tokenReceivedCallback, configOptions.optionalParams);
                    if (configOptions.routeProtectionConfig) {
                        _msal.routeProtectionConfig = configOptions.routeProtectionConfig;
                    }
                    else {
                        _msal.routeProtectionConfig = {};
                    }

                    _msal.loginScopes = [_msal.clientId];
                    _constants = Msal.Constants;

                } else {
                    throw new Error('You must set configOptions, when calling init');
                }
                // loginResource is used to set authenticated status
                updateDataFromCache(_msal.loginScopes);
            };

            // special function that exposes methods in Angular controller
            // $rootScope, $window, $q, $location, $timeout are injected by Angular
            this.$get = ['$rootScope', '$window', '$q', '$location', '$timeout', '$injector', function ($rootScope, $window, $q, $location, $timeout, $injector) {

                var locationChangeHandler = function (event, newUrl, oldUrl) {
                    _msal._logger.info('Location change event from ' + oldUrl + ' to ' + newUrl);
                    if ($location.$$html5) {
                        var hash = $location.hash();
                    }
                    else {
                        var hash = '#' + $location.path();
                    }

                    processHash(hash, event, $window);

                    $timeout(function () {
                        updateDataFromCache(_msal.loginScopes);
                        $rootScope.userInfo = _oauthData;
                    }, 1);
                };

                var processHash = function (hash, event, $window) {

                    if (_msal.isCallback(hash)) {
                        var isPopup = false;
                        var requestInfo = null;
                        var callback = null;
                        // callback can come from popupWindow, iframe or mainWindow
                        if ($window.openedWindows.length > 0 && $window.openedWindows[$window.openedWindows.length - 1].opener
                            && $window.openedWindows[$window.openedWindows.length - 1].opener.msal)
                        {
                            var mainWindow = $window.openedWindows[$window.openedWindows.length - 1].opener;
                            _msal = mainWindow.msal;
                            isPopup = true;
                            requestInfo = _msal.getRequestInfo(hash);
                            if (mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                callback = mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse];
                            }
                        }

                        else if ($window.parent && $window.parent.msal) {
                            _msal = $window.parent.msal;
                            requestInfo = _msal.getRequestInfo(hash);
                            if ($window.parent !== $window && $window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                callback = $window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                            }
                            else {
                                callback = _msal._tokenReceivedCallback;
                            }
                        }

                        _msal._logger.verbose('Processing the hash: ' + hash);
                        _msal.saveTokenFromHash(requestInfo);
                        // Return to callback if it is sent from iframe
                        var token = requestInfo.parameters['access_token'] || requestInfo.parameters['id_token'];
                        var error = requestInfo.parameters['error'];
                        var errorDescription = requestInfo.parameters['error_description'];
                        var tokenType = null;

                        if (requestInfo.stateMatch) {
                            if (requestInfo.requestType === "RENEW_TOKEN") {
                                tokenType = _constants.accessToken;
                                _msal._renewActive = false;

                                // Call within the same context without full page redirect keeps the callback
                                // id_token or access_token can be renewed
                                if ($window.parent === $window && !$window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                    if (token) {
                                        $rootScope.$broadcast('msal:acquireTokenSuccess', token);
                                    }
                                    else if (error && errorDescription) {
                                        $rootScope.$broadcast('msal:acquireTokenFailure', errorDescription, error);
                                    }
                                }

                            } else if (requestInfo.requestType === "LOGIN") {
                                tokenType = _constants.idToken;
                                updateDataFromCache(_msal.loginScopes);

                                if (_oauthData.userName) {
                                    $timeout(function () {
                                        // id_token is added as token for the app
                                        updateDataFromCache(_msal.loginScopes);
                                        $rootScope.userInfo = _oauthData;
                                    }, 1);

                                    $rootScope.$broadcast('msal:loginSuccess', token);
                                } else {
                                    $rootScope.$broadcast('msal:loginFailure', errorDescription || _msal._cacheStorage.getItem(_constants.msalErrorDescription), error || _msal._cacheStorage.getItem(_constants.msalError));
                                }

                            }

                            if (callback && typeof callback === 'function') {
                                callback(errorDescription, token, error, tokenType);
                            }

                            // since this is a token renewal request in iFrame, we don't need to proceed with the location change.
                            if ($window.parent !== $window) {//in iframe
                                if (event && event.preventDefault) {
                                    event.preventDefault();
                                }

                                return;
                            }

                            // redirect to login start page
                            if ($window.parent === $window && !isPopup) {
                                if (_msal._navigateToLoginRequestUrl) {
                                    var loginStartPage = _msal._cacheStorage.getItem(_constants.loginRequest);
                                    if (typeof loginStartPage !== 'undefined' && loginStartPage && loginStartPage.length !== 0) {
                                        // prevent the current location change and redirect the user back to the login start page
                                        _msal._logger.verbose('Redirecting to start page: ' + loginStartPage);
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
                            $rootScope.$broadcast('msal:stateMismatch', errorDescription, error);
                        }
                    } else {
                        // No callback. App resumes after closing or moving to new page.
                        // Check token and username
                        updateDataFromCache(_msal.loginScopes);
                        if (!_oauthData.isAuthenticated && _oauthData.userName && !_msal._renewActive) {
                            // id_token is expired or not present
                            var self = $injector.get('msalAuthenticationService');
                            self.acquireTokenSilent(_msal.loginScopes).then(function (token) {
                                if (token) {
                                    _oauthData.isAuthenticated = true;
                                }
                            }, function (error) {
                                var errorParts = error.split('|');
                                $rootScope.$broadcast('msal:loginFailure', errorParts[0], errorParts[1]);
                            });
                        }
                    }

                };

                var loginHandler = function (loginStartPage, routeProtectionConfig) {
                    if (loginStartPage !== null) {
                        _msal._cacheStorage.setItem(_constants.angularLoginRequest, loginStartPage);
                    }

                    _msal._logger.info('Start login at:' + loginStartPage !== null ? loginStartPage : window.location.href);
                    $rootScope.$broadcast('msal:loginRedirect');
                    if (routeProtectionConfig.popUp) {
                        _msal.loginPopup(routeProtectionConfig.consentScopes, routeProtectionConfig.extraQueryParameters);
                    }
                    else {
                        _msal.loginRedirect(routeProtectionConfig.consentScopes, routeProtectionConfig.extraQueryParameters);
                    }

                };

                function isUnprotectedResource(url) {
                    if (_msal && _msal._unprotectedResources) {
                        for (var i = 0; i < _msal._unprotectedResources.length; i++) {
                            if (url.indexOf(_msal._unprotectedResources[i]) > -1) {
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
                        var requireLogin = _msal.routeProtectionConfig.requireLogin || nextRoute.$$route.requireLogin;
                        if (requireLogin) {
                            if (!_oauthData.isAuthenticated) {
                                if (!_msal._renewActive && !_msal.loginInProgress()) {
                                    _msal._logger.info('Route change event for:' + $location.$$url);
                                    loginHandler(null, _msal.routeProtectionConfig);
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
                            if (nextRouteUrl && !isUnprotectedResource(nextRouteUrl)) {
                                _msal._unprotectedResources.push(nextRouteUrl);
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
                            var requireLogin = _msal.routeProtectionConfig.requireLogin || state.requireLogin;
                            if (requireLogin) {
                                if (!_oauthData.isAuthenticated) {
                                    if (!_msal._renewActive && !_msal.getUser()) {
                                        _msal._logger.info('State change event for:' + $location.$$url);
                                        var $state = $injector.get('$state');
                                        var loginStartPage = $state.href(toState, toParams, { absolute: true });
                                        loginHandler(loginStartPage, _msal.routeProtectionConfig);
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
                                if (nextStateUrl && !isUnprotectedResource(nextStateUrl)) {
                                    _msal._unprotectedResources.push(nextStateUrl);
                                }
                            }
                        }
                    }
                };

                var stateChangeErrorHandler = function (event, toState, toParams, fromState, fromParams, error) {
                    _msal._logger.verbose("State change error occured. Error: " + typeof (error) === 'string' ? error : JSON.stringify(error));
                    // msal interceptor sets the error on config.data property. If it is set, it means state change is rejected by msal,
                    // in which case set the defaultPrevented to true to avoid url update as that sometimesleads to infinte loop.
                    if (error && error.data) {
                        _msal._logger.info("Setting defaultPrevented to true if state change error occured because msal rejected a request. Error: " + error.data);
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
                $window.addEventListener('msal:popUpHashChanged', function (e) {
                    processHash(e.detail, null, $window);
                });

                $window.addEventListener('msal:popUpClosed', function (e) {
                    var errorParts = e.detail.split('|');

                    if (_msal._loginInProgress) {
                        $rootScope.$broadcast('msal:loginFailure', errorParts[0], errorParts[1]);
                        _msal._loginInProgress = false;
                    }
                    else if (_msal._acquireTokenInProgress) {
                        $rootScope.$broadcast('msal:acquireTokenFailure', errorParts[0], errorParts[1]);
                        _msal._acquireTokenInProgress = false;
                    }
                });

                updateDataFromCache(_msal.loginScopes);
                $rootScope.userInfo = _oauthData;

                return {
                    // public methods will be here that are accessible from Controller
                    loginRedirect: function (scopes, extraQueryParameters) {
                        _msal.loginRedirect(scopes, extraQueryParameters);
                    },

                    loginPopup: function (scopes, extraQueryParameters) {
                        var deferred = $q.defer();
                        _msal.loginPopup(scopes, extraQueryParameters).then(function (token) {
                            $rootScope.$broadcast('msal:loginSuccess', token);
                            deferred.resolve(token);
                        }, function (error) {
                            var errorParts = error.split('|');
                            $rootScope.$broadcast('msal:loginFailure', errorParts[0], errorParts[1]);
                            deferred.reject(error);
                        })
                        return deferred.promise;
                    },

                    clearCacheForScope: function (accessToken) {
                        _msal.clearCacheForScope(accessToken);
                    },

                    getAllUsers: function () {
                        return _msal.getAllUsers();
                    },

                    acquireTokenRedirect: function (scopes, authority, user, extraQueryParameters) {
                        var acquireTokenStartPage = _msal._cacheStorage.getItem(_constants.loginRequest);
                        if (window.location.href !== acquireTokenStartPage)
                            _msal._cacheStorage.setItem(_constants.loginRequest, window.location.href);
                        _msal.acquireTokenRedirect(scopes, authority, user, extraQueryParameters);
                    },

                    acquireTokenPopup: function (scopes, authority, user, extraQueryParameters) {
                        var deferred = $q.defer();
                        _msal.acquireTokenPopup(scopes, authority, user, extraQueryParameters).then(function (token) {
                            _msal._renewActive = false;
                            $rootScope.$broadcast('msal:acquireTokenSuccess', token);
                            deferred.resolve(token);
                        }, function (error) {
                            var errorParts = error.split('|');
                            _msal._renewActive = false;
                            $rootScope.$broadcast('msal:acquireTokenFailure', errorParts[0], errorParts[1]);
                            deferred.reject(error);
                        })
                        return deferred.promise;
                    },

                    acquireTokenSilent: function (scopes, authority, user, extraQueryParameters) {
                        var deferred = $q.defer();
                        _msal.acquireTokenSilent(scopes, authority, user, extraQueryParameters).then(function (token) {
                            _msal._renewActive = false;
                            $rootScope.$broadcast('msal:acquireTokenSuccess', token);
                            deferred.resolve(token);
                        }, function (error) {
                            var errorParts = error.split('|');
                            _msal._renewActive = false;
                            $rootScope.$broadcast('msal:acquireTokenFailure', errorParts[0], errorParts[1]);
                            deferred.reject(error);
                        })
                        return deferred.promise;
                    },

                    getUser: function () {
                        return _msal.getUser();
                    },

                    isCallback: function (hash) {
                        return _msal.isCallback(hash);
                    },

                    loginInProgress: function () {
                        return _msal.loginInProgress();
                    },

                    logout: function () {
                        _msal.logout();
                    },

                    userInfo: _oauthData,

                    _getCachedToken: function (scopes) {
                        return _msal.getCachedToken({ scopes: scopes }, _msal.getUser());
                    },

                    _getScopesForEndpoint: function (endpoint) {
                        return _msal.getScopesForEndpoint(endpoint);
                    },

                    _info: function (message) {
                        _msal._logger.info(message);
                    },

                    _verbose: function (message) {
                        _msal._logger.verbose(message);
                    },
                };
            }];
        });

        // Interceptor for http if needed
        MsalModule.factory('ProtectedResourceInterceptor', ['msalAuthenticationService', '$q', '$rootScope', '$templateCache', '$injector', function (authService, $q, $rootScope, $templateCache, $injector) {

            return {
                request: function (config) {
                    if (config) {

                        config.headers = config.headers || {};
                        // if the request can be served via templateCache, no need to token
                        if ($templateCache.get(config.url)) return config;
                        var scopes = authService._getScopesForEndpoint(config.url);
                        var routeProtectionConfig = window.msal.routeProtectionConfig;
                        authService._verbose('Url: ' + config.url + ' maps to scopes: ' + scopes);
                        if (scopes === null) {
                            return config;
                        }

                        var cacheResult = authService._getCachedToken(scopes, authService.getUser());
                        if (cacheResult && cacheResult.token) {
                            authService._info('Token is available for this url ' + config.url);
                            // check endpoint mapping if provided
                            config.headers.Authorization = 'Bearer ' + cacheResult.token;
                            return config;
                        }
                        else {
                            // Cancel request if login is starting
                            if (authService.loginInProgress()) {
                                if (routeProtectionConfig && routeProtectionConfig.popUp) {
                                    authService._info('Url: ' + config.url + ' will be loaded after login is successful');
                                    var delayedRequest = $q.defer();
                                    $rootScope.$on('msal:loginSuccess', function (event, token) {
                                        if (token) {
                                            authService._info('Login completed, sending request for ' + config.url);
                                            config.headers.Authorization = 'Bearer ' + token;
                                            delayedRequest.resolve(config);
                                        }
                                    });
                                    $rootScope.$on('msal:loginFailure', function (event, error) {
                                        if (error) {
                                            config.data = error;
                                            delayedRequest.reject(config);
                                        }
                                    });
                                    return delayedRequest.promise;
                                }
                                else {
                                    authService._info('login is in progress.');
                                    config.data = 'login in progress, cancelling the request for ' + config.url;
                                    return $q.reject(config);
                                }
                            }
                            else {
                                // delayed request to return after iframe completes
                                var delayedRequest = $q.defer();
                                authService.acquireTokenSilent(scopes).then(function (token) {
                                    authService._verbose('Token is available');
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
                    authService._info('Getting error in the response: ' + JSON.stringify(rejection));
                    if (rejection) {
                        if (rejection.status === 401) {
                            var scopes = authService._getScopesForEndpoint(rejection.config.url);
                            var cacheResult = authService._getCachedToken(scopes, authService.getUser());
                            if (cacheResult && cacheResult.token) {
                                authService.clearCacheForScope(cacheResult.token);
                            }
                            $rootScope.$broadcast('msal:notAuthorized', rejection, scopes);
                        }
                        else {
                            $rootScope.$broadcast('msal:errorResponse', rejection);
                        }

                        return $q.reject(rejection);
                    }
                }
            };
        }]);
    } else {
        console.error('Angular.JS is not included');
    }
	
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = 'MsalAngular';
    }
	
}());