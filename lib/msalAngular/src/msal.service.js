"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
require("rxjs/add/observable/of");
require("rxjs/add/operator/do");
require("rxjs/add/operator/delay");
var lib_commonjs_1 = require("../../msal-core/lib-commonjs");
var Constants_1 = require("../../msal-core/lib-commonjs/Constants");
exports.MSAL_CONFIG = new core_1.InjectionToken("MSAL_CONFIG");
var ResponseTypes = {
    id_token: "id_token",
    token: "token",
    id_token_token: "id_token token"
};
var MsalService = (function (_super) {
    __extends(MsalService, _super);
    function MsalService(config, location, router, activatedRoute, broadcastService) {
        /* this._msal = new UserAgentApplication(this.config.clientID, this.config.authority, this.authCallback,
             {
                 validateAuthority: this.config.validateAuthority,
                 cacheLocation: this.config.cacheLocation,
                 redirectUri: this.config.redirectUri,
                 postLogoutRedirectUri: this.config.postLogoutRedirectUri,
                 // logger: this.config.logger,
                 loadFrameTimeout: this.config.loadFrameTimeout,
                 navigateToLoginRequestUrl: this.config.navigateToLoginRequestUrl,
                 isAngular: this.config.isAngular,
                 anonymousEndpoints: this.config.anonymousEndpoints,
                 endPoints: this.config.endpoints,
 
             });
 */
        var _this = _super.call(this, config.clientID, config.authority, null, {
            validateAuthority: config.validateAuthority,
            cacheLocation: config.cacheLocation,
            redirectUri: config.redirectUri,
            postLogoutRedirectUri: config.postLogoutRedirectUri,
            logger: config.logger,
            loadFrameTimeout: config.loadFrameTimeout,
            navigateToLoginRequestUrl: config.navigateToLoginRequestUrl,
            isAngular: true,
            anonymousEndpoints: config.anonymousEndpoints,
            endPoints: config.endpoints,
        }) || this;
        _this.config = config;
        _this.location = location;
        _this.router = router;
        _this.activatedRoute = activatedRoute;
        _this.broadcastService = broadcastService;
        _this._oauthData = { isAuthenticated: false, userName: "", loginError: "", idToken: {} };
        _this.processHash = function (hash) {
            var _this = this;
            if (this.isCallback(hash)) {
                var isPopup = false;
                var requestInfo = null;
                var callback = null;
                // callback can come from popupWindow, iframe or mainWindow
                if (this._openedWindows.length > 0 && this._openedWindows[this._openedWindows.length - 1].opener
                    && this._openedWindows[this._openedWindows.length - 1].opener.msal) {
                    var mainWindow = this._openedWindows[this._openedWindows.length - 1].opener;
                    //todo temp commented
                    this._msal = mainWindow.msal;
                    isPopup = true;
                    requestInfo = this.getRequestInfo(hash);
                    if (mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                        callback = mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse];
                    }
                }
                else if (window.parent && window.parent.msal) {
                    this._msal = window.parent.msal;
                    requestInfo = this.getRequestInfo(hash);
                    if (window.parent !== window && window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                        callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    }
                    else {
                        callback = this._tokenReceivedCallback;
                    }
                }
                requestInfo = this.getRequestInfo(hash);
                this.getLogger().verbose("Processing the hash: " + hash);
                this.saveTokenFromHash(requestInfo);
                // Return to callback if it is sent from iframe
                var token = requestInfo.parameters["access_token"] || requestInfo.parameters["id_token"];
                var error = requestInfo.parameters["error"];
                var errorDescription = requestInfo.parameters["error_description"];
                var tokenType = null;
                if (requestInfo.stateMatch) {
                    if (requestInfo.requestType === "RENEW_TOKEN") {
                        tokenType = Constants_1.Constants.accessToken;
                        this._renewActive = false;
                        // Call within the same context without full page redirect keeps the callback
                        // id_token or access_token can be renewed
                        if (window.parent === window && !window.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                            if (token) {
                                this.broadcastService.broadcast("msal:acquireTokenSuccess", token);
                            }
                            else if (error && errorDescription) {
                                this.broadcastService.broadcast("msal:acquireTokenFailure", { errorDescription: errorDescription, error: error });
                            }
                        }
                    }
                    else if (requestInfo.requestType === "LOGIN") {
                        tokenType = Constants_1.Constants.idToken;
                        this.updateDataFromCache(this.loginScopes);
                        //todo this is required only to get the callback for login_success for redirect case
                        // this._msal.getCacheStorage().setItem(Constants.urlHash, hash);
                        if (this._oauthData.userName) {
                            setTimeout(function () {
                                // id_token is added as token for the app
                                _this.updateDataFromCache(_this.loginScopes);
                                //todo temp commented
                                //  this.userInfo = this._oauthData;
                            }, 1);
                            this.broadcastService.broadcast("msal:loginSuccess", token);
                        }
                        else {
                            this.broadcastService.broadcast("msal:loginFailure", { errorDescription: errorDescription, error: error });
                        }
                    }
                    /*  if (callback && typeof callback === "function") {
                          callback(errorDescription, token, error, tokenType);
                      }
      */
                    // since this is a token renewal request in iFrame, we don't need to proceed with the location change.
                    if (window.parent !== window) {
                        if (event && event.preventDefault) {
                            event.preventDefault();
                        }
                        return;
                    }
                    // redirect to login start page
                    if (window.parent === window && !isPopup) {
                        if (this._navigateToLoginRequestUrl) {
                            var loginStartPage = this._cacheStorage.getItem(Constants_1.Constants.loginRequest);
                            if (typeof loginStartPage !== "undefined" && loginStartPage && loginStartPage.length !== 0) {
                                // prevent the current location change and redirect the user back to the login start page
                                this._logger.verbose("Redirecting to start page: " + loginStartPage);
                                //todo hashbang doesn't work currently
                                /*
                                    if (!$location.$$html5 && loginStartPage.indexOf('#') > -1) {
                                        $location.url(loginStartPage.substring(loginStartPage.indexOf('#') + 1));
                                    }
                                 */
                                window.location.href = loginStartPage;
                            }
                        }
                        else {
                            //todo hashbang doesn't work currently
                            /*
                            // resetting the hash to null
                            if ($location.$$html5) {
                                $location.hash('');
                            }
                            else {
                                $location.path('');
                            }*/
                        }
                    }
                }
                else {
                    // state did not match, broadcast an error
                    this.broadcastService.broadcast("msal:stateMismatch", { errorDescription: errorDescription, error: error });
                }
            }
            /*else {
                // No callback. App resumes after closing or moving to new page.
                // Check token and username
                this.updateDataFromCache(this.loginScopes);
                if (!this._oauthData.isAuthenticated && this._oauthData.userName && !this._renewActive) {
                    // id_token is expired or not present
                    //var self = $injector.get('msalAuthenticationService');
                    this._msal.acquireTokenSilent(this.loginScopes).then( (token: any) => {
                        if (token) {
                            this._oauthData.isAuthenticated = true;
                        }
                    },  (error: any) => {
                        var errorParts = error.split("|");
                        this.broadcastService.broadcast("msal:loginFailure", {errorParts});
                    });
                }
            }*/
        };
        _this.loginScopes = [_this.clientId];
        _this.updateDataFromCache(_this.loginScopes);
        var urlHash = window.location.hash;
        _this.processHash(urlHash);
        window.addEventListener("msal:popUpHashChanged", function (e) {
            console.log("popUpHashChanged ");
            _this.processHash(e.detail);
        });
        window.addEventListener('msal:popUpClosed', function (e) {
            var errorParts = e.detail.split('|');
            if (_this.loginInProgress()) {
                broadcastService.broadcast('msal:loginFailure', { errorParts: errorParts });
                _this.setloginInProgress(false);
            }
            else if (_this.getAcquireTokenInProgress()) {
                broadcastService.broadcast('msal:acquireTokenFailure', { errorParts: errorParts });
                _this.setAcquireTokenInProgress(false);
            }
        });
        _this.router.events.subscribe(function (event) {
            for (var i = 0; i < router.config.length; i++) {
                if (!router.config[i].canActivate) {
                    if (_this.config && _this.config.anonymousEndpoints) {
                        if (!_this.isAnonymousEndpoint(router.config[i].path)) {
                            _this.config.anonymousEndpoints.push(router.config[i].path);
                        }
                    }
                }
            }
        });
        return _this;
    }
    MsalService.prototype.updateDataFromCache = function (scopes) {
        // only cache lookup here to not interrupt with events
        var cacheResult;
        cacheResult = this.getCachedToken_(scopes);
        this._oauthData.isAuthenticated = cacheResult != null && cacheResult.token !== null && cacheResult.token.length > 0;
        this.user = this.getUser() || { userName: "" };
        this._oauthData.userName = this.user.name;
        this._oauthData.idToken = this.user.idToken;
        this._oauthData.loginError = cacheResult == null ? "" : cacheResult.error;
    };
    MsalService.prototype.loginHandler = function (loginStartPage) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (loginStartPage !== null) {
                _this._cacheStorage.setItem(Constants_1.Constants.angularLoginRequest, loginStartPage);
            }
            // directly start login flow
            _this.getLogger().info('Start login at:' + loginStartPage !== null ? loginStartPage : window.location.href);
            if (_this.config.popUp) {
                _this.loginPopups(_this.config.scopes, _this.config.extraQueryParameters).then(function (token) {
                    resolve(token);
                }, function (error) {
                    reject(error);
                });
            }
            else {
                _this.loginRedirects(_this.config.scopes, _this.config.extraQueryParameters);
                resolve("");
            }
        });
    };
    MsalService.prototype.isAnonymousEndpoint = function (url) {
        if (this.config && this.config.anonymousEndpoints) {
            for (var i = 0; i < this.config.anonymousEndpoints.length; i++) {
                if (url.indexOf(this.config.anonymousEndpoints[i]) > -1) {
                    return true;
                }
            }
        }
        return false;
    };
    MsalService.prototype.getCacheStorage = function () {
        return this._cacheStorage;
    };
    MsalService.prototype.loginRedirects = function (scopes, extraQueryParameters) {
        this._logger.verbose("login redirect flow");
        this.loginRedirect(scopes, extraQueryParameters);
    };
    MsalService.prototype.loginPopups = function (scopes, extraQueryParameters) {
        var _this = this;
        this._logger.verbose("login popup flow");
        return new Promise(function (resolve, reject) {
            _this.loginPopup(scopes, extraQueryParameters).then(function (idToken) {
                _this.broadcastService.broadcast("msal:loginSuccess", { idToken: idToken });
                resolve(idToken);
            }, function (error) {
                console.log("Error during login:\n" + error);
                _this.broadcastService.broadcast("msal:loginFailure", { error: error });
                reject("error " + "|" + error);
            });
        });
    };
    MsalService.prototype.logout = function () {
        this.user = null;
        this.logout();
    };
    /*
    public getToken(url: string): Promise<string> {
        var scopes = this.getScopeForEndpoint(url);
        if (scopes === null) {
            return;
        }
        //get scopes for this endpoint and pass the scopes here
        return this._msal.acquireTokenSilent(scopes)
            .then(token => {
                this.broadcastService.broadcast("msal:acquireTokenSuccess", {token});
                // return Promise.resolve(token);
                return token;
            }).catch(error => {
                return this._msal.acquireTokenPopup(this.config.scopes)
                    .then(token => {
                        this.broadcastService.broadcast("msal:acquireTokenSuccess", {});
                        return Promise.resolve(token);
                    }).catch(innererror => {

                        this.broadcastService.broadcast("msal:acquireTokenFailure", {});
                        return Promise.reject("");
                    });
            });
    }
*/
    MsalService.prototype.getCachedToken_ = function (scopes) {
        //TODO - we shouldn't be using AuthenticationRequestParameters instance here. Msal core needs to be changed
        var authenticationRequest = new lib_commonjs_1.AuthenticationRequestParameters(this.authorityInstance, this.config.clientID, scopes, ResponseTypes.id_token, this.config.redirectUri);
        var user = this.getUser();
        if (user) {
            return this.getCachedToken(authenticationRequest, this.getUser());
        }
    };
    MsalService.prototype.acquireTokenSilent_ = function (scopes, authority, user, extraQueryParameters) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.acquireTokenSilent(scopes, authority, user, extraQueryParameters).then(function (token) {
                _this._renewActive = false;
                _this.broadcastService.broadcast('msal:acquireTokenSuccess', token);
                resolve(token);
            }, function (error) {
                var errorParts = error.split('|');
                _this._renewActive = false;
                _this.broadcastService.broadcast('msal:acquireTokenFailure', errorParts);
                //_msal.error('Error when acquiring token for resource: ' + resource, error);
                reject(error);
            });
        });
    };
    MsalService.prototype.acquireTokenPopup_ = function (scopes, authority, user, extraQueryParameters) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.acquireTokenPopup(scopes, authority, user, extraQueryParameters).then(function (token) {
                _this._renewActive = false;
                _this.broadcastService.broadcast('msal:acquireTokenSuccess', token);
                resolve(token);
            }, function (error) {
                var errorParts = error.split('|');
                _this._renewActive = false;
                _this.broadcastService.broadcast('msal:acquireTokenFailure', errorParts);
                //_msal.error('Error when acquiring token for resource: ' + resource, error);
                reject(error);
            });
        });
    };
    MsalService.prototype.loginInProgress_ = function () {
        return this.loginInProgress();
    };
    MsalService.prototype.getUser_ = function () {
        return this.getUser();
    };
    MsalService.prototype.getScopeForEndpoint_ = function (endpoint) {
        return this.getScopesForEndpoint(endpoint);
    };
    MsalService.prototype.authCallback = function (errorDesc, _token, error, _tokenType) {
    };
    MsalService.prototype.saveTokenFromHash_ = function (tokenResponse) {
        return this.saveTokenFromHash(tokenResponse);
    };
    MsalService.prototype.getRequestInfo_ = function (hash) {
        return this.getRequestInfo(hash);
    };
    return MsalService;
}(lib_commonjs_1.UserAgentApplication));
MsalService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(exports.MSAL_CONFIG))
], MsalService);
exports.MsalService = MsalService;
