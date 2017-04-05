var MSAL;
(function (MSAL) {
    class AccessTokenCacheItem {
        constructor(key, value) {
            this.key = key;
            this.value = value;
        }
    }
    MSAL.AccessTokenCacheItem = AccessTokenCacheItem;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class AccessTokenKey {
        constructor(authority, clientId, scopes, userIdentifier) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.userIdentifier = userIdentifier;
        }
    }
    MSAL.AccessTokenKey = AccessTokenKey;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class AccessTokenValue {
        constructor(accessToken, expiresIn) {
            this.AccessToken = accessToken;
            this.ExpiresIn = expiresIn;
        }
    }
    MSAL.AccessTokenValue = AccessTokenValue;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    (function (ResponseTypes) {
        ResponseTypes[ResponseTypes["id_token"] = 0] = "id_token";
        ResponseTypes[ResponseTypes["token"] = 1] = "token";
    })(MSAL.ResponseTypes || (MSAL.ResponseTypes = {}));
    var ResponseTypes = MSAL.ResponseTypes;
    class AuthenticationRequestParameters {
        constructor(authority, clientId, scope, responseType, redirectUri) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scope;
            this.responseType = responseType;
            this.redirectUri = redirectUri;
            if (responseType !== "token") {
                this.nonce = MSAL.Utils.CreateNewGuid();
            }
            this.correlationId = MSAL.Utils.CreateNewGuid();
            this.state = MSAL.Utils.CreateNewGuid();
            this.nonce = MSAL.Utils.CreateNewGuid();
            this.xClientSku = "Js";
            this.xClientVer = MSAL.Utils.GetLibraryVersion();
        }
        CreateNavigateUrl(scopes) {
            if (!scopes) {
                scopes = [this.clientId];
            }
            let requestUrl = "";
            let str = [];
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
        }
        translateclientIdUsedInScope(scopes) {
            var clientIdIndex = scopes.indexOf(this.clientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                scopes.push('openid');
                scopes.push('profile');
            }
        }
        parseScope(scopes) {
            var scopeList = '';
            if (scopes) {
                for (var i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + ' ' : scopes[i];
                }
            }
            return scopeList;
        }
    }
    MSAL.AuthenticationRequestParameters = AuthenticationRequestParameters;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class Constants {
        static get errorDescription() { return "error_description"; }
        static get idToken() { return "id_token"; }
        static get accessToken() { return "access_token"; }
        static get expiresIn() { return "expires_in"; }
        static get sessionState() { return "session_state"; }
        static get tokenKeys() { return "msal.token.keys"; }
        static get accessTokenKey() { return "msal.access.token.key"; }
        static get expirationKey() { return "msal.expiration.key"; }
        static get stateLogin() { return "msal.state.login"; }
        static get stateAcquireToken() { return "msal.state.acquireToken"; }
        static get stateRenew() { return "msal.state.renew"; }
        static get nonceIdToken() { return "msal.nonce.idtoken"; }
        static get userName() { return "msal.username"; }
        static get idTokenKey() { return "msal.idtoken"; }
        static get error() { return "msal.error"; }
        static get loginRequest() { return "msal.login.request"; }
        static get loginError() { return "msal.login.error"; }
        static get renewStatus() { return "msal.token.renew.status"; }
        static get resourceDelimeter() { return "|"; }
        static get loadFrameTimeout() {
            return this._loadFrameTimeout;
        }
        ;
        static set loadFrameTimeout(timeout) {
            this._loadFrameTimeout = timeout;
        }
        ;
        static get tokenRenewStatusCancelled() { return "Canceled"; }
        static get tokenRenewStatusCompleted() { return "Completed"; }
        static get tokenRenewStatusInProgress() { return "In Progress"; }
        static get popUpWidth() { return this._popUpWidth; }
        static set popUpWidth(width) {
            this._popUpWidth = width;
        }
        ;
        static get popUpHeight() { return this._popUpHeight; }
        static set popUpHeight(height) {
            this._popUpHeight = height;
        }
        ;
        static get login() { return "LOGIN"; }
        static get renewToken() { return "renewToken"; }
        static get unknown() { return "UNKNOWN"; }
    }
    Constants._loadFrameTimeout = 6000;
    Constants._popUpWidth = 483;
    Constants._popUpHeight = 600;
    MSAL.Constants = Constants;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    (function (LogLevel) {
        LogLevel[LogLevel["Error"] = 0] = "Error";
        LogLevel[LogLevel["Warning"] = 1] = "Warning";
        LogLevel[LogLevel["Info"] = 2] = "Info";
        LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
    })(MSAL.LogLevel || (MSAL.LogLevel = {}));
    var LogLevel = MSAL.LogLevel;
    class Logger {
        constructor(correlationId) {
            this._level = LogLevel.Info;
            this._piiLoggingEnabled = false;
            if (Logger._instance) {
                return Logger._instance;
            }
            this._correlationId = correlationId;
            Logger._instance = this;
        }
        get correlationId() { return this._correlationId; }
        set correlationId(correlationId) {
            this._correlationId = correlationId;
        }
        ;
        get level() { return this._level; }
        set level(logLevel) {
            if (LogLevel[logLevel]) {
                this._level = logLevel;
            }
            else
                throw new Error("Provide a valid value for level. Possibles range for logLevel is 0-3");
        }
        ;
        get piiLoggingEnabled() { return this._piiLoggingEnabled; }
        set piiLoggingEnabled(piiLoggingEnabled) {
            this._piiLoggingEnabled = piiLoggingEnabled;
        }
        ;
        get localCallback() { return this._localCallback; }
        set localCallback(localCallback) {
            if (this.localCallback) {
                throw new Error("MSAL logging callback can only be set once per process and should never change once set.");
            }
            this._localCallback = localCallback;
        }
        ;
        LogMessage(logMessage, logLevel, containsPii) {
            if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
                return;
            }
            var timestamp = new Date().toUTCString();
            var log = '';
            if (!MSAL.Utils.isEmpty(this.correlationId)) {
                log = timestamp + ':' + this._correlationId + '-' + MSAL.Utils.GetLibraryVersion() + '-' + LogLevel[logLevel] + ' ' + logMessage;
            }
            else {
                log = timestamp + ':' + MSAL.Utils.GetLibraryVersion() + '-' + LogLevel[logLevel] + ' ' + logMessage;
            }
            this.executeCallback(logLevel, log, containsPii);
        }
        executeCallback(level, message, containsPii) {
            if (this.localCallback) {
                this.localCallback(level, message, containsPii);
            }
        }
        error(message) {
            this.LogMessage(message, LogLevel.Error, false);
        }
        errorPii(message) {
            this.LogMessage(message, LogLevel.Error, true);
        }
        warning(message) {
            this.LogMessage(message, LogLevel.Warning, false);
        }
        warningPii(message) {
            this.LogMessage(message, LogLevel.Warning, true);
        }
        info(message) {
            this.LogMessage(message, LogLevel.Info, false);
        }
        infoPii(message) {
            this.LogMessage(message, LogLevel.Info, true);
        }
        verbose(message) {
            this.LogMessage(message, LogLevel.Verbose, false);
        }
        verbosePii(message) {
            this.LogMessage(message, LogLevel.Verbose, true);
        }
    }
    MSAL.Logger = Logger;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class RequestContext {
        constructor(correlationId) {
            if (RequestContext._instance) {
                return RequestContext._instance;
            }
            this._logger = new MSAL.Logger(correlationId);
            this._correlationId = this._logger.correlationId;
            RequestContext._instance = this;
        }
        get correlationId() { return this._correlationId; }
        get logger() { return this._logger; }
    }
    MSAL.RequestContext = RequestContext;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class RequestInfo {
        constructor() {
            this.valid = false;
            this.parameters = {};
            this.stateMatch = false;
            this.stateResponse = '';
            this.requestType = 'unknown';
        }
    }
    MSAL.RequestInfo = RequestInfo;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class Storage {
        constructor(cacheLocation) {
            if (Storage._instance) {
                return Storage._instance;
            }
            this._cacheLocation = cacheLocation;
            this._localStorageSupported = typeof window[this._cacheLocation] != "undefined" && window[this._cacheLocation] != null;
            this._sessionStorageSupported = typeof window[cacheLocation] != "undefined" && window[cacheLocation] != null;
            Storage._instance = this;
            if (!this._localStorageSupported && !this._sessionStorageSupported)
                throw new Error('localStorage and sessionStorage not supported');
        }
        saveItem(key, value) {
            if (window[this._cacheLocation])
                window[this._cacheLocation].setItem(key, value);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }
        getItem(key) {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].getItem(key);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }
        removeItem(key) {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].removeItem(key);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }
        clear() {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].clear();
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }
        getAllAccessTokens(clientId, authority) {
            let key;
            let results = [];
            let accessTokenCacheItem;
            let storage = window[this._cacheLocation];
            if (storage) {
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(authority)) {
                            let value = this.getItem(key);
                            accessTokenCacheItem = new MSAL.AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                            results.push(accessTokenCacheItem);
                        }
                    }
                }
            }
            else
                throw new Error('localStorage and sessionStorage are not supported');
            return results;
        }
    }
    MSAL.Storage = Storage;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class UserAgentApplication {
        constructor(clientId, authority, userCallback) {
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
            this._cacheStorage = new MSAL.Storage(this._cacheLocation);
            this._requestContext = new MSAL.RequestContext('');
            window.MSAL = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
        }
        get cacheLocation() {
            return this._cacheLocation;
        }
        set cacheLocation(cache) {
            this._cacheLocation = cache;
            if (this._cacheLocations[cache])
                this._cacheStorage = new MSAL.Storage(this._cacheLocations[cache]);
            else
                throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
        }
        get interactionMode() {
            return this._interactionMode;
        }
        set interactionMode(mode) {
            if (this._interactionModes[mode])
                this._interactionMode = this._interactionModes[mode];
            else
                throw new Error('Interantion mode is not valid. Provided value:' + this._interactionMode + '.Possible values are: ' + this._interactionModes.redirect + ',' + this._interactionModes.popUp);
        }
        login() {
            if (this._loginInProgress) {
                return;
            }
            let authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, null, MSAL.ResponseTypes[MSAL.ResponseTypes.id_token], this.redirectUri);
            this._cacheStorage.saveItem(MSAL.Constants.loginRequest, window.location.href);
            this._cacheStorage.saveItem(MSAL.Constants.loginError, '');
            this._cacheStorage.saveItem(MSAL.Constants.stateLogin, authenticationRequest.state);
            this._cacheStorage.saveItem(MSAL.Constants.nonceIdToken, authenticationRequest.nonce);
            this._cacheStorage.saveItem(MSAL.Constants.error, '');
            this._cacheStorage.saveItem(MSAL.Constants.errorDescription, '');
            let urlNavigate = authenticationRequest.CreateNavigateUrl(null);
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
        }
        openConsentWindow(urlNavigate, title, interval, instance, callback) {
            let popupWindow = this.openPopup(urlNavigate, title, MSAL.Constants.popUpWidth, MSAL.Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
                this._requestContext.logger.info('Popup Window is null. This can happen if you are using IE');
                this._cacheStorage.saveItem(MSAL.Constants.error, 'Error opening popup');
                this._cacheStorage.saveItem(MSAL.Constants.errorDescription, 'Popup Window is null. This can happen if you are using IE');
                this._cacheStorage.saveItem(MSAL.Constants.loginError, 'Popup Window is null. This can happen if you are using IE');
                if (callback) {
                    callback(this._cacheStorage.getItem(MSAL.Constants.loginError), null, null);
                }
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
                        self._requestContext.logger.info("Closing popup window");
                        popupWindow.close();
                    }
                }
                catch (e) {
                }
            }, interval);
        }
        logout() {
            this.clearCache();
            this.user = null;
            var logout = '';
            if (this.postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.postLogoutredirectUri);
            }
            let urlNavigate = this.authority + '/oauth2/v2.0/logout?' + logout;
            if (urlNavigate) {
                window.location.replace(urlNavigate);
            }
        }
        clearCache() {
            this._cacheStorage.saveItem(MSAL.Constants.sessionState, '');
            this._cacheStorage.saveItem(MSAL.Constants.stateLogin, '');
            this._renewStates = [];
            this._cacheStorage.saveItem(MSAL.Constants.idTokenKey, '');
            this._cacheStorage.saveItem(MSAL.Constants.error, '');
            this._cacheStorage.saveItem(MSAL.Constants.errorDescription, '');
            var keys = this._cacheStorage.getItem(MSAL.Constants.tokenKeys);
            if (!MSAL.Utils.isEmpty(keys)) {
                let keysArray = keys.split(MSAL.Constants.resourceDelimeter);
                for (var i = 0; i < keysArray.length - 1; i++) {
                    this._cacheStorage.saveItem(MSAL.Constants.accessTokenKey + keysArray[i], '');
                    this._cacheStorage.saveItem(MSAL.Constants.expirationKey + keysArray[i], '0');
                }
            }
            this._cacheStorage.saveItem(MSAL.Constants.tokenKeys, '');
        }
        openPopup(urlNavigate, title, popUpWidth, popUpHeight) {
            try {
                let winLeft = window.screenLeft ? window.screenLeft : window.screenX;
                let winTop = window.screenTop ? window.screenTop : window.screenY;
                let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                let left = ((width / 2) - (popUpWidth / 2)) + winLeft;
                let top = ((height / 2) - (popUpHeight / 2)) + winTop;
                let popupWindow = window.open(urlNavigate, title, 'width=' + popUpWidth + ', height=' + popUpHeight + ', top=' + top + ', left=' + left);
                if (popupWindow.focus) {
                    popupWindow.focus();
                }
                return popupWindow;
            }
            catch (e) {
                this._requestContext.logger.error('error opening popup ' + e.message);
                this._loginInProgress = false;
                return null;
            }
        }
        validateInputScope(scopes) {
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
                if (scopes.length > 1)
                    throw new Error('Client Id can only be provided as a single scope');
            }
        }
        registerCallback(expectedState, scope, callback) {
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
                            self._requestContext.logger.warning(error);
                        }
                    }
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        }
        getCachedToken(scopes) {
            let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, this.authority);
            let accessTokenItems = [];
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                let accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.userIdentifier === this.user.profile.oid) {
                    let cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                    if (MSAL.Utils.containsScope(cachedScopes, scopes))
                        accessTokenItems.push(accessTokenCacheItem);
                }
            }
            if (accessTokenItems.length === 0 || accessTokenCacheItems.length > 1)
                return null;
            else {
                let accessTokenCacheItem = accessTokenItems[0];
                var expired = Number(accessTokenCacheItem.value.ExpiresIn);
                var offset = this._clockSkew || 300;
                if (expired && (expired > MSAL.Utils.now() + offset))
                    return accessTokenCacheItem.value.AccessToken;
                else {
                    this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[0].key));
                    return null;
                }
            }
        }
        addHintParameters(urlNavigate, loginHint) {
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
        }
        urlContainsQueryStringParameter(name, url) {
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }
        acquireToken(scopes, callback, loginHint, extraQueryParameters) {
            if (this._acquireTokenInProgress) {
                return;
            }
            this.validateInputScope(scopes);
            let scope = scopes.join(' ');
            if (!this.user) {
                callback('user login is required', null, null);
                return;
            }
            this._acquireTokenInProgress = true;
            let authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, MSAL.ResponseTypes[MSAL.ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes);
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
                    this._cacheStorage.saveItem(MSAL.Constants.stateAcquireToken, authenticationRequest.state);
                    window.location.replace(urlNavigate);
                }
            }
        }
        acquireTokenSilent(scopes, callback) {
            this.validateInputScope(scopes);
            var token = this.getCachedToken(scopes);
            let scope = scopes.join(' ');
            if (token) {
                this._requestContext.logger.warning('Token is already in cache for scope:' + scope);
                callback(null, token, null);
                return;
            }
            if (!this.user) {
                callback('user login is required', null, null);
                return;
            }
            if (this._activeRenewals[scope]) {
                this.registerCallback(this._activeRenewals[scope], scope, callback);
            }
            else {
                if (!MSAL.Utils.isEmpty(scope) && scope.indexOf(this.clientId) > -1) {
                    this._requestContext.logger.verbose('renewing idToken');
                    this.renewIdToken(scopes, callback);
                }
                else {
                    this._requestContext.logger.verbose('renewing accesstoken');
                    this.renewToken(scopes, callback);
                }
            }
        }
        loadFrameTimeout(urlNavigate, frameName, scope) {
            this._requestContext.logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.saveItem(MSAL.Constants.renewStatus + scope, MSAL.Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            var self = this;
            setTimeout(function () {
                if (self._cacheStorage.getItem(MSAL.Constants.renewStatus + scope) === MSAL.Constants.tokenRenewStatusInProgress) {
                    this._requestContext.logger.verbose('Loading frame has timed out after: ' + (MSAL.Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    var expectedState = self._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState])
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null);
                    self._cacheStorage.saveItem(MSAL.Constants.renewStatus + scope, MSAL.Constants.tokenRenewStatusCancelled);
                }
            }, MSAL.Constants.loadFrameTimeout);
        }
        loadFrame(urlNavigate, frameName) {
            var self = this;
            this._requestContext.logger.info('LoadFrame: ' + frameName);
            var frameCheck = frameName;
            setTimeout(function () {
                var frameHandle = self.addAdalFrame(frameCheck);
                if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                    frameHandle.src = urlNavigate;
                    self.loadFrame(urlNavigate, frameCheck);
                }
            }, 500);
        }
        addAdalFrame(iframeId) {
            if (typeof iframeId === 'undefined') {
                return;
            }
            this._requestContext.logger.info('Add msal frame to document:' + iframeId);
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
        }
        renewToken(scopes, callback) {
            var scope = scopes.join(' ');
            this._requestContext.logger.verbose('renewToken is called for scope:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            let authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, MSAL.ResponseTypes[MSAL.ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            this._renewStates.push(authenticationRequest.state);
            this._requestContext.logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.registerCallback(authenticationRequest.state, scope, callback);
            this._requestContext.logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        }
        renewIdToken(scopes, callback) {
            this._requestContext.logger.info('renewidToken is called');
            let frameHandle = this.addAdalFrame('adalIdTokenFrame');
            let authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, MSAL.ResponseTypes[MSAL.ResponseTypes.id_token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + this.clientId;
            this._cacheStorage.saveItem(MSAL.Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, callback);
            this._requestContext.logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.clientId);
        }
        hasScope(key) {
            var keys = this._cacheStorage.getItem(MSAL.Constants.tokenKeys);
            return keys && !MSAL.Utils.isEmpty(keys) && (keys.indexOf(key + MSAL.Constants.resourceDelimeter) > -1);
        }
        ;
        getUser() {
            if (this.user) {
                return this.user;
            }
            var idToken = this._cacheStorage.getItem(MSAL.Constants.idTokenKey);
            if (!MSAL.Utils.isEmpty(idToken)) {
                this.user = this.createUser(idToken);
                return this.user;
            }
            return null;
        }
        ;
        handleAuthenticationResponse(hash) {
            if (hash == null) {
                hash = window.location.hash;
            }
            if (this.isCallback(hash)) {
                let requestInfo = this.getRequestInfo(hash);
                this._requestContext.logger.info('Returned from redirect url');
                this.saveTokenFromHash(requestInfo);
                let token = null, callback = null;
                if ((requestInfo.requestType === MSAL.Constants.renewToken) && window.parent) {
                    if (window.parent !== window)
                        this._requestContext.logger.verbose('Window is in iframe, acquiring token silently');
                    else
                        this._requestContext.logger.verbose('acquiring token interactive in progress');
                    if (window.parent.callBackMappedToRenewStates[requestInfo.stateResponse])
                        callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    else
                        callback = this._userCallback;
                    token = requestInfo.parameters[MSAL.Constants.accessToken] || requestInfo.parameters[MSAL.Constants.idToken];
                }
                else if (requestInfo.requestType === MSAL.Constants.login) {
                    callback = this._userCallback;
                    token = requestInfo.parameters[MSAL.Constants.idToken];
                }
                try {
                    if (callback)
                        callback(this._cacheStorage.getItem(MSAL.Constants.errorDescription), token, this._cacheStorage.getItem(MSAL.Constants.error));
                }
                catch (err) {
                    this._requestContext.logger.error('Error occurred in user defined callback function: ' + err);
                }
                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = '';
                    if (this.navigateToLoginRequestUrl && window.location.href.replace('#', '') !== this._cacheStorage.getItem(MSAL.Constants.loginRequest))
                        window.location.href = this._cacheStorage.getItem(MSAL.Constants.loginRequest);
                }
            }
        }
        saveAccessToken(requestInfo) {
            if (requestInfo.parameters.hasOwnProperty('scope')) {
                this.user = this.getUser();
                let scopes = requestInfo.parameters['scope'];
                let consentedScopes = scopes.split(' ');
                let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, this.authority);
                for (let i = 0; i < accessTokenCacheItems.length; i++) {
                    let accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.userIdentifier === this.user.profile.oid) {
                        var cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                        if (MSAL.Utils.isIntersectingScopes(cachedScopes, consentedScopes))
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
                let accessTokenKey = new MSAL.AccessTokenKey(this.authority, this.clientId, scopes, this.user.profile.oid);
                let accessTokenValue = new MSAL.AccessTokenValue(requestInfo.parameters[MSAL.Constants.accessToken], MSAL.Utils.expiresIn(requestInfo.parameters[MSAL.Constants.expiresIn]).toString());
                this._cacheStorage.saveItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
        }
        saveTokenFromHash(requestInfo) {
            this._requestContext.logger.info('State status:' + requestInfo.stateMatch + '; Request type:' + requestInfo.requestType);
            this._cacheStorage.saveItem(MSAL.Constants.error, '');
            this._cacheStorage.saveItem(MSAL.Constants.errorDescription, '');
            var scope = this.getScopeFromState(requestInfo.stateResponse);
            if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.errorDescription)) {
                this._requestContext.logger.info('Error :' + requestInfo.parameters[MSAL.Constants.error] + '; Error description:' + requestInfo.parameters[MSAL.Constants.errorDescription]);
                this._cacheStorage.saveItem(MSAL.Constants.error, requestInfo.parameters["error"]);
                this._cacheStorage.saveItem(MSAL.Constants.errorDescription, requestInfo.parameters[MSAL.Constants.errorDescription]);
                if (requestInfo.requestType === MSAL.Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.saveItem(MSAL.Constants.loginError, requestInfo.parameters["errorDescription"]);
                }
            }
            else {
                if (requestInfo.stateMatch) {
                    this._requestContext.logger.info('State is right');
                    if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.sessionState))
                        this._cacheStorage.saveItem(MSAL.Constants.sessionState, requestInfo.parameters[MSAL.Constants.sessionState]);
                    var keys;
                    if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.accessToken)) {
                        this._requestContext.logger.info('Fragment has access token');
                        this.saveAccessToken(requestInfo);
                    }
                    if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.idToken)) {
                        this._requestContext.logger.info('Fragment has id token');
                        this._loginInProgress = false;
                        this.user = this.createUser(requestInfo.parameters[MSAL.Constants.idToken]);
                        if (this.user && this.user.profile) {
                            if (this.user.profile.nonce !== this._cacheStorage.getItem(MSAL.Constants.nonceIdToken)) {
                                this.user = null;
                                this._cacheStorage.saveItem(MSAL.Constants.loginError, 'Nonce Mismatch.Expected: ' + this._cacheStorage.getItem(MSAL.Constants.nonceIdToken) + ',' + 'Actual: ' + this.user.profile.nonce);
                            }
                            else {
                                this._cacheStorage.saveItem(MSAL.Constants.idTokenKey, requestInfo.parameters[MSAL.Constants.idToken]);
                                scope = this.clientId;
                                if (!this.hasScope(scope)) {
                                    keys = this._cacheStorage.getItem(MSAL.Constants.tokenKeys) || '';
                                    this._cacheStorage.saveItem(MSAL.Constants.tokenKeys, keys + scope + MSAL.Constants.resourceDelimeter);
                                }
                                this._cacheStorage.saveItem(MSAL.Constants.accessTokenKey + scope, requestInfo.parameters[MSAL.Constants.idToken]);
                                this._cacheStorage.saveItem(MSAL.Constants.expirationKey + scope, this.user.profile.exp);
                            }
                        }
                        else {
                            this._cacheStorage.saveItem(MSAL.Constants.error, 'invalid idToken');
                            this._cacheStorage.saveItem(MSAL.Constants.errorDescription, 'Invalid idToken. idToken: ' + requestInfo.parameters[MSAL.Constants.idToken]);
                        }
                    }
                }
                else {
                    this._cacheStorage.saveItem(MSAL.Constants.error, 'Invalid_state');
                    this._cacheStorage.saveItem(MSAL.Constants.errorDescription, 'Invalid_state. state: ' + requestInfo.stateResponse);
                }
            }
            this._cacheStorage.saveItem(MSAL.Constants.renewStatus + scope, MSAL.Constants.tokenRenewStatusCompleted);
        }
        ;
        isCallback(hash) {
            hash = this.getHash(hash);
            var parameters = MSAL.Utils.deserialize(hash);
            return (parameters.hasOwnProperty(MSAL.Constants.errorDescription) ||
                parameters.hasOwnProperty(MSAL.Constants.accessToken) ||
                parameters.hasOwnProperty(MSAL.Constants.idToken));
        }
        getHash(hash) {
            if (hash.indexOf('#/') > -1) {
                hash = hash.substring(hash.indexOf('#/') + 2);
            }
            else if (hash.indexOf('#') > -1) {
                hash = hash.substring(1);
            }
            return hash;
        }
        ;
        getRequestInfo(hash) {
            hash = this.getHash(hash);
            let parameters = MSAL.Utils.deserialize(hash);
            let requestInfo = new MSAL.RequestInfo();
            if (parameters) {
                requestInfo.parameters = parameters;
                if (parameters.hasOwnProperty(MSAL.Constants.errorDescription) ||
                    parameters.hasOwnProperty(MSAL.Constants.accessToken) ||
                    parameters.hasOwnProperty(MSAL.Constants.idToken)) {
                    requestInfo.valid = true;
                    var stateResponse = '';
                    if (parameters.hasOwnProperty('state'))
                        stateResponse = parameters.state;
                    else
                        return requestInfo;
                    requestInfo.stateResponse = stateResponse;
                    if (stateResponse === this._cacheStorage.getItem(MSAL.Constants.stateLogin)) {
                        requestInfo.requestType = MSAL.Constants.login;
                        requestInfo.stateMatch = true;
                        return requestInfo;
                    }
                    else if (stateResponse === this._cacheStorage.getItem(MSAL.Constants.stateAcquireToken)) {
                        requestInfo.requestType = MSAL.Constants.renewToken;
                        requestInfo.stateMatch = true;
                        return requestInfo;
                    }
                    if (!requestInfo.stateMatch && window.parent && window.parent.MSAL) {
                        var clientApplication = window.parent.MSAL;
                        var statesInParentContext = clientApplication._renewStates;
                        for (var i = 0; i < statesInParentContext.length; i++) {
                            if (statesInParentContext[i] === requestInfo.stateResponse) {
                                requestInfo.requestType = MSAL.Constants.renewToken;
                                requestInfo.stateMatch = true;
                                break;
                            }
                        }
                    }
                }
            }
            return requestInfo;
        }
        ;
        getScopeFromState(state) {
            if (state) {
                var splitIndex = state.indexOf('|');
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return '';
        }
        ;
        createUser(idToken) {
            var user;
            var parsedJson = MSAL.Utils.extractIdToken(idToken);
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
                    this._requestContext.logger.warning('IdToken has invalid aud field');
                }
            }
            return user;
        }
        ;
    }
    MSAL.UserAgentApplication = UserAgentApplication;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class Utils {
        static expiresIn(expires) {
            if (!expires)
                expires = '3599';
            return this.now() + parseInt(expires, 10);
        }
        ;
        static now() {
            return Math.round(new Date().getTime() / 1000.0);
        }
        ;
        static isEmpty(str) {
            return (typeof str === 'undefined' || !str || 0 === str.length);
        }
        ;
        static extractIdToken(encodedIdToken) {
            var decodedToken = this.decodeJwt(encodedIdToken);
            if (!decodedToken) {
                return null;
            }
            try {
                var base64IdToken = decodedToken.JWSPayload;
                var base64Decoded = this.base64DecodeStringUrlSafe(base64IdToken);
                if (!base64Decoded) {
                    return null;
                }
                return JSON.parse(base64Decoded);
            }
            catch (err) {
            }
            return null;
        }
        ;
        static base64DecodeStringUrlSafe(base64IdToken) {
            base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken));
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        }
        ;
        static decode(base64IdToken) {
            var codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            base64IdToken = String(base64IdToken).replace(/=+$/, '');
            var length = base64IdToken.length;
            if (length % 4 === 1) {
                throw new Error('The token to be decoded is not correctly encoded.');
            }
            let h1, h2, h3, h4, bits, c1, c2, c3, decoded = '';
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
        }
        ;
        static decodeJwt(jwtToken) {
            if (this.isEmpty(jwtToken)) {
                return null;
            }
            ;
            var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
            var matches = idTokenPartsRegex.exec(jwtToken);
            if (!matches || matches.length < 4) {
                return null;
            }
            var crackedToken = {
                header: matches[1],
                JWSPayload: matches[2],
                JWSSig: matches[3]
            };
            return crackedToken;
        }
        ;
        static deserialize(query) {
            let match, pl = /\+/g, search = /([^&=]+)=([^&]*)/g, decode = function (s) {
                return decodeURIComponent(s.replace(pl, ' '));
            }, obj = {};
            match = search.exec(query);
            while (match) {
                obj[decode(match[1])] = decode(match[2]);
                match = search.exec(query);
            }
            return obj;
        }
        ;
        static isIntersectingScopes(cachedScopes, scopes) {
            for (let i = 0; i < scopes.length; i++) {
                if (cachedScopes.indexOf(scopes[i]) > -1)
                    return true;
            }
            return false;
        }
        static containsScope(cachedScopes, scopes) {
            return scopes.every(function (value) {
                return cachedScopes.indexOf(value) >= 0;
            });
        }
        static DecimalToHex(num) {
            var hex = num.toString(16);
            while (hex.length < 2) {
                hex = '0' + hex;
            }
            return hex;
        }
        static GetLibraryVersion() {
            return "0.1";
        }
        static CreateNewGuid() {
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
        }
        ;
    }
    MSAL.Utils = Utils;
})(MSAL || (MSAL = {}));
//# sourceMappingURL=msal.js.map