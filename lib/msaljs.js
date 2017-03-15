var MSAL;
(function (MSAL) {
    var ResponseTypes;
    (function (ResponseTypes) {
        ResponseTypes[ResponseTypes["id_token"] = 0] = "id_token";
        ResponseTypes[ResponseTypes["token"] = 1] = "token";
    })(ResponseTypes || (ResponseTypes = {}));
    var LoggingLevel;
    (function (LoggingLevel) {
        LoggingLevel[LoggingLevel["ERROR"] = 0] = "ERROR";
        LoggingLevel[LoggingLevel["WARN"] = 1] = "WARN";
        LoggingLevel[LoggingLevel["INFO"] = 2] = "INFO";
        LoggingLevel[LoggingLevel["VERBOSE"] = 3] = "VERBOSE";
    })(LoggingLevel || (LoggingLevel = {}));
    var Logging = (function () {
        function Logging() {
        }
        Logging.initialize = function (logLevel, loginCallback, correlationId) {
            this._logLevel = logLevel;
            this._loginCallback = loginCallback;
            this._correlationId = correlationId;
        };
        Logging._logLevel = 0;
        Logging._loginCallback = null;
        Logging._correlationId = null;
        return Logging;
    }());
    MSAL.Logging = Logging;
    var Constants = (function () {
        function Constants() {
        }
        Object.defineProperty(Constants, "errorDescription", {
            get: function () { return "error_description"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "idToken", {
            get: function () { return "id_token"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "accessToken", {
            get: function () { return "access_token"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "expiresIn", {
            get: function () { return "expires_in"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "sessionState", {
            get: function () { return "session_state"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "tokenKeys", {
            get: function () { return "adal.token.keys"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "accessTokenKey", {
            get: function () { return "adal.access.token.key"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "expirationKey", {
            get: function () { return "adal.expiration.key"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "stateLogin", {
            get: function () { return "adal.state.login"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "stateAcquireToken", {
            get: function () { return "adal.state.acquireToken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "stateRenew", {
            get: function () { return "adal.state.renew"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "nonceIdToken", {
            get: function () { return "adal.nonce.idtoken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "userName", {
            get: function () { return "adal.username"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "idTokenKey", {
            get: function () { return "adal.idtoken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "error", {
            get: function () { return "adal.error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "loginRequest", {
            get: function () { return "adal.login.request"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "loginError", {
            get: function () { return "adal.login.error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "renewStatus", {
            get: function () { return "adal.token.renew.status"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "resourceDelimeter", {
            get: function () { return "|"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "loadFrameTimeout", {
            get: function () {
                return this._loadFrameTimeout;
            },
            set: function (timeout) {
                this._loadFrameTimeout = timeout;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Constants, "tokenRenewStatusCancelled", {
            get: function () { return "Canceled"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "tokenRenewStatusCompleted", {
            get: function () { return "Completed"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "tokenRenewStatusInProgress", {
            get: function () { return "In Progress"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "popUpWidth", {
            get: function () { return this._popUpWidth; },
            set: function (width) {
                this._popUpWidth = width;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Constants, "popUpHeight", {
            get: function () { return this._popUpHeight; },
            set: function (height) {
                this._popUpHeight = height;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Constants, "login", {
            get: function () { return "LOGIN"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "renewToken", {
            get: function () { return "renewToken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "unknown", {
            get: function () { return "UNKNOWN"; },
            enumerable: true,
            configurable: true
        });
        Constants._loadFrameTimeout = 6000;
        Constants._popUpWidth = 483;
        Constants._popUpHeight = 600;
        return Constants;
    }());
    MSAL.Constants = Constants;
    var UserAgentApplication = (function () {
        function UserAgentApplication(clientId, authority, userCallback) {
            this._cacheLocations = {
                localStorage: 'localStorage',
                sessionStorage: 'sessionStorage'
            };
            this._cacheLocation = 'sessionStorage';
            this._interactionModes = {
                popUp: 'popUp',
                redirect: 'redirect'
            };
            this._interactionMode = 'redirect';
            this._clockSkew = 300;
            this._userCallback = null;
            this.authority = "https://login.microsoftonline.com/common";
            this.navigateToLoginRequestUrl = true;
            this.clientId = clientId;
            if (authority)
                this.authority = authority;
            if (userCallback)
                this._userCallback = userCallback;
            this.redirectUri = window.location.href.split("?")[0].split("#")[0];
            this.postLogoutredirectUri = this.redirectUri;
            this._loginInProgress = false;
            this._acquireTokenInProgress = false;
            this._renewStates = [];
            this._checkSessionIframe = null;
            this._activeRenewals = {};
            this._cacheStorage = new Storage(this._cacheLocation);
            window.MSAL = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
        }
        Object.defineProperty(UserAgentApplication.prototype, "cacheLocation", {
            get: function () {
                return this._cacheLocation;
            },
            set: function (cache) {
                this._cacheLocation = cache;
                if (this._cacheLocations[cache])
                    this._cacheStorage = new Storage(this._cacheLocations[cache]);
                else
                    throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UserAgentApplication.prototype, "interactionMode", {
            get: function () {
                return this._interactionMode;
            },
            set: function (mode) {
                if (this._interactionModes[mode])
                    this._interactionMode = this._interactionModes[mode];
                else
                    throw new Error('Interantion mode is not valid. Provided value:' + this._interactionMode + '.Possible values are: ' + this._interactionModes.redirect + ',' + this._interactionModes.popUp);
            },
            enumerable: true,
            configurable: true
        });
        UserAgentApplication.prototype.login = function () {
            if (this._loginInProgress) {
                return;
            }
            var authenticationRequest = new AuthenticationRequestParameters(this.authority, this.clientId, null, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            this._cacheStorage.saveItem(Constants.loginRequest, window.location.href);
            this._cacheStorage.saveItem(Constants.loginError, '');
            this._cacheStorage.saveItem(Constants.stateLogin, authenticationRequest.state);
            this._cacheStorage.saveItem(Constants.nonceIdToken, authenticationRequest.nonce);
            this._cacheStorage.saveItem(Constants.error, '');
            this._cacheStorage.saveItem(Constants.errorDescription, '');
            var urlNavigate = authenticationRequest.CreateNavigateUrl(null);
            this._loginInProgress = true;
            if (this._interactionMode === this._interactionModes.popUp) {
                this.openConsentWindow(urlNavigate, 'login', 20, this, this._userCallback);
                return;
            }
            else {
                if (urlNavigate) {
                    window.location.replace(urlNavigate);
                }
            }
        };
        UserAgentApplication.prototype.openConsentWindow = function (urlNavigate, title, interval, instance, callback) {
            var popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
                Logger.warn('Popup Window is null. This can happen if you are using IE');
                this._cacheStorage.saveItem(Constants.error, 'Error opening popup');
                this._cacheStorage.saveItem(Constants.errorDescription, 'Popup Window is null. This can happen if you are using IE');
                this._cacheStorage.saveItem(Constants.loginError, 'Popup Window is null. This can happen if you are using IE');
                if (callback)
                    callback(this._cacheStorage.getItem(Constants.loginError), null, null);
                return;
            }
            var self = this;
            var pollTimer = window.setInterval(function () {
                if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
                    instance._loginInProgress = false;
                    instance._acquireTokenInProgress = false;
                    window.clearInterval(pollTimer);
                }
                try {
                    if (popupWindow.location.href.indexOf(self.redirectUri) != -1) {
                        self.handleAuthenticationResponse(popupWindow.location.hash);
                        window.clearInterval(pollTimer);
                        instance._loginInProgress = false;
                        instance._acquireTokenInProgress = false;
                        Logger.info("Closing popup window");
                        popupWindow.close();
                    }
                }
                catch (e) {
                }
            }, interval);
        };
        UserAgentApplication.prototype.logout = function () {
            this._cacheStorage.clear();
            this.user = null;
            var logout = '';
            if (this.postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.postLogoutredirectUri);
            }
            var urlNavigate = this.authority + '/oauth2/v2.0/logout?' + logout;
            if (urlNavigate) {
                window.location.replace(urlNavigate);
            }
        };
        UserAgentApplication.prototype.openPopup = function (urlNavigate, title, popUpWidth, popUpHeight) {
            try {
                var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
                var winTop = window.screenTop ? window.screenTop : window.screenY;
                var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                var left = ((width / 2) - (popUpWidth / 2)) + winLeft;
                var top_1 = ((height / 2) - (popUpHeight / 2)) + winTop;
                var popupWindow = window.open(urlNavigate, title, 'width=' + popUpWidth + ', height=' + popUpHeight + ', top=' + top_1 + ', left=' + left);
                if (popupWindow.focus) {
                    popupWindow.focus();
                }
                return popupWindow;
            }
            catch (e) {
                Logger.warn('error opening popup, ' + e.message);
                this._loginInProgress = false;
                return null;
            }
        };
        UserAgentApplication.prototype.validateInputScope = function (scopes) {
            if (!scopes || scopes.length < 1) {
                return;
            }
            if (!Array.isArray(scopes)) {
                throw new Error('API does not accept non-array scopes');
            }
            if (scopes.indexOf('openid') > -1) {
                throw new Error('API does not accept openid as a user-provided scope');
            }
            if (scopes.indexOf('offline_access') > -1) {
                throw new Error('API does not accept offline_access as a user-provided scope');
            }
            if (scopes.indexOf(this.clientId) > -1) {
                if (scopes.length > 1) {
                    throw new Error('Client Id can only be provided as a single scope');
                }
            }
        };
        UserAgentApplication.prototype.registerCallback = function (expectedState, scope, callback) {
            this._activeRenewals[scope] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            var self = this;
            window.callBacksMappedToRenewStates[expectedState].push(callback);
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] = function (errorDesc, token, error) {
                    self._activeRenewals[scope] = null;
                    for (var i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                        try {
                            window.callBacksMappedToRenewStates[expectedState][i](errorDesc, token, error);
                        }
                        catch (error) {
                            Logger.warn(error);
                        }
                    }
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        };
        UserAgentApplication.prototype.getCachedToken = function (scopes) {
            var accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, this.authority);
            var accessTokenItems = [];
            for (var i = 0; i < accessTokenCacheItems.length; i++) {
                var accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.user.profile.oid === this.user.profile.oid) {
                    var cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                    if (Utils.containsScope(cachedScopes, scopes)) {
                        accessTokenItems.push(accessTokenCacheItem);
                    }
                }
            }
            if (accessTokenItems.length === 0 || accessTokenCacheItems.length > 1)
                return null;
            else {
                var accessTokenCacheItem = accessTokenItems[0];
                var expired = Number(accessTokenCacheItem.value.ExpiresIn);
                var offset = this._clockSkew || 300;
                if (expired && (expired > Utils.now() + offset)) {
                    return accessTokenCacheItem.value.AccessToken;
                }
                else {
                    this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[0]));
                    return null;
                }
            }
        };
        UserAgentApplication.prototype.addHintParameters = function (urlNavigate, loginHint) {
            if (this.user && this.user.profile && this.user.profile.hasOwnProperty('preferred_username')) {
                if (loginHint) {
                    urlNavigate += '&login_hint=' + encodeURIComponent(loginHint);
                }
                else {
                    urlNavigate += '&login_hint=' + encodeURIComponent(this.user.profile.preferred_username);
                }
                if (!this.urlContainsQueryStringParameter('domain_hint', urlNavigate) && this.user.profile.hasOwnProperty('tid')) {
                    if (this.user.profile.tid === '9188040d-6c67-4c5b-b112-36a304b66dad') {
                        urlNavigate += '&domain_hint=' + encodeURIComponent("consumers");
                    }
                    else {
                        urlNavigate += '&domain_hint=' + encodeURIComponent("organizations");
                    }
                }
            }
            return urlNavigate;
        };
        UserAgentApplication.prototype.urlContainsQueryStringParameter = function (name, url) {
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        };
        UserAgentApplication.prototype.acquireToken = function (scopes, callback, loginHint, extraQueryParameters) {
            if (this._acquireTokenInProgress) {
                return;
            }
            this.validateInputScope(scopes);
            var scope = scopes.join(' ');
            if (!this.user) {
                callback('user login is required', null);
                return;
            }
            this._acquireTokenInProgress = true;
            var authenticationRequest = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            var urlNavigate = authenticationRequest.CreateNavigateUrl(scopes);
            if (loginHint)
                urlNavigate = this.addHintParameters(urlNavigate, loginHint);
            else
                urlNavigate = this.addHintParameters(urlNavigate);
            if (this._interactionMode === this._interactionModes.popUp) {
                this._renewStates.push(authenticationRequest.state);
                this.registerCallback(authenticationRequest.state, scope, callback);
                this.openConsentWindow(urlNavigate, 'acquireToken', 1, this, callback);
                return;
            }
            else {
                if (urlNavigate) {
                    this._cacheStorage.saveItem(Constants.stateAcquireToken, authenticationRequest.state);
                    window.location.replace(urlNavigate);
                }
            }
        };
        UserAgentApplication.prototype.acquireTokenSilent = function (scopes, callback) {
            this.validateInputScope(scopes);
            var token = this.getCachedToken(scopes);
            var scope = scopes.join(' ');
            if (token) {
                Logger.info('Token is already in cache for scope:' + scope);
                callback(null, token);
                return;
            }
            if (!this.user) {
                callback('user login is required', null);
                return;
            }
            if (this._activeRenewals[scope]) {
                this.registerCallback(this._activeRenewals[scope], scope, callback);
            }
            else {
                if (!Utils.isEmpty(scope) && scope.indexOf(this.clientId) > -1) {
                    Logger.verbose('renewing idToken');
                    this.renewIdToken(scopes, callback);
                }
                else {
                    Logger.verbose('renewing accesstoken');
                    this.renewToken(scopes, callback);
                }
            }
        };
        UserAgentApplication.prototype.loadFrameTimeout = function (urlNavigate, frameName, scope) {
            Logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            var self = this;
            setTimeout(function () {
                if (self._cacheStorage.getItem(Constants.renewStatus + scope) === Constants.tokenRenewStatusInProgress) {
                    Logger.verbose('Loading frame has timed out after: ' + (Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    var expectedState = self._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null);
                    }
                    self._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCancelled);
                }
            }, Constants.loadFrameTimeout);
        };
        UserAgentApplication.prototype.loadFrame = function (urlNavigate, frameName) {
            var self = this;
            Logger.info('LoadFrame: ' + frameName);
            var frameCheck = frameName;
            setTimeout(function () {
                var frameHandle = self.addAdalFrame(frameCheck);
                if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                    frameHandle.src = urlNavigate;
                    self.loadFrame(urlNavigate, frameCheck);
                }
            }, 500);
        };
        UserAgentApplication.prototype.addAdalFrame = function (iframeId) {
            if (typeof iframeId === 'undefined') {
                return;
            }
            Logger.info('Add adal frame to document:' + iframeId);
            var adalFrame = document.getElementById(iframeId);
            if (!adalFrame) {
                if (document.createElement && document.documentElement &&
                    (window.navigator.userAgent.indexOf('MSIE 5.0') === -1)) {
                    var ifr = document.createElement('iframe');
                    ifr.setAttribute('id', iframeId);
                    ifr.style.visibility = 'hidden';
                    ifr.style.position = 'absolute';
                    ifr.style.width = ifr.style.height = '0px';
                    adalFrame = document.getElementsByTagName('body')[0].appendChild(ifr);
                }
                else if (document.body && document.body.insertAdjacentHTML) {
                    document.body.insertAdjacentHTML('beforeEnd', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
                }
                if (window.frames && window.frames[iframeId]) {
                    adalFrame = window.frames[iframeId];
                }
            }
            return adalFrame;
        };
        UserAgentApplication.prototype.renewToken = function (scopes, callback) {
            var scope = scopes.join(' ');
            Logger.verbose('renewToken is called for scope:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            var authenticationRequest = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            this._renewStates.push(authenticationRequest.state);
            Logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            var urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.registerCallback(authenticationRequest.state, scope, callback);
            Logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        };
        UserAgentApplication.prototype.renewIdToken = function (scopes, callback) {
            Logger.info('renewidToken is called');
            var frameHandle = this.addAdalFrame('adalIdTokenFrame');
            var authenticationRequest = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + this.clientId;
            this._cacheStorage.saveItem(Constants.nonceIdToken, authenticationRequest.nonce);
            Logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            var urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, callback);
            Logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.clientId);
        };
        UserAgentApplication.prototype.hasScope = function (key) {
            var keys = this._cacheStorage.getItem(Constants.tokenKeys);
            return keys && !Utils.isEmpty(keys) && (keys.indexOf(key + Constants.resourceDelimeter) > -1);
        };
        ;
        UserAgentApplication.prototype.getUser = function () {
            if (this.user) {
                return this.user;
            }
            var idToken = this._cacheStorage.getItem(Constants.idTokenKey);
            if (!Utils.isEmpty(idToken)) {
                this.user = this.createUser(idToken);
                return this.user;
            }
            return null;
        };
        ;
        UserAgentApplication.prototype.handleAuthenticationResponse = function (hash) {
            if (hash == null)
                hash = window.location.hash;
            if (this.isCallback(hash)) {
                var requestInfo = this.getRequestInfo(hash);
                Logger.info('Returned from redirect url');
                this.saveTokenFromHash(requestInfo);
                var token = null, callback = null;
                if ((requestInfo.requestType === Constants.renewToken) && window.parent) {
                    if (window.parent !== window)
                        Logger.verbose('Window is in iframe, acquiring token silently');
                    else
                        Logger.verbose('acquiring token interactive in progress');
                    if (window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                        callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    }
                    else
                        callback = this._userCallback;
                    token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
                }
                else if (requestInfo.requestType === Constants.login) {
                    callback = this._userCallback;
                    token = requestInfo.parameters[Constants.idToken];
                }
                try {
                    if (callback)
                        callback(this._cacheStorage.getItem(Constants.errorDescription), token, this._cacheStorage.getItem(Constants.error));
                }
                catch (err) {
                    Logger.error('Error occurred in user defined callback function', err);
                }
                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = '';
                    if (this.navigateToLoginRequestUrl && window.location.href.replace('#', '') !== this._cacheStorage.getItem(Constants.loginRequest))
                        window.location.href = this._cacheStorage.getItem(Constants.loginRequest);
                }
            }
        };
        UserAgentApplication.prototype.saveAccessToken = function (requestInfo) {
            if (requestInfo.parameters.hasOwnProperty('scope')) {
                this.user = this.getUser();
                var scopes = requestInfo.parameters['scope'];
                var consentedScopes = scopes.split(' ');
                var accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, this.authority);
                for (var i = 0; i < accessTokenCacheItems.length; i++) {
                    var accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.user.profile.oid === this.user.profile.oid) {
                        var cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                        if (Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem));
                        }
                    }
                }
                var accessTokenKey = new AccessTokenKey(this.authority, this.clientId, this.user, scopes);
                var accessTokenValue = new AccessTokenValue(requestInfo.parameters[Constants.accessToken], Utils.expiresIn(requestInfo.parameters[Constants.expiresIn]).toString());
                this._cacheStorage.saveItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
        };
        UserAgentApplication.prototype.saveTokenFromHash = function (requestInfo) {
            Logger.info('State status:' + requestInfo.stateMatch + '; Request type:' + requestInfo.requestType);
            this._cacheStorage.saveItem(Constants.error, '');
            this._cacheStorage.saveItem(Constants.errorDescription, '');
            var scope = this.getScopeFromState(requestInfo.stateResponse);
            if (requestInfo.parameters.hasOwnProperty(Constants.errorDescription)) {
                Logger.info('Error :' + requestInfo.parameters[Constants.error] + '; Error description:' + requestInfo.parameters[Constants.errorDescription]);
                this._cacheStorage.saveItem(Constants.error, requestInfo.parameters["error"]);
                this._cacheStorage.saveItem(Constants.errorDescription, requestInfo.parameters[Constants.errorDescription]);
                if (requestInfo.requestType === Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.saveItem(Constants.loginError, requestInfo.parameters["errorDescription"]);
                }
            }
            else {
                if (requestInfo.stateMatch) {
                    Logger.info('State is right');
                    if (requestInfo.parameters.hasOwnProperty(Constants.sessionState)) {
                        this._cacheStorage.saveItem(Constants.sessionState, requestInfo.parameters[Constants.sessionState]);
                    }
                    var keys;
                    if (requestInfo.parameters.hasOwnProperty(Constants.accessToken)) {
                        Logger.info('Fragment has access token');
                        this.saveAccessToken(requestInfo);
                    }
                    if (requestInfo.parameters.hasOwnProperty(Constants.idToken)) {
                        Logger.info('Fragment has id token');
                        this._loginInProgress = false;
                        this.user = this.createUser(requestInfo.parameters[Constants.idToken]);
                        if (this.user && this.user.profile) {
                            if (this.user.profile.nonce !== this._cacheStorage.getItem(Constants.nonceIdToken)) {
                                this.user = null;
                                this._cacheStorage.saveItem(Constants.loginError, 'Nonce Mismatch.Expected: ' + this._cacheStorage.getItem(Constants.nonceIdToken) + ',' + 'Actual: ' + this.user.profile.nonce);
                            }
                            else {
                                this._cacheStorage.saveItem(Constants.idTokenKey, requestInfo.parameters[Constants.idToken]);
                                scope = this.clientId;
                                if (!this.hasScope(scope)) {
                                    keys = this._cacheStorage.getItem(Constants.tokenKeys) || '';
                                    this._cacheStorage.saveItem(Constants.tokenKeys, keys + scope + Constants.resourceDelimeter);
                                }
                                this._cacheStorage.saveItem(Constants.accessTokenKey + scope, requestInfo.parameters[Constants.idToken]);
                                this._cacheStorage.saveItem(Constants.expirationKey + scope, this.user.profile.exp);
                            }
                        }
                        else {
                            this._cacheStorage.saveItem(Constants.error, 'invalid idToken');
                            this._cacheStorage.saveItem(Constants.errorDescription, 'Invalid idToken. idToken: ' + requestInfo.parameters[Constants.idToken]);
                        }
                    }
                }
                else {
                    this._cacheStorage.saveItem(Constants.error, 'Invalid_state');
                    this._cacheStorage.saveItem(Constants.errorDescription, 'Invalid_state. state: ' + requestInfo.stateResponse);
                }
            }
            this._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCompleted);
        };
        ;
        UserAgentApplication.prototype.isCallback = function (hash) {
            hash = this.getHash(hash);
            var parameters = Utils.deserialize(hash);
            return (parameters.hasOwnProperty(Constants.errorDescription) ||
                parameters.hasOwnProperty(Constants.accessToken) ||
                parameters.hasOwnProperty(Constants.idToken));
        };
        UserAgentApplication.prototype.getHash = function (hash) {
            if (hash.indexOf('#/') > -1) {
                hash = hash.substring(hash.indexOf('#/') + 2);
            }
            else if (hash.indexOf('#') > -1) {
                hash = hash.substring(1);
            }
            return hash;
        };
        ;
        UserAgentApplication.prototype.getRequestInfo = function (hash) {
            hash = this.getHash(hash);
            var parameters = Utils.deserialize(hash);
            var requestInfo = new RequestInfo();
            if (parameters) {
                requestInfo.parameters = parameters;
                if (parameters.hasOwnProperty(Constants.errorDescription) ||
                    parameters.hasOwnProperty(Constants.accessToken) ||
                    parameters.hasOwnProperty(Constants.idToken)) {
                    requestInfo.valid = true;
                    var stateResponse = '';
                    if (parameters.hasOwnProperty('state')) {
                        stateResponse = parameters.state;
                    }
                    else {
                        return requestInfo;
                    }
                    requestInfo.stateResponse = stateResponse;
                    if (stateResponse === this._cacheStorage.getItem(Constants.stateLogin)) {
                        requestInfo.requestType = Constants.login;
                        requestInfo.stateMatch = true;
                        return requestInfo;
                    }
                    else if (stateResponse === this._cacheStorage.getItem(Constants.stateAcquireToken)) {
                        requestInfo.requestType = Constants.renewToken;
                        requestInfo.stateMatch = true;
                        return requestInfo;
                    }
                    if (!requestInfo.stateMatch && window.parent && window.parent.MSAL) {
                        var clientApplication = window.parent.MSAL;
                        var statesInParentContext = clientApplication._renewStates;
                        for (var i = 0; i < statesInParentContext.length; i++) {
                            if (statesInParentContext[i] === requestInfo.stateResponse) {
                                requestInfo.requestType = Constants.renewToken;
                                requestInfo.stateMatch = true;
                                break;
                            }
                        }
                    }
                }
            }
            return requestInfo;
        };
        ;
        UserAgentApplication.prototype.getScopeFromState = function (state) {
            if (state) {
                var splitIndex = state.indexOf('|');
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return '';
        };
        ;
        UserAgentApplication.prototype.createUser = function (idToken) {
            var user;
            var parsedJson = Utils.extractIdToken(idToken);
            if (parsedJson && parsedJson.hasOwnProperty('aud')) {
                if (parsedJson.aud.toLowerCase() === this.clientId.toLowerCase()) {
                    user = {
                        username: '',
                        profile: parsedJson
                    };
                    if (parsedJson.hasOwnProperty('preferred_username')) {
                        user.username = parsedJson.preferred_username;
                    }
                    else if (parsedJson.hasOwnProperty('email')) {
                        user.username = parsedJson.email;
                    }
                }
                else {
                }
            }
            return user;
        };
        ;
        return UserAgentApplication;
    }());
    MSAL.UserAgentApplication = UserAgentApplication;
    var User = (function () {
        function User() {
        }
        return User;
    }());
    var RequestInfo = (function () {
        function RequestInfo() {
            this.valid = false;
            this.parameters = {};
            this.stateMatch = false;
            this.stateResponse = '';
            this.requestType = 'unknown';
        }
        return RequestInfo;
    }());
    var AccessTokenCacheItem = (function () {
        function AccessTokenCacheItem(key, value) {
            this.key = key;
            this.value = value;
        }
        return AccessTokenCacheItem;
    }());
    var AccessTokenValue = (function () {
        function AccessTokenValue(accessToken, expiresIn) {
            this.AccessToken = accessToken;
            this.ExpiresIn = expiresIn;
        }
        return AccessTokenValue;
    }());
    var AccessTokenKey = (function () {
        function AccessTokenKey(authority, clientId, user, scopes) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.user = user;
        }
        return AccessTokenKey;
    }());
    var AuthenticationRequestParameters = (function () {
        function AuthenticationRequestParameters(authority, clientId, scope, responseType, redirectUri) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scope;
            this.responseType = responseType;
            this.redirectUri = redirectUri;
            if (responseType !== "token") {
                this.nonce = Utils.Guid();
            }
            this.correlationId = Utils.Guid();
            this.state = Utils.Guid();
            this.nonce = Utils.Guid();
            this.xClientSku = "Js";
            this.xClientVer = Utils.GetLibraryVersion();
        }
        AuthenticationRequestParameters.prototype.CreateNavigateUrl = function (scopes) {
            if (!scopes)
                scopes = [this.clientId];
            var requestUrl = "";
            var str = [];
            str.push('?response_type=' + this.responseType);
            if (this.responseType === ResponseTypes[ResponseTypes.id_token]) {
                if (scopes.indexOf(this.clientId) > -1) {
                    this.translateclientIdUsedInScope(scopes);
                }
            }
            str.push('scope=' + encodeURIComponent(this.parseScope(scopes)));
            str.push('client_id=' + encodeURIComponent(this.clientId));
            str.push('redirect_uri=' + encodeURIComponent(this.redirectUri));
            str.push('state=' + encodeURIComponent(this.state));
            str.push('nonce=' + encodeURIComponent(this.nonce));
            if (this.extraQueryParameters) {
                str.push(this.extraQueryParameters);
            }
            str.push('client-request-id=' + encodeURIComponent(this.correlationId));
            requestUrl = this.authority + '/oauth2/v2.0/authorize' + str.join('&') + "&x-client-SKU=" + this.xClientSku + "&x-client-Ver=" + this.xClientVer;
            return requestUrl;
        };
        AuthenticationRequestParameters.prototype.translateclientIdUsedInScope = function (scopes) {
            var clientIdIndex = scopes.indexOf(this.clientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                scopes.push('openid');
                scopes.push('profile');
            }
        };
        AuthenticationRequestParameters.prototype.parseScope = function (scopes) {
            var scopeList = '';
            if (scopes) {
                for (var i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + ' ' : scopes[i];
                }
            }
            return scopeList;
        };
        return AuthenticationRequestParameters;
    }());
    var Storage = (function () {
        function Storage(cacheLocation) {
            this._cacheLocation = cacheLocation;
            this._localStorageSupported = typeof window[this._cacheLocation] != "undefined" && window[this._cacheLocation] != null;
            this._sessionStorageSupported = typeof window[cacheLocation] != "undefined" && window[cacheLocation] != null;
            if (!this._localStorageSupported && !this._sessionStorageSupported)
                throw new Error('localStorage and sessionStorage not supported');
        }
        Storage.prototype.saveItem = function (key, value) {
            if (window[this._cacheLocation])
                window[this._cacheLocation].setItem(key, value);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        };
        Storage.prototype.getItem = function (key) {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].getItem(key);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        };
        Storage.prototype.removeItem = function (key) {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].removeItem(key);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        };
        Storage.prototype.clear = function () {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].clear();
            else
                throw new Error('localStorage and sessionStorage are not supported');
        };
        Storage.prototype.getAllAccessTokens = function (clientId, authority) {
            var key;
            var results = [];
            var accessTokenCacheItem;
            var storage = window[this._cacheLocation];
            if (storage) {
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(authority)) {
                            var value = this.getItem(key);
                            accessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                            results.push(accessTokenCacheItem);
                        }
                    }
                }
            }
            else
                throw new Error('localStorage and sessionStorage are not supported');
            return results;
        };
        return Storage;
    }());
    var Logger = (function () {
        function Logger() {
        }
        Logger.log = function (level, message, error) {
            if (level <= Logging._logLevel) {
                var timestamp = new Date().toUTCString();
                var formattedMessage = '';
                if (Logging._correlationId)
                    formattedMessage = timestamp + ':' + Logging._correlationId + '-' + this.libVersion() + '-' + LoggingLevel[level] + ' ' + message;
                else
                    formattedMessage = timestamp + ':' + this.libVersion() + '-' + LoggingLevel[level] + ' ' + message;
                if (error) {
                    formattedMessage += '\nstack:\n' + error;
                }
                if (Logging._loginCallback)
                    Logging._loginCallback(formattedMessage);
            }
        };
        Logger.error = function (message, error) {
            this.log(LoggingLevel.ERROR, message, error);
        };
        Logger.warn = function (message) {
            this.log(LoggingLevel.WARN, message, null);
        };
        Logger.info = function (message) {
            this.log(LoggingLevel.INFO, message, null);
        };
        Logger.verbose = function (message) {
            this.log(LoggingLevel.VERBOSE, message, null);
        };
        Logger.libVersion = function () {
            return '1.0.0';
        };
        return Logger;
    }());
    var Utils = (function () {
        function Utils() {
        }
        Utils.expiresIn = function (expires) {
            if (!expires)
                expires = '3599';
            return this.now() + parseInt(expires, 10);
        };
        ;
        Utils.now = function () {
            return Math.round(new Date().getTime() / 1000.0);
        };
        ;
        Utils.isEmpty = function (str) {
            return (typeof str === 'undefined' || !str || 0 === str.length);
        };
        ;
        Utils.extractIdToken = function (encodedIdToken) {
            var decodedToken = this.decodeJwt(encodedIdToken);
            if (!decodedToken) {
                return null;
            }
            try {
                var base64IdToken = decodedToken.JWSPayload;
                var base64Decoded = this.base64DecodeStringUrlSafe(base64IdToken);
                if (!base64Decoded) {
                    Logger.info('The returned id_token could not be base64 url safe decoded.');
                    return null;
                }
                return JSON.parse(base64Decoded);
            }
            catch (err) {
                Logger.error('The returned id_token could not be decoded', err);
            }
            return null;
        };
        ;
        Utils.base64DecodeStringUrlSafe = function (base64IdToken) {
            base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken));
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        };
        ;
        Utils.decode = function (base64IdToken) {
            var codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            base64IdToken = String(base64IdToken).replace(/=+$/, '');
            var length = base64IdToken.length;
            if (length % 4 === 1) {
                throw new Error('The token to be decoded is not correctly encoded.');
            }
            var h1, h2, h3, h4, bits, c1, c2, c3, decoded = '';
            for (var i = 0; i < length; i += 4) {
                h1 = codes.indexOf(base64IdToken.charAt(i));
                h2 = codes.indexOf(base64IdToken.charAt(i + 1));
                h3 = codes.indexOf(base64IdToken.charAt(i + 2));
                h4 = codes.indexOf(base64IdToken.charAt(i + 3));
                if (i + 2 === length - 1) {
                    bits = h1 << 18 | h2 << 12 | h3 << 6;
                    c1 = bits >> 16 & 255;
                    c2 = bits >> 8 & 255;
                    decoded += String.fromCharCode(c1, c2);
                    break;
                }
                else if (i + 1 === length - 1) {
                    bits = h1 << 18 | h2 << 12;
                    c1 = bits >> 16 & 255;
                    decoded += String.fromCharCode(c1);
                    break;
                }
                bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
                c1 = bits >> 16 & 255;
                c2 = bits >> 8 & 255;
                c3 = bits & 255;
                decoded += String.fromCharCode(c1, c2, c3);
            }
            return decoded;
        };
        ;
        Utils.decodeJwt = function (jwtToken) {
            if (this.isEmpty(jwtToken)) {
                return null;
            }
            ;
            var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
            var matches = idTokenPartsRegex.exec(jwtToken);
            if (!matches || matches.length < 4) {
                Logger.warn('The returned id_token is not parseable.');
                return null;
            }
            var crackedToken = {
                header: matches[1],
                JWSPayload: matches[2],
                JWSSig: matches[3]
            };
            return crackedToken;
        };
        ;
        Utils.deserialize = function (query) {
            var match, pl = /\+/g, search = /([^&=]+)=([^&]*)/g, decode = function (s) {
                return decodeURIComponent(s.replace(pl, ' '));
            }, obj = {};
            match = search.exec(query);
            while (match) {
                obj[decode(match[1])] = decode(match[2]);
                match = search.exec(query);
            }
            return obj;
        };
        ;
        Utils.isIntersectingScopes = function (cachedScopes, scopes) {
            for (var i = 0; i < scopes.length; i++) {
                if (cachedScopes.indexOf(scopes[i]) > -1)
                    return true;
            }
            return false;
        };
        Utils.containsScope = function (cachedScopes, scopes) {
            return scopes.every(function (value) {
                return cachedScopes.indexOf(value) >= 0;
            });
        };
        Utils.DecimalToHex = function (num) {
            var hex = num.toString(16);
            while (hex.length < 2) {
                hex = '0' + hex;
            }
            return hex;
        };
        Utils.GetLibraryVersion = function () {
            return "0.1";
        };
        Utils.Guid = function () {
            var cryptoObj = window.crypto;
            if (cryptoObj && cryptoObj.getRandomValues) {
                var buffer = new Uint8Array(16);
                cryptoObj.getRandomValues(buffer);
                buffer[6] |= 0x40;
                buffer[6] &= 0x4f;
                buffer[8] |= 0x80;
                buffer[8] &= 0xbf;
                return this.DecimalToHex(buffer[0]) + this.DecimalToHex(buffer[1])
                    + this.DecimalToHex(buffer[2]) + this.DecimalToHex(buffer[3])
                    + '-' + this.DecimalToHex(buffer[4]) + this.DecimalToHex(buffer[5])
                    + '-' + this.DecimalToHex(buffer[6]) + this.DecimalToHex(buffer[7])
                    + '-' + this.DecimalToHex(buffer[8]) + this.DecimalToHex(buffer[9])
                    + '-' + this.DecimalToHex(buffer[10]) + this.DecimalToHex(buffer[11])
                    + this.DecimalToHex(buffer[12]) + this.DecimalToHex(buffer[13])
                    + this.DecimalToHex(buffer[14]) + this.DecimalToHex(buffer[15]);
            }
            else {
                var guidHolder = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
                var hex = '0123456789abcdef';
                var r = 0;
                var guidResponse = "";
                for (var i = 0; i < 36; i++) {
                    if (guidHolder[i] !== '-' && guidHolder[i] !== '4') {
                        r = Math.random() * 16 | 0;
                    }
                    if (guidHolder[i] === 'x') {
                        guidResponse += hex[r];
                    }
                    else if (guidHolder[i] === 'y') {
                        r &= 0x3;
                        r |= 0x8;
                        guidResponse += hex[r];
                    }
                    else {
                        guidResponse += guidHolder[i];
                    }
                }
                return guidResponse;
            }
        };
        ;
        return Utils;
    }());
})(MSAL || (MSAL = {}));
//# sourceMappingURL=msaljs.js.map