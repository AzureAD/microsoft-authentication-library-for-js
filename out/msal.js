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
        constructor(authority, clientId, scopes, uid, utid) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.userIdentifier = MSAL.Utils.base64EncodeStringUrlSafe(uid) + "." + MSAL.Utils.base64EncodeStringUrlSafe(utid);
        }
    }
    MSAL.AccessTokenKey = AccessTokenKey;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class AccessTokenValue {
        constructor(accessToken, idToken, expiresIn, clientInfo) {
            this.accessToken = accessToken;
            this.idToken = idToken;
            this.expiresIn = expiresIn;
            this.clientInfo = clientInfo;
        }
    }
    MSAL.AccessTokenValue = AccessTokenValue;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    let ResponseTypes = {
        id_token: 'id_token',
        token: "token",
        id_tokenToken: 'id_token token'
    };
    class AuthenticationRequestParameters {
        constructor(authority, clientId, scope, responseType, redirectUri) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scope;
            this.responseType = responseType;
            this.redirectUri = redirectUri;
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
            if (scopes.indexOf(this.clientId) == -1) {
                scopes.push(this.clientId);
            }
            let requestUrl = "";
            let str = [];
            str.push('?response_type=' + this.responseType);
            this.translateclientIdUsedInScope(scopes);
            str.push('scope=' + encodeURIComponent(this.parseScope(scopes)));
            str.push('client_id=' + encodeURIComponent(this.clientId));
            str.push('redirect_uri=' + encodeURIComponent(this.redirectUri));
            str.push('state=' + encodeURIComponent(this.state));
            str.push('nonce=' + encodeURIComponent(this.nonce));
            str.push('client_info=1');
            if (this.extraQueryParameters) {
                for (let i = 0; i < this.extraQueryParameters.length; i++) {
                    str.push(this.extraQueryParameters[i]);
                }
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
    class ClientInfo {
        constructor(rawClientInfo) {
            if (!rawClientInfo || MSAL.Utils.isEmpty(rawClientInfo)) {
                this.uid = '';
                this.utid = '';
                return;
            }
            try {
                let decodedClientInfo = MSAL.Utils.base64DecodeStringUrlSafe(rawClientInfo);
                let clientInfo = JSON.parse(decodedClientInfo);
                if (clientInfo) {
                    if (clientInfo.hasOwnProperty('uid')) {
                        this.uid = clientInfo.uid;
                    }
                    if (clientInfo.hasOwnProperty('utid')) {
                        this.utid = clientInfo.utid;
                    }
                }
            }
            catch (e) {
                throw new Error(e);
            }
        }
        get uid() {
            return this._uid ? this._uid : '';
        }
        set uid(uid) {
            this._uid = uid;
        }
        get utid() {
            return this._utid ? this._utid : '';
        }
        set utid(utid) {
            this._utid = utid;
        }
    }
    MSAL.ClientInfo = ClientInfo;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class Constants {
        static get errorDescription() { return "error_description"; }
        static get scope() { return "scope"; }
        static get acquireTokenUser() { return "msal_acquireTokenUser"; }
        static get clientInfo() { return "client_info"; }
        static get clientId() { return "clientId"; }
        static get authority() { return "authority"; }
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
    class IdToken {
        constructor(rawIdToken) {
            if (MSAL.Utils.isEmpty(rawIdToken)) {
                throw new Error("null or empty raw idtoken");
            }
            try {
                this._rawIdToken = rawIdToken;
                let decodedIdToken = MSAL.Utils.extractIdToken(rawIdToken);
                if (decodedIdToken) {
                    if (decodedIdToken.hasOwnProperty('iss')) {
                        this._issuer = decodedIdToken.iss;
                    }
                    if (decodedIdToken.hasOwnProperty('oid')) {
                        this._objectId = decodedIdToken.oid;
                    }
                    if (decodedIdToken.hasOwnProperty('sub')) {
                        this._subject = decodedIdToken.sub;
                    }
                    if (decodedIdToken.hasOwnProperty('tid')) {
                        this._tenantId = decodedIdToken.tid;
                    }
                    if (decodedIdToken.hasOwnProperty('ver')) {
                        this._version = decodedIdToken.ver;
                    }
                    if (decodedIdToken.hasOwnProperty('preferred_username')) {
                        this._preferredName = decodedIdToken.preferred_username;
                    }
                    if (decodedIdToken.hasOwnProperty('name')) {
                        this._name = decodedIdToken.name;
                    }
                    if (decodedIdToken.hasOwnProperty('home_oid')) {
                        this._homeObjectId = decodedIdToken.home_oid;
                    }
                    if (decodedIdToken.hasOwnProperty('nonce')) {
                        this._nonce = decodedIdToken.nonce;
                    }
                    if (decodedIdToken.hasOwnProperty('exp')) {
                        this._expiration = decodedIdToken.exp;
                    }
                }
            }
            catch (e) {
                throw new Error("Failed to parse the returned id token");
            }
        }
        get getRawIdToken() {
            return this._rawIdToken;
        }
        get issuer() {
            return this._issuer;
        }
        get objectId() {
            return this._objectId;
        }
        get subject() {
            return this._subject;
        }
        get tenant() {
            return this._tenantId;
        }
        get version() {
            return this._version;
        }
        get preferredName() {
            return this._preferredName;
        }
        get name() {
            return this._name;
        }
        get homeObjectId() {
            return this._homeObjectId;
        }
        get nonce() {
            return this._nonce;
        }
        get expiration() {
            return this._expiration;
        }
        getUniqueId() {
            return this.homeObjectId == null ? this.subject : this.objectId;
        }
    }
    MSAL.IdToken = IdToken;
    class IdTokenClaim {
        static getIssuer() { return "iss"; }
        static getobjectId() { return "oid"; }
        static getSubject() { return "sub"; }
        static getTenantId() { return "tid"; }
        static getVersion() { return "ver"; }
        static getPreferredUserName() { return "preferred_username"; }
        static getName() { return "name"; }
        static getHOmeObjectId() { return "home_oid"; }
    }
    MSAL.IdTokenClaim = IdTokenClaim;
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
        removeAcquireTokenEntries(acquireTokenUser, acquireTokenStatus) {
            let key;
            let storage = window[this._cacheLocation];
            if (storage) {
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if ((key.indexOf(acquireTokenUser) > -1) || (key.indexOf(acquireTokenStatus) > -1)) {
                            this.removeItem(key);
                        }
                    }
                }
            }
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }
        resetCacheItems() {
            let key;
            let storage = window[this._cacheLocation];
            if (storage) {
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        storage[key] = '';
                    }
                }
            }
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }
    }
    MSAL.Storage = Storage;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class Telemetry {
        constructor() {
        }
        RegisterReceiver(receiverCallback) {
            this.receiverCallback = receiverCallback;
        }
        static GetInstance() {
            return this.instance || (this.instance = new this());
        }
    }
    MSAL.Telemetry = Telemetry;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class User {
        constructor(displayableId, name, identityProvider, uid, utid) {
            this._displayableId = displayableId;
            this._name = name;
            this._identityProvider = identityProvider;
            this._uid = uid;
            this._utid = utid;
            this.userIdentifier = MSAL.Utils.base64EncodeStringUrlSafe(uid) + '.' + MSAL.Utils.base64EncodeStringUrlSafe(utid);
        }
        set displayableId(displayableId) {
            this._displayableId = displayableId;
        }
        get displayableId() {
            return this._displayableId;
        }
        get name() {
            return this._name;
        }
        get identityProvider() {
            return this._identityProvider;
        }
        get uid() {
            return this._uid;
        }
        set uid(uid) {
            this._uid = uid;
        }
        get utid() {
            return this._utid;
        }
        set utid(utid) {
            this._utid = utid;
        }
        get userIdentifier() {
            return this._userIdentifier;
        }
        set userIdentifier(userIdentifier) {
            this._userIdentifier = userIdentifier;
        }
        static createUser(idToken, clientInfo, authority) {
            let uid;
            let utid;
            if (!clientInfo) {
                uid = '';
                utid = '';
            }
            else {
                uid = clientInfo.uid;
                utid = clientInfo.utid;
            }
            authority = authority.replace('common', idToken.tenant).replace('organizations', idToken.tenant);
            return new User(idToken.preferredName, idToken.name, authority, uid, utid);
        }
    }
    MSAL.User = User;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    let ResponseTypes = {
        id_token: 'id_token',
        token: "token",
        id_token_token: 'id_token token'
    };
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
        login(extraQueryParameters) {
            if (this._loginInProgress) {
                return;
            }
            let authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, null, ResponseTypes.id_token, this.redirectUri);
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            authenticationRequest.state = authenticationRequest.state + '|' + this.clientId;
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
            this._renewStates = [];
            let accessTokenItems = this._cacheStorage.getAllAccessTokens(MSAL.Constants.clientId, MSAL.Constants.authority);
            for (let i = 0; i < accessTokenItems.length; i++) {
                this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
            }
            this._cacheStorage.removeAcquireTokenEntries(MSAL.Constants.acquireTokenUser, MSAL.Constants.renewStatus);
            this._cacheStorage.resetCacheItems();
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
                return 'Scopes cannot be passed as an empty array';
            }
            if (!Array.isArray(scopes)) {
                throw new Error('API does not accept non-array scopes');
            }
            if (scopes.indexOf('openid') > -1) {
                return 'API does not accept openid as a user- provided scope';
            }
            if (scopes.indexOf('profile') > -1) {
                return 'API does not accept profile as a user- provided scope';
            }
            if (scopes.indexOf('offline_access') > -1) {
                return 'API does not accept offline_access as a user- provided scope';
            }
            if (scopes.indexOf(this.clientId) > -1) {
                if (scopes.length > 1) {
                    return 'ClientId can only be provided as a single scope';
                }
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
                        catch (e) {
                            self._requestContext.logger.warning(e);
                        }
                    }
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        }
        getCachedToken(scopes, user) {
            let userObject = user ? user : this.user;
            let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user.identityProvider);
            let accessTokenItems = [];
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                let accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.userIdentifier === userObject.userIdentifier) {
                    let cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                    if (MSAL.Utils.containsScope(cachedScopes, scopes))
                        accessTokenItems.push(accessTokenCacheItem);
                }
            }
            if (accessTokenItems.length === 0 || accessTokenItems.length > 1)
                return null;
            else {
                let accessTokenCacheItem = accessTokenItems[0];
                var expired = Number(accessTokenCacheItem.value.expiresIn);
                var offset = this._clockSkew || 300;
                if (expired && (expired > MSAL.Utils.now() + offset))
                    return accessTokenCacheItem.value.accessToken;
                else {
                    this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[0].key));
                    return null;
                }
            }
        }
        getAllUsers() {
            let users = [];
            let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(MSAL.Constants.clientId, MSAL.Constants.authority);
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                let idToken = new MSAL.IdToken(accessTokenCacheItems[i].value.idToken);
                let clientInfo = new MSAL.ClientInfo(accessTokenCacheItems[i].value.clientInfo);
                let user = MSAL.User.createUser(idToken, clientInfo, this.authority);
                users.push(user);
            }
            return this.getUniqueUsers(users);
        }
        getUniqueUsers(users) {
            if (users.length <= 1)
                return users;
            return users.filter(function (item, pos, array) {
                return array.map(function (mapItem) { return item[item.userIdentifier]; }).indexOf(item[item.userIdentifier]) === pos;
            });
        }
        addHintParameters(urlNavigate, user) {
            let userObject = user ? user : this.user;
            if (!MSAL.Utils.isEmpty(userObject.displayableId)) {
                urlNavigate += '&login_hint=' + encodeURIComponent(user.displayableId);
            }
            if (!this.urlContainsQueryStringParameter('domain_req', urlNavigate) && !MSAL.Utils.isEmpty(userObject.utid)) {
                urlNavigate += '&domain_req=' + encodeURIComponent(userObject.utid);
            }
            if (!this.urlContainsQueryStringParameter('login_req', urlNavigate) && !MSAL.Utils.isEmpty(userObject.uid)) {
                urlNavigate += '&login_req=' + encodeURIComponent(user.uid);
            }
            if (!this.urlContainsQueryStringParameter('domain_hint', urlNavigate) && !MSAL.Utils.isEmpty(userObject.utid)) {
                if (user.utid === '9188040d-6c67-4c5b-b112-36a304b66dad') {
                    urlNavigate += '&domain_hint=' + encodeURIComponent("consumers");
                }
                else {
                    urlNavigate += '&domain_hint=' + encodeURIComponent("organizations");
                }
            }
            return urlNavigate;
        }
        urlContainsQueryStringParameter(name, url) {
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }
        acquireToken(scopes, callback, user, extraQueryParameters) {
            var isValidScope = this.validateInputScope(scopes);
            if (isValidScope && !MSAL.Utils.isEmpty(isValidScope)) {
                callback(isValidScope, null, null);
                return;
            }
            let userObject = user ? user : this.user;
            if (this._acquireTokenInProgress) {
                return;
            }
            let scope = scopes.join(' ').toLowerCase();
            if (!userObject) {
                callback('user login is required', null, null);
                return;
            }
            this._acquireTokenInProgress = true;
            var authenticationRequest;
            if (MSAL.Utils.compareObjects(userObject, this.user)) {
                authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
            }
            else {
                authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
            }
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            this._cacheStorage.saveItem(MSAL.Constants.nonceIdToken, authenticationRequest.nonce);
            let acquireTokenUserKey = MSAL.Constants.acquireTokenUser + MSAL.Constants.resourceDelimeter + userObject.userIdentifier + MSAL.Constants.resourceDelimeter + authenticationRequest.state;
            if (MSAL.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.saveItem(acquireTokenUserKey, JSON.stringify(userObject));
            }
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes);
            urlNavigate = this.addHintParameters(urlNavigate, userObject);
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
        acquireTokenSilent(scopes, callback, user, extraQueryParameters) {
            var isValidScope = this.validateInputScope(scopes);
            if (isValidScope && !MSAL.Utils.isEmpty(isValidScope)) {
                callback(isValidScope, null, null);
                return;
            }
            let scope = scopes.join(' ').toLowerCase();
            let userObject = user ? user : this.user;
            if (!userObject) {
                callback('user login is required', null, null);
                return;
            }
            var token = this.getCachedToken(scopes, userObject);
            if (token) {
                this._requestContext.logger.info('Token is already in cache for scope:' + scope);
                callback(null, token, null);
                return;
            }
            if (this._activeRenewals[scope]) {
                this.registerCallback(this._activeRenewals[scope], scope, callback);
            }
            else {
                if (scopes && scopes.indexOf(this.clientId) > -1 && scopes.length === 1) {
                    this._requestContext.logger.verbose('renewing idToken');
                    this.renewIdToken(scopes, callback, userObject, extraQueryParameters);
                }
                else {
                    this._requestContext.logger.verbose('renewing accesstoken');
                    this.renewToken(scopes, callback, userObject, extraQueryParameters);
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
                    self._requestContext.logger.verbose('Loading frame has timed out after: ' + (MSAL.Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    var expectedState = self._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState])
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null, null);
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
        renewToken(scopes, callback, user, extraQueryParameters) {
            var scope = scopes.join(' ').toLowerCase();
            this._requestContext.logger.verbose('renewToken is called for scope:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            var authenticationRequest;
            if (MSAL.Utils.compareObjects(user, this.user)) {
                authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
            }
            else {
                authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
            }
            this._cacheStorage.saveItem(MSAL.Constants.nonceIdToken, authenticationRequest.nonce);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            let acquireTokenUserKey = MSAL.Constants.acquireTokenUser + MSAL.Constants.resourceDelimeter + user.userIdentifier + MSAL.Constants.resourceDelimeter + authenticationRequest.state;
            if (MSAL.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.saveItem(acquireTokenUserKey, JSON.stringify(user));
            }
            this._renewStates.push(authenticationRequest.state);
            this._requestContext.logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this.registerCallback(authenticationRequest.state, scope, callback);
            this._requestContext.logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        }
        renewIdToken(scopes, callback, user, extraQueryParameters) {
            this._requestContext.logger.info('renewidToken is called');
            let frameHandle = this.addAdalFrame('adalIdTokenFrame');
            let authenticationRequest = new MSAL.AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + this.clientId;
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            let acquireTokenUserKey = MSAL.Constants.acquireTokenUser + MSAL.Constants.resourceDelimeter + user.userIdentifier + MSAL.Constants.resourceDelimeter + authenticationRequest.state;
            if (MSAL.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.saveItem(acquireTokenUserKey, JSON.stringify(user));
            }
            this._cacheStorage.saveItem(MSAL.Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, callback);
            this._requestContext.logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.clientId);
        }
        getUser() {
            if (this.user) {
                return this.user;
            }
            var rawIdToken = this._cacheStorage.getItem(MSAL.Constants.idTokenKey);
            var rawClientInfo = this._cacheStorage.getItem(MSAL.Constants.clientInfo);
            if (!MSAL.Utils.isEmpty(rawIdToken) && !MSAL.Utils.isEmpty(rawClientInfo)) {
                let idToken = new MSAL.IdToken(rawIdToken);
                let clientInfo = new MSAL.ClientInfo(rawClientInfo);
                this.user = MSAL.User.createUser(idToken, clientInfo, this.authority);
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
        saveAccessToken(requestInfo, user, clientInfo, idToken) {
            let userObject = user ? user : this.user;
            let scope;
            if (requestInfo.parameters.hasOwnProperty('scope')) {
                scope = requestInfo.parameters['scope'];
                let consentedScopes = scope.split(' ');
                let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user.identityProvider);
                for (let i = 0; i < accessTokenCacheItems.length; i++) {
                    let accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
                        var cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                        if (MSAL.Utils.isIntersectingScopes(cachedScopes, consentedScopes))
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
                let accessTokenKey = new MSAL.AccessTokenKey(user.identityProvider, this.clientId, scope, user.uid, user.utid);
                let accessTokenValue = new MSAL.AccessTokenValue(requestInfo.parameters[MSAL.Constants.accessToken], idToken.getRawIdToken, MSAL.Utils.expiresIn(requestInfo.parameters[MSAL.Constants.expiresIn]).toString(), clientInfo);
                this._cacheStorage.saveItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
            else {
                scope = this.clientId;
                let accessTokenKey = new MSAL.AccessTokenKey(user.identityProvider, this.clientId, scope, user.uid, user.utid);
                let accessTokenValue = new MSAL.AccessTokenValue(requestInfo.parameters[MSAL.Constants.idToken], requestInfo.parameters[MSAL.Constants.idToken], idToken.expiration, clientInfo);
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
                this._cacheStorage.removeAcquireTokenEntries(MSAL.Constants.acquireTokenUser, MSAL.Constants.renewStatus);
            }
            else {
                if (requestInfo.stateMatch) {
                    this._requestContext.logger.info('State is right');
                    if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.sessionState))
                        this._cacheStorage.saveItem(MSAL.Constants.sessionState, requestInfo.parameters[MSAL.Constants.sessionState]);
                    var keys;
                    if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.accessToken)) {
                        this._requestContext.logger.info('Fragment has access token');
                        this._acquireTokenInProgress = false;
                        var idToken;
                        var clientInfo;
                        let user;
                        if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.idToken)) {
                            idToken = new MSAL.IdToken(requestInfo.parameters[MSAL.Constants.idToken]);
                        }
                        else {
                            idToken = new MSAL.IdToken(this._cacheStorage.getItem(MSAL.Constants.idTokenKey));
                        }
                        if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.clientInfo)) {
                            clientInfo = requestInfo.parameters[MSAL.Constants.clientInfo];
                            user = MSAL.User.createUser(idToken, new MSAL.ClientInfo(clientInfo), this.authority);
                        }
                        else {
                            this._requestContext.logger.info("ClientInfo not received in the response from AAD");
                            clientInfo = '';
                            user = MSAL.User.createUser(idToken, new MSAL.ClientInfo(clientInfo), this.authority);
                        }
                        let acquireTokenUserKey = MSAL.Constants.acquireTokenUser + MSAL.Constants.resourceDelimeter + user.userIdentifier + MSAL.Constants.resourceDelimeter + requestInfo.stateResponse;
                        let acquireTokenUser;
                        if (!MSAL.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                            acquireTokenUser = JSON.parse(this._cacheStorage.getItem(acquireTokenUserKey));
                            if (user && acquireTokenUser && MSAL.Utils.compareObjects(user, acquireTokenUser)) {
                                this.saveAccessToken(requestInfo, user, clientInfo, idToken);
                                this._requestContext.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
                            }
                            else {
                                this._requestContext.logger.warning("The user object received in the response is not same as the one passed in the acquireToken request");
                            }
                        }
                        this._cacheStorage.saveItem(MSAL.Constants.renewStatus + scope, MSAL.Constants.tokenRenewStatusCompleted);
                        this._cacheStorage.removeAcquireTokenEntries(MSAL.Constants.acquireTokenUser, MSAL.Constants.renewStatus);
                    }
                    if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.idToken)) {
                        if (scope.indexOf(this.clientId) > -1) {
                            this._requestContext.logger.info('Fragment has id token');
                            this._loginInProgress = false;
                            var idToken = new MSAL.IdToken(requestInfo.parameters[MSAL.Constants.idToken]);
                            var clientInfo;
                            if (requestInfo.parameters.hasOwnProperty(MSAL.Constants.clientInfo)) {
                                clientInfo = requestInfo.parameters[MSAL.Constants.clientInfo];
                            }
                            else {
                                clientInfo = '';
                            }
                            this.user = MSAL.User.createUser(idToken, new MSAL.ClientInfo(clientInfo), this.authority);
                            if (idToken && idToken.nonce) {
                                if (idToken.nonce !== this._cacheStorage.getItem(MSAL.Constants.nonceIdToken)) {
                                    this.user = null;
                                    this._cacheStorage.saveItem(MSAL.Constants.loginError, 'Nonce Mismatch.Expected: ' + this._cacheStorage.getItem(MSAL.Constants.nonceIdToken) + ',' + 'Actual: ' + idToken.nonce);
                                }
                                else {
                                    this._cacheStorage.saveItem(MSAL.Constants.idTokenKey, requestInfo.parameters[MSAL.Constants.idToken]);
                                    this._cacheStorage.saveItem(MSAL.Constants.clientInfo, requestInfo.parameters[MSAL.Constants.clientInfo]);
                                    this.saveAccessToken(requestInfo, this.user, clientInfo, idToken);
                                }
                            }
                            else {
                                this._cacheStorage.saveItem(MSAL.Constants.error, 'invalid idToken');
                                this._cacheStorage.saveItem(MSAL.Constants.errorDescription, 'Invalid idToken. idToken: ' + requestInfo.parameters[MSAL.Constants.idToken]);
                            }
                        }
                    }
                }
                else {
                    this._cacheStorage.saveItem(MSAL.Constants.error, 'Invalid_state');
                    this._cacheStorage.saveItem(MSAL.Constants.errorDescription, 'Invalid_state. state: ' + requestInfo.stateResponse);
                }
            }
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
    }
    MSAL.UserAgentApplication = UserAgentApplication;
})(MSAL || (MSAL = {}));
var MSAL;
(function (MSAL) {
    class Utils {
        static compareObjects(o1, o2) {
            for (var p in o1) {
                if (o1.hasOwnProperty(p)) {
                    if (o1[p] !== o2[p]) {
                        return false;
                    }
                }
            }
            for (var p in o2) {
                if (o2.hasOwnProperty(p)) {
                    if (o1[p] !== o2[p]) {
                        return false;
                    }
                }
            }
            return true;
        }
        ;
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
        static base64EncodeStringUrlSafe(input) {
            if (window.btoa) {
                return window.btoa(input);
            }
            else {
                return this.encode(input);
            }
        }
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
        static encode(input) {
            let _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = this.utf8Encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                }
                else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
            }
            return output.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        static utf8Encode(input) {
            input = input.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < input.length; n++) {
                var c = input.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        }
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
            cachedScopes = this.convertToLowerCase(cachedScopes);
            for (let i = 0; i < scopes.length; i++) {
                if (cachedScopes.indexOf(scopes[i].toLowerCase()) > -1)
                    return true;
            }
            return false;
        }
        static containsScope(cachedScopes, scopes) {
            cachedScopes = this.convertToLowerCase(cachedScopes);
            if (scopes.length == 0)
                return false;
            if (cachedScopes.length < scopes.length)
                return false;
            return scopes.every(function (value) {
                return cachedScopes.indexOf(value.toString().toLowerCase()) >= 0;
            });
        }
        static convertToLowerCase(scopes) {
            return scopes.map(function (scope) {
                return scope.toLowerCase();
            });
        }
        static removeElement(scopes, scope) {
            return scopes.filter(function (value) {
                return value !== scope;
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