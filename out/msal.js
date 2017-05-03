var Msal;
(function (Msal) {
    var AuthorityType;
    (function (AuthorityType) {
        AuthorityType[AuthorityType["Aad"] = 0] = "Aad";
        AuthorityType[AuthorityType["Adfs"] = 1] = "Adfs";
        AuthorityType[AuthorityType["B2C"] = 2] = "B2C";
    })(AuthorityType = Msal.AuthorityType || (Msal.AuthorityType = {}));
    class Authority {
        constructor(authority, validateAuthority) {
            this.IsValidationEnabled = validateAuthority;
            this.CanonicalAuthority = authority;
            this.validateAsUri();
        }
        get Tenant() {
            return this.CanonicalAuthorityUrlComponents.PathSegments[0];
        }
        get AuthorizationEndpoint() {
            this.validateResolved();
            return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.Tenant);
        }
        get EndSessionEndpoint() {
            this.validateResolved();
            return this.tenantDiscoveryResponse.EndSessionEndpoint.replace("{tenant}", this.Tenant);
        }
        get SelfSignedJwtAudience() {
            this.validateResolved();
            return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.Tenant);
        }
        validateResolved() {
            if (!this.tenantDiscoveryResponse) {
                throw "Please call ResolveEndpointsAsync first";
            }
        }
        get CanonicalAuthority() {
            return this.canonicalAuthority;
        }
        ;
        set CanonicalAuthority(url) {
            this.canonicalAuthority = Msal.Utils.CanonicalizeUri(url);
            this.canonicalAuthorityUrlComponents = null;
        }
        get CanonicalAuthorityUrlComponents() {
            if (!this.canonicalAuthorityUrlComponents) {
                this.canonicalAuthorityUrlComponents = Msal.Utils.GetUrlComponents(this.CanonicalAuthority);
            }
            return this.canonicalAuthorityUrlComponents;
        }
        get DefaultOpenIdConfigurationEndpoint() {
            return `${this.CanonicalAuthority}v2.0/.well-known/openid-configuration`;
        }
        validateAsUri() {
            let components;
            try {
                components = this.CanonicalAuthorityUrlComponents;
            }
            catch (e) {
                throw Msal.ErrorMessage.invalidAuthorityType;
            }
            if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
                throw Msal.ErrorMessage.authorityUriInsecure;
            }
            ;
            if (!components.PathSegments || components.PathSegments.length < 1) {
                throw Msal.ErrorMessage.authorityUriInvalidPath;
            }
        }
        static DetectAuthorityFromUrl(authorityUrl) {
            authorityUrl = Msal.Utils.CanonicalizeUri(authorityUrl);
            let components = Msal.Utils.GetUrlComponents(authorityUrl);
            let pathSegments = components.PathSegments;
            switch (pathSegments[0]) {
                case "tfp":
                    return AuthorityType.B2C;
                case "adfs":
                    return AuthorityType.Adfs;
                default:
                    return AuthorityType.Aad;
            }
        }
        static CreateInstance(authorityUrl, validateAuthority) {
            let type = Authority.DetectAuthorityFromUrl(authorityUrl);
            switch (type) {
                case AuthorityType.B2C:
                    return new Msal.B2cAuthority(authorityUrl, validateAuthority);
                case AuthorityType.Aad:
                    return new Msal.AadAuthority(authorityUrl, validateAuthority);
                default:
                    throw Msal.ErrorMessage.invalidAuthorityType;
            }
        }
        DiscoverEndpoints(openIdConfigurationEndpoint) {
            let client = new Msal.XhrClient();
            return client.sendRequestAsync(openIdConfigurationEndpoint, "GET", true)
                .then((response) => {
                return {
                    AuthorizationEndpoint: response.authorization_endpoint,
                    EndSessionEndpoint: response.end_session_endpoint,
                    Issuer: response.issuer
                };
            });
        }
        ResolveEndpointsAsync() {
            let openIdConfigurationEndpoint = "";
            return this.GetOpenIdConfigurationEndpointAsync().then(openIdConfigurationEndpointResponse => {
                openIdConfigurationEndpoint = openIdConfigurationEndpointResponse;
                return this.DiscoverEndpoints(openIdConfigurationEndpoint);
            }).then((tenantDiscoveryResponse) => {
                this.tenantDiscoveryResponse = tenantDiscoveryResponse;
                return this;
            });
        }
    }
    Msal.Authority = Authority;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    class AadAuthority extends Msal.Authority {
        constructor(authority, validateAuthority) {
            super(authority, validateAuthority);
        }
        get AadInstanceDiscoveryEndpointUrl() {
            return `${AadAuthority.AadInstanceDiscoveryEndpoint}?api-version=1.0&authorization_endpoint=${this.CanonicalAuthority}oauth2/v2.0/authorize`;
        }
        get AuthorityType() {
            return Msal.AuthorityType.Aad;
        }
        GetOpenIdConfigurationEndpointAsync() {
            var resultPromise = new Promise((resolve, reject) => resolve(this.DefaultOpenIdConfigurationEndpoint));
            if (!this.IsValidationEnabled) {
                return resultPromise;
            }
            let host = this.CanonicalAuthorityUrlComponents.HostNameAndPort;
            if (this.IsInTrustedHostList(host)) {
                return resultPromise;
            }
            let client = new Msal.XhrClient();
            return client.sendRequestAsync(this.AadInstanceDiscoveryEndpointUrl, "GET", true)
                .then((response) => {
                return response.tenant_discovery_endpoint;
            });
        }
        IsInTrustedHostList(host) {
            return AadAuthority.TrustedHostList[host.toLowerCase()];
        }
    }
    AadAuthority.AadInstanceDiscoveryEndpoint = "https://login.microsoftonline.com/common/discovery/instance";
    AadAuthority.TrustedHostList = {
        "login.windows.net": "login.windows.net",
        "login.chinacloudapi.cn": "login.chinacloudapi.cn",
        "login.cloudgovapi.us": "login.cloudgovapi.us",
        "login.microsoftonline.com": "login.microsoftonline.com",
        "login.microsoftonline.de": "login.microsoftonline.de"
    };
    Msal.AadAuthority = AadAuthority;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class AccessTokenCacheItem {
        constructor(key, value) {
            this.key = key;
            this.value = value;
        }
    }
    Msal.AccessTokenCacheItem = AccessTokenCacheItem;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class AccessTokenKey {
        constructor(authority, clientId, scopes, uid, utid) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scopes;
            this.userIdentifier = Msal.Utils.base64EncodeStringUrlSafe(uid) + "." + Msal.Utils.base64EncodeStringUrlSafe(utid);
        }
    }
    Msal.AccessTokenKey = AccessTokenKey;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class AccessTokenValue {
        constructor(accessToken, idToken, expiresIn, clientInfo) {
            this.accessToken = accessToken;
            this.idToken = idToken;
            this.expiresIn = expiresIn;
            this.clientInfo = clientInfo;
        }
    }
    Msal.AccessTokenValue = AccessTokenValue;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class AuthenticationRequestParameters {
        constructor(authority, clientId, scope, responseType, redirectUri) {
            this.authorityInstance = authority;
            this.clientId = clientId;
            this.scopes = scope;
            this.responseType = responseType;
            this.redirectUri = redirectUri;
            this.correlationId = Msal.Utils.createNewGuid();
            this.state = Msal.Utils.createNewGuid();
            this.nonce = Msal.Utils.createNewGuid();
            this.xClientSku = "MSAL.JS";
            this.xClientVer = Msal.Utils.getLibraryVersion();
        }
        get authority() {
            return this.authorityInstance.CanonicalAuthority;
        }
        createNavigateUrl(scopes) {
            if (!scopes) {
                scopes = [this.clientId];
            }
            if (scopes.indexOf(this.clientId) === -1) {
                scopes.push(this.clientId);
            }
            const str = [];
            str.push("response_type=" + this.responseType);
            this.translateclientIdUsedInScope(scopes);
            str.push("scope=" + encodeURIComponent(this.parseScope(scopes)));
            str.push("client_id=" + encodeURIComponent(this.clientId));
            str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));
            str.push("state=" + encodeURIComponent(this.state));
            str.push("nonce=" + encodeURIComponent(this.nonce));
            str.push("client_info=1");
            str.push("slice=testslice");
            str.push("uid=true");
            str.push(`x-client-SKU=${this.xClientSku}`);
            str.push(`x-client-Ver=${this.xClientVer}`);
            if (this.extraQueryParameters) {
                str.push(this.extraQueryParameters);
            }
            str.push("client-request-id=" + encodeURIComponent(this.correlationId));
            let authEndpoint = this.authorityInstance.AuthorizationEndpoint;
            if (authEndpoint.indexOf("?") < 0) {
                authEndpoint += '?';
            }
            else {
                authEndpoint += '&';
            }
            let requestUrl = `${authEndpoint}${str.join("&")}`;
            return requestUrl;
        }
        translateclientIdUsedInScope(scopes) {
            const clientIdIndex = scopes.indexOf(this.clientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                if (scopes.indexOf("openid") === -1) {
                    scopes.push("openid");
                }
                if (scopes.indexOf("profile") === -1) {
                    scopes.push("profile");
                }
            }
        }
        parseScope(scopes) {
            let scopeList = "";
            if (scopes) {
                for (let i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + " " : scopes[i];
                }
            }
            return scopeList;
        }
    }
    Msal.AuthenticationRequestParameters = AuthenticationRequestParameters;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    class B2cAuthority extends Msal.AadAuthority {
        constructor(authority, validateAuthority) {
            super(authority, validateAuthority);
            let urlComponents = Msal.Utils.GetUrlComponents(authority);
            let pathSegments = urlComponents.PathSegments;
            if (pathSegments.length < 3) {
                throw Msal.ErrorMessage.b2cAuthorityUriInvalidPath;
            }
            this.CanonicalAuthority = `https://${urlComponents.HostNameAndPort}/${pathSegments[0]}/${pathSegments[1]}/${pathSegments[2]}/`;
        }
        get AuthorityType() {
            return Msal.AuthorityType.B2C;
        }
        GetOpenIdConfigurationEndpointAsync() {
            var resultPromise = new Promise((resolve, reject) => resolve(this.DefaultOpenIdConfigurationEndpoint));
            if (!this.IsValidationEnabled) {
                return resultPromise;
            }
            if (this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
                return resultPromise;
            }
            return new Promise((resolve, reject) => reject(Msal.ErrorMessage.unsupportedAuthorityValidation));
        }
    }
    Msal.B2cAuthority = B2cAuthority;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class ClientInfo {
        constructor(rawClientInfo) {
            if (!rawClientInfo || Msal.Utils.isEmpty(rawClientInfo)) {
                this.uid = "";
                this.utid = "";
                return;
            }
            try {
                const decodedClientInfo = Msal.Utils.base64DecodeStringUrlSafe(rawClientInfo);
                const clientInfo = JSON.parse(decodedClientInfo);
                if (clientInfo) {
                    if (clientInfo.hasOwnProperty("uid")) {
                        this.uid = clientInfo.uid;
                    }
                    if (clientInfo.hasOwnProperty("utid")) {
                        this.utid = clientInfo.utid;
                    }
                }
            }
            catch (e) {
                throw new Error(e);
            }
        }
        get uid() {
            return this._uid ? this._uid : "";
        }
        set uid(uid) {
            this._uid = uid;
        }
        get utid() {
            return this._utid ? this._utid : "";
        }
        set utid(utid) {
            this._utid = utid;
        }
    }
    Msal.ClientInfo = ClientInfo;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
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
    Msal.Constants = Constants;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    class ErrorMessage {
        static get authorityUriInvalidPath() { return "AuthorityUriInvalidPath"; }
        static get authorityUriInsecure() { return "AuthorityUriInsecure"; }
        static get invalidAuthorityType() { return "InvalidAuthorityType"; }
        static get unsupportedAuthorityValidation() { return "UnsupportedAuthorityValidation"; }
        static get b2cAuthorityUriInvalidPath() { return "B2cAuthorityUriInvalidPath"; }
    }
    Msal.ErrorMessage = ErrorMessage;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class IdToken {
        constructor(rawIdToken) {
            if (Msal.Utils.isEmpty(rawIdToken)) {
                throw new Error("null or empty raw idtoken");
            }
            try {
                this.rawIdToken = rawIdToken;
                const decodedIdToken = Msal.Utils.extractIdToken(rawIdToken);
                if (decodedIdToken) {
                    if (decodedIdToken.hasOwnProperty("iss")) {
                        this.issuer = decodedIdToken.iss;
                    }
                    if (decodedIdToken.hasOwnProperty("oid")) {
                        this.objectId = decodedIdToken.oid;
                    }
                    if (decodedIdToken.hasOwnProperty("sub")) {
                        this.subject = decodedIdToken.sub;
                    }
                    if (decodedIdToken.hasOwnProperty("tid")) {
                        this.tenantId = decodedIdToken.tid;
                    }
                    if (decodedIdToken.hasOwnProperty("ver")) {
                        this.version = decodedIdToken.ver;
                    }
                    if (decodedIdToken.hasOwnProperty("preferred_username")) {
                        this.preferredName = decodedIdToken.preferred_username;
                    }
                    if (decodedIdToken.hasOwnProperty("name")) {
                        this.name = decodedIdToken.name;
                    }
                    if (decodedIdToken.hasOwnProperty("nonce")) {
                        this.nonce = decodedIdToken.nonce;
                    }
                    if (decodedIdToken.hasOwnProperty("exp")) {
                        this.expiration = decodedIdToken.exp;
                    }
                }
            }
            catch (e) {
                throw new Error("Failed to parse the returned id token");
            }
        }
    }
    Msal.IdToken = IdToken;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Error"] = 0] = "Error";
        LogLevel[LogLevel["Warning"] = 1] = "Warning";
        LogLevel[LogLevel["Info"] = 2] = "Info";
        LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
    })(LogLevel = Msal.LogLevel || (Msal.LogLevel = {}));
    class Logger {
        constructor(correlationId) {
            this._level = LogLevel.Info;
            this._piiLoggingEnabled = false;
            if (Logger._instance) {
                return Logger._instance;
            }
            this._correlationId = correlationId;
            Logger._instance = this;
            return Logger._instance;
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
        logMessage(logMessage, logLevel, containsPii) {
            if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
                return;
            }
            var timestamp = new Date().toUTCString();
            var log;
            if (!Msal.Utils.isEmpty(this.correlationId)) {
                log = timestamp + ":" + this._correlationId + "-" + Msal.Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
            }
            else {
                log = timestamp + ":" + Msal.Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
            }
            this.executeCallback(logLevel, log, containsPii);
        }
        executeCallback(level, message, containsPii) {
            if (this.localCallback) {
                this.localCallback(level, message, containsPii);
            }
        }
        error(message) {
            this.logMessage(message, LogLevel.Error, false);
        }
        errorPii(message) {
            this.logMessage(message, LogLevel.Error, true);
        }
        warning(message) {
            this.logMessage(message, LogLevel.Warning, false);
        }
        warningPii(message) {
            this.logMessage(message, LogLevel.Warning, true);
        }
        info(message) {
            this.logMessage(message, LogLevel.Info, false);
        }
        infoPii(message) {
            this.logMessage(message, LogLevel.Info, true);
        }
        verbose(message) {
            this.logMessage(message, LogLevel.Verbose, false);
        }
        verbosePii(message) {
            this.logMessage(message, LogLevel.Verbose, true);
        }
    }
    Msal.Logger = Logger;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class RequestContext {
        constructor(correlationId) {
            if (RequestContext._instance) {
                return RequestContext._instance;
            }
            this._logger = new Msal.Logger(correlationId);
            this._correlationId = this._logger.correlationId;
            RequestContext._instance = this;
        }
        get correlationId() { return this._correlationId; }
        get logger() { return this._logger; }
    }
    Msal.RequestContext = RequestContext;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class Storage {
        constructor(cacheLocation) {
            if (Storage._instance) {
                return Storage._instance;
            }
            this._cacheLocation = cacheLocation;
            this._localStorageSupported = typeof window[this._cacheLocation] != "undefined" && window[this._cacheLocation] != null;
            this._sessionStorageSupported = typeof window[cacheLocation] != "undefined" && window[cacheLocation] != null;
            Storage._instance = this;
            if (!this._localStorageSupported && !this._sessionStorageSupported) {
                throw new Error("localStorage and sessionStorage not supported");
            }
            return Storage._instance;
        }
        setItem(key, value) {
            if (window[this._cacheLocation]) {
                window[this._cacheLocation].setItem(key, value);
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
        getItem(key) {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].getItem(key);
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
        removeItem(key) {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].removeItem(key);
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
        clear() {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].clear();
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
        getAllAccessTokens(clientId, userIdentifier) {
            const results = [];
            let accessTokenCacheItem;
            const storage = window[this._cacheLocation];
            if (storage) {
                let key;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(userIdentifier)) {
                            let value = this.getItem(key);
                            if (value) {
                                accessTokenCacheItem = new Msal.AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                                results.push(accessTokenCacheItem);
                            }
                        }
                    }
                }
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
            return results;
        }
        removeAcquireTokenEntries(acquireTokenUser, acquireTokenStatus) {
            const storage = window[this._cacheLocation];
            if (storage) {
                let key;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if ((key.indexOf(acquireTokenUser) > -1) || (key.indexOf(acquireTokenStatus) > -1)) {
                            this.removeItem(key);
                        }
                    }
                }
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
        resetCacheItems() {
            const storage = window[this._cacheLocation];
            if (storage) {
                let key;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        storage[key] = "";
                    }
                }
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
    }
    Msal.Storage = Storage;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
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
    Msal.Telemetry = Telemetry;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class TokenResponse {
        constructor() {
            this.valid = false;
            this.parameters = {};
            this.stateMatch = false;
            this.stateResponse = "";
            this.requestType = "unknown";
        }
    }
    Msal.TokenResponse = TokenResponse;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class User {
        constructor(displayableId, name, identityProvider, userIdentifier) {
            this.displayableId = displayableId;
            this.name = name;
            this.identityProvider = identityProvider;
            this.userIdentifier = userIdentifier;
        }
        static createUser(idToken, clientInfo, authority) {
            let uid;
            let utid;
            if (!clientInfo) {
                uid = "";
                utid = "";
            }
            else {
                uid = clientInfo.uid;
                utid = clientInfo.utid;
            }
            const userIdentifier = Msal.Utils.base64EncodeStringUrlSafe(uid) + "." + Msal.Utils.base64EncodeStringUrlSafe(utid);
            return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier);
        }
    }
    Msal.User = User;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    let ResponseTypes = {
        id_token: "id_token",
        token: "token",
        id_token_token: "id_token token"
    };
    class UserAgentApplication {
        constructor(clientId, authority, tokenReceivedCallback, validateAuthority) {
            this._cacheLocations = {
                localStorage: "localStorage",
                sessionStorage: "sessionStorage"
            };
            this._cacheLocation = "sessionStorage";
            this._interactionModes = {
                popUp: "popUp",
                redirect: "redirect"
            };
            this._interactionMode = "redirect";
            this._clockSkew = 300;
            this._tokenReceivedCallback = null;
            this.navigateToLoginRequestUrl = true;
            this.clientId = clientId;
            this.validateAuthority = validateAuthority === true;
            this.authority = authority ? authority : "https://login.microsoftonline.com/common";
            if (tokenReceivedCallback) {
                this._tokenReceivedCallback = tokenReceivedCallback;
            }
            this.redirectUri = window.location.href.split("?")[0].split("#")[0];
            this.postLogoutredirectUri = this.redirectUri;
            this._loginInProgress = false;
            this._acquireTokenInProgress = false;
            this._renewStates = [];
            this._activeRenewals = {};
            this._cacheStorage = new Msal.Storage(this._cacheLocation);
            this._requestContext = new Msal.RequestContext("");
            window.msal = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
        }
        get cacheLocation() {
            return this._cacheLocation;
        }
        set cacheLocation(cache) {
            this._cacheLocation = cache;
            if (this._cacheLocations[cache]) {
                this._cacheStorage = new Msal.Storage(this._cacheLocations[cache]);
            }
            else {
                throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
            }
        }
        get interactionMode() {
            return this._interactionMode;
        }
        set interactionMode(mode) {
            if (this._interactionModes[mode]) {
                this._interactionMode = this._interactionModes[mode];
            }
            else {
                throw new Error('Interantion mode is not valid. Provided value:' + this._interactionMode + '.Possible values are: ' + this._interactionModes.redirect + ',' + this._interactionModes.popUp);
            }
        }
        set authority(val) {
            this.authorityInstance = Msal.Authority.CreateInstance(val, this.validateAuthority);
        }
        get authority() {
            return this.authorityInstance.CanonicalAuthority;
        }
        loginRedirect(scopes, extraQueryParameters) {
            if (this._loginInProgress) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback("Login is in progress", null, null, Msal.Constants.idToken);
                    return;
                }
            }
            if (scopes) {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                    if (this._tokenReceivedCallback) {
                        this._tokenReceivedCallback(isValidScope, null, null, Msal.Constants.idToken);
                        return;
                    }
                }
            }
            this.authorityInstance.ResolveEndpointsAsync()
                .then(() => {
                const authenticationRequest = new Msal.AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.redirectUri);
                if (extraQueryParameters) {
                    authenticationRequest.extraQueryParameters = extraQueryParameters;
                }
                authenticationRequest.state = authenticationRequest.state + "|" + this.clientId;
                this._cacheStorage.setItem(Msal.Constants.loginRequest, window.location.href);
                this._cacheStorage.setItem(Msal.Constants.loginError, "");
                this._cacheStorage.setItem(Msal.Constants.stateLogin, authenticationRequest.state);
                this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                this._cacheStorage.setItem(Msal.Constants.error, "");
                this._cacheStorage.setItem(Msal.Constants.errorDescription, "");
                const authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                    this._cacheStorage.setItem(authorityKey, this.authority);
                }
                const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                this._loginInProgress = true;
                this.promptUser(urlNavigate);
            });
        }
        loginPopup(scopes, extraQueryParameters) {
            return new Promise((resolve, reject) => {
                if (this._loginInProgress) {
                    reject("Login is in progress");
                    return;
                }
                if (scopes) {
                    const isValidScope = this.validateInputScope(scopes);
                    if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                        reject(isValidScope);
                        return;
                    }
                }
                this.authorityInstance.ResolveEndpointsAsync().then(() => {
                    const authenticationRequest = new Msal.AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.redirectUri);
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }
                    authenticationRequest.state = authenticationRequest.state + "|" + this.clientId;
                    this._cacheStorage.setItem(Msal.Constants.loginRequest, window.location.href);
                    this._cacheStorage.setItem(Msal.Constants.loginError, "");
                    this._cacheStorage.setItem(Msal.Constants.stateLogin, authenticationRequest.state);
                    this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                    this._cacheStorage.setItem(Msal.Constants.error, "");
                    this._cacheStorage.setItem(Msal.Constants.errorDescription, "");
                    const authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                    if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                        this._cacheStorage.setItem(authorityKey, this.authority);
                    }
                    const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                    this._loginInProgress = true;
                    this.openWindow(urlNavigate, "login", 20, this, resolve, reject);
                });
            });
        }
        promptUser(urlNavigate) {
            if (urlNavigate && !Msal.Utils.isEmpty(urlNavigate)) {
                this._requestContext.logger.info('Navigate to:' + urlNavigate);
                window.location.replace(urlNavigate);
            }
            else {
                this._requestContext.logger.info('Navigate url is empty');
            }
        }
        ;
        openWindow(urlNavigate, title, interval, instance, resolve, reject) {
            const popupWindow = this.openPopup(urlNavigate, title, Msal.Constants.popUpWidth, Msal.Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
                this._requestContext.logger.info("Popup Window is null. This can happen if you are using IE");
                this._cacheStorage.setItem(Msal.Constants.error, "Error opening popup");
                this._cacheStorage.setItem(Msal.Constants.errorDescription, "Popup Window is null. This can happen if you are using IE");
                if (reject) {
                    reject("Popup Window is null. This can happen if you are using IE");
                    return;
                }
                return;
            }
            var pollTimer = window.setInterval(() => {
                if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
                    instance._loginInProgress = false;
                    instance._acquireTokenInProgress = false;
                    window.clearInterval(pollTimer);
                }
                try {
                    if (popupWindow.location.href.indexOf(this.redirectUri) !== -1) {
                        this.handleAuthenticationResponse(popupWindow.location.hash, resolve, reject);
                        window.clearInterval(pollTimer);
                        instance._loginInProgress = false;
                        instance._acquireTokenInProgress = false;
                        this._requestContext.logger.info("Closing popup window");
                        popupWindow.close();
                    }
                }
                catch (e) {
                }
            }, interval);
        }
        logout() {
            this.clearCache();
            this._user = null;
            let logout = "";
            if (this.postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.postLogoutredirectUri);
            }
            const urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
            this.promptUser(urlNavigate);
        }
        clearCache() {
            this._renewStates = [];
            const accessTokenItems = this._cacheStorage.getAllAccessTokens(Msal.Constants.clientId, Msal.Constants.authority);
            for (let i = 0; i < accessTokenItems.length; i++) {
                this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
            }
            this._cacheStorage.removeAcquireTokenEntries(Msal.Constants.acquireTokenUser, Msal.Constants.renewStatus);
            this._cacheStorage.removeAcquireTokenEntries(Msal.Constants.authority + Msal.Constants.resourceDelimeter, Msal.Constants.renewStatus);
            this._cacheStorage.resetCacheItems();
        }
        openPopup(urlNavigate, title, popUpWidth, popUpHeight) {
            try {
                const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
                const winTop = window.screenTop ? window.screenTop : window.screenY;
                const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
                const top = ((height / 2) - (popUpHeight / 2)) + winTop;
                const popupWindow = window.open(urlNavigate, title, 'width=' + popUpWidth + ', height=' + popUpHeight + ', top=' + top + ', left=' + left);
                if (popupWindow.focus) {
                    popupWindow.focus();
                }
                return popupWindow;
            }
            catch (e) {
                this._requestContext.logger.error('error opening popup ' + e.message);
                this._loginInProgress = false;
                this._acquireTokenInProgress = false;
                return null;
            }
        }
        validateInputScope(scopes) {
            if (!scopes || scopes.length < 1) {
                return "Scopes cannot be passed as an empty array";
            }
            if (!Array.isArray(scopes)) {
                throw new Error("API does not accept non-array scopes");
            }
            if (scopes.indexOf(this.clientId) > -1) {
                if (scopes.length > 1) {
                    return "ClientId can only be provided as a single scope";
                }
            }
            return "";
        }
        registerCallback(expectedState, scope, resolve, reject) {
            this._activeRenewals[scope] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            window.callBacksMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] =
                    (errorDesc, token, error, tokenType) => {
                        this._activeRenewals[scope] = null;
                        for (let i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                            try {
                                if (errorDesc || error) {
                                    window.callBacksMappedToRenewStates[expectedState][i].reject(errorDesc + ": " + error);
                                    ;
                                }
                                else if (token) {
                                    window.callBacksMappedToRenewStates[expectedState][i].resolve(token);
                                }
                            }
                            catch (e) {
                                this._requestContext.logger.warning(e);
                            }
                        }
                        window.callBacksMappedToRenewStates[expectedState] = null;
                        window.callBackMappedToRenewStates[expectedState] = null;
                    };
            }
        }
        getCachedToken(authenticationRequest, user) {
            let accessTokenCacheItem = null;
            const scopes = authenticationRequest.scopes;
            const tokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user.userIdentifier);
            if (tokenCacheItems.length === 0) {
                return null;
            }
            const filteredItems = [];
            if (!authenticationRequest.authority) {
                for (let i = 0; i < tokenCacheItems.length; i++) {
                    const cacheItem = tokenCacheItems[i];
                    const cachedScopes = cacheItem.key.scopes.split(" ");
                    if (Msal.Utils.containsScope(cachedScopes, scopes)) {
                        filteredItems.push(cacheItem);
                    }
                }
                if (filteredItems.length === 1) {
                    accessTokenCacheItem = filteredItems[0];
                    authenticationRequest.authorityInstance = Msal.Authority.CreateInstance(accessTokenCacheItem.key.authority, this.validateAuthority);
                }
                else if (filteredItems.length > 1) {
                    return {
                        errorDesc: "The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements like authority",
                        token: null,
                        error: "multiple_matching_tokens_detected"
                    };
                }
                else {
                    const authorityList = this.getUniqueAuthority(tokenCacheItems, 'authority');
                    if (authorityList.length > 1) {
                        return {
                            errorDesc: "Multiple authorities found in the cache. Pass authority in the API overload.",
                            token: null,
                            error: "multiple_matching_tokens_detected"
                        };
                    }
                    authenticationRequest.authorityInstance = Msal.Authority.CreateInstance(authorityList[0], this.validateAuthority);
                }
            }
            else {
                for (let i = 0; i < tokenCacheItems.length; i++) {
                    const cacheItem = tokenCacheItems[i];
                    const cachedScopes = cacheItem.key.scopes.split(" ");
                    if (Msal.Utils.containsScope(cachedScopes, scopes) && cacheItem.key.authority === authenticationRequest.authority) {
                        filteredItems.push(cacheItem);
                    }
                }
                if (filteredItems.length === 0) {
                    return null;
                }
                else if (filteredItems.length === 1) {
                    accessTokenCacheItem = filteredItems[0];
                }
                else {
                    return {
                        errorDesc: "The cache contains multiple tokens satisfying the requirements.Call AcquireToken again providing more requirements like authority",
                        token: null,
                        error: "multiple_matching_tokens_detected"
                    };
                }
            }
            if (accessTokenCacheItem != null) {
                const expired = Number(accessTokenCacheItem.value.expiresIn);
                const offset = this._clockSkew || 300;
                if (expired && (expired > Msal.Utils.now() + offset)) {
                    return {
                        errorDesc: null,
                        token: accessTokenCacheItem.value.accessToken,
                        error: null
                    };
                }
                else {
                    this._cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
                    return null;
                }
            }
            else {
                return null;
            }
        }
        getAllUsers() {
            const users = [];
            const accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(Msal.Constants.clientId, Msal.Constants.authority);
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                const idToken = new Msal.IdToken(accessTokenCacheItems[i].value.idToken);
                const clientInfo = new Msal.ClientInfo(accessTokenCacheItems[i].value.clientInfo);
                const user = Msal.User.createUser(idToken, clientInfo, this.authority);
                users.push(user);
            }
            return this.getUniqueUsers(users);
        }
        getUniqueUsers(users) {
            if (!users || users.length <= 1) {
                return users;
            }
            const flags = [];
            const uniqueUsers = [];
            for (let index = 0; index < users.length; ++index) {
                if (users[index].userIdentifier && flags.indexOf(users[index].userIdentifier) === -1) {
                    flags.push(users[index].userIdentifier);
                    uniqueUsers.push(users[index]);
                }
            }
            return uniqueUsers;
        }
        getUniqueAuthority(accessTokenCacheItems, property) {
            const authorityList = [];
            const flags = [];
            accessTokenCacheItems.forEach(element => {
                if (element.key.hasOwnProperty(property) && (flags.indexOf(element.key[property]) === -1)) {
                    flags.push(element.key[property]);
                    authorityList.push(element.key[property]);
                }
            });
            return authorityList;
        }
        addHintParameters(urlNavigate, user) {
            const userObject = user ? user : this._user;
            const decodedClientInfo = userObject.userIdentifier.split('.');
            const uid = Msal.Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
            const utid = Msal.Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);
            if (userObject.displayableId && !Msal.Utils.isEmpty(userObject.displayableId)) {
                urlNavigate += '&login_hint=' + encodeURIComponent(user.displayableId);
            }
            if (!Msal.Utils.isEmpty(uid) && !Msal.Utils.isEmpty(utid)) {
                if (!this.urlContainsQueryStringParameter("domain_req", urlNavigate) && !Msal.Utils.isEmpty(utid)) {
                    urlNavigate += '&domain_req=' + encodeURIComponent(utid);
                }
                if (!this.urlContainsQueryStringParameter("login_req", urlNavigate) && !Msal.Utils.isEmpty(uid)) {
                    urlNavigate += '&login_req=' + encodeURIComponent(uid);
                }
                if (!this.urlContainsQueryStringParameter("domain_hint", urlNavigate) && !Msal.Utils.isEmpty(utid)) {
                    if (utid === "9188040d-6c67-4c5b-b112-36a304b66dad") {
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
            const regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }
        acquireTokenRedirect(scopes, authority, user, extraQueryParameters) {
            const isValidScope = this.validateInputScope(scopes);
            if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback(isValidScope, null, null, Msal.Constants.accessToken);
                    return;
                }
            }
            const userObject = user ? user : this._user;
            if (this._acquireTokenInProgress) {
                return;
            }
            const scope = scopes.join(" ").toLowerCase();
            if (!userObject) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback("user login is required", null, null, Msal.Constants.accessToken);
                    return;
                }
            }
            this._acquireTokenInProgress = true;
            let authenticationRequest;
            let acquireTokenAuthority = authority ? Msal.Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
            acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
                if (Msal.Utils.compareObjects(userObject, this._user)) {
                    authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
                }
                else {
                    authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
                }
                this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                authenticationRequest.state = authenticationRequest.state + "|" + scope;
                const acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + userObject.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                if (Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                    this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                }
                const authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                    this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);
                }
                if (extraQueryParameters) {
                    authenticationRequest.extraQueryParameters = extraQueryParameters;
                }
                let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                urlNavigate = this.addHintParameters(urlNavigate, userObject);
                if (urlNavigate) {
                    this._cacheStorage.setItem(Msal.Constants.stateAcquireToken, authenticationRequest.state);
                    window.location.replace(urlNavigate);
                }
            });
        }
        acquireTokenPopup(scopes, authority, user, extraQueryParameters) {
            return new Promise((resolve, reject) => {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                    reject(isValidScope);
                }
                const userObject = user ? user : this._user;
                if (this._acquireTokenInProgress) {
                    reject("AcquireToken is in progress");
                    return;
                }
                const scope = scopes.join(" ").toLowerCase();
                if (!userObject) {
                    reject("user login is required");
                    return;
                }
                this._acquireTokenInProgress = true;
                let authenticationRequest;
                let acquireTokenAuthority = authority ? Msal.Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
                acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
                    if (Msal.Utils.compareObjects(userObject, this._user)) {
                        authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
                    }
                    else {
                        authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
                    }
                    this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                    authenticationRequest.state = authenticationRequest.state + "|" + scope;
                    const acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + userObject.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                    if (Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                        this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                    }
                    const authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                    if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                        this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);
                    }
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }
                    let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                    urlNavigate = this.addHintParameters(urlNavigate, userObject);
                    this._renewStates.push(authenticationRequest.state);
                    this.registerCallback(authenticationRequest.state, scope, resolve, reject);
                    this.openWindow(urlNavigate, "acquireToken", 1, this, resolve, reject);
                });
            });
        }
        acquireTokenSilent(scopes, authority, user, extraQueryParameters) {
            return new Promise((resolve, reject) => {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                    reject(isValidScope);
                }
                else {
                    const scope = scopes.join(" ").toLowerCase();
                    const userObject = user ? user : this._user;
                    if (!userObject) {
                        reject("user login is required");
                        return;
                    }
                    let authenticationRequest;
                    let newAuthority = authority ? Msal.Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
                    if (Msal.Utils.compareObjects(userObject, this._user)) {
                        authenticationRequest = new Msal.AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
                    }
                    else {
                        authenticationRequest = new Msal.AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
                    }
                    const cacheResult = this.getCachedToken(authenticationRequest, userObject);
                    if (cacheResult) {
                        if (cacheResult.token) {
                            this._requestContext.logger.info('Token is already in cache for scope:' + scope);
                            resolve(cacheResult.token);
                            return;
                        }
                        else if (cacheResult.errorDesc || cacheResult.error) {
                            this._requestContext.logger.info(cacheResult.errorDesc + ":" + cacheResult.error);
                            reject(cacheResult.errorDesc + ": " + cacheResult.error);
                            return;
                        }
                    }
                    return this.authorityInstance.ResolveEndpointsAsync()
                        .then(() => {
                        if (this._activeRenewals[scope]) {
                            this.registerCallback(this._activeRenewals[scope], scope, resolve, reject);
                        }
                        else {
                            if (scopes && scopes.indexOf(this.clientId) > -1 && scopes.length === 1) {
                                this._requestContext.logger.verbose("renewing idToken");
                                this.renewIdToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
                            }
                            else {
                                this._requestContext.logger.verbose("renewing accesstoken");
                                this.renewToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
                            }
                        }
                    });
                }
            });
        }
        loadFrameTimeout(urlNavigate, frameName, scope) {
            this._requestContext.logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.setItem(Msal.Constants.renewStatus + scope, Msal.Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            setTimeout(() => {
                if (this._cacheStorage.getItem(Msal.Constants.renewStatus + scope) === Msal.Constants.tokenRenewStatusInProgress) {
                    this._requestContext.logger.verbose('Loading frame has timed out after: ' + (Msal.Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    const expectedState = this._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState])
                        window.callBackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, null, Msal.Constants.accessToken);
                    this._cacheStorage.setItem(Msal.Constants.renewStatus + scope, Msal.Constants.tokenRenewStatusCancelled);
                }
            }, Msal.Constants.loadFrameTimeout);
        }
        loadFrame(urlNavigate, frameName) {
            this._requestContext.logger.info('LoadFrame: ' + frameName);
            var frameCheck = frameName;
            setTimeout(() => {
                var frameHandle = this.addAdalFrame(frameCheck);
                if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                    frameHandle.src = urlNavigate;
                }
            }, 500);
        }
        addAdalFrame(iframeId) {
            if (typeof iframeId === "undefined") {
                return null;
            }
            this._requestContext.logger.info('Add msal frame to document:' + iframeId);
            let adalFrame = document.getElementById(iframeId);
            if (!adalFrame) {
                if (document.createElement &&
                    document.documentElement &&
                    (window.navigator.userAgent.indexOf("MSIE 5.0") === -1)) {
                    const ifr = document.createElement("iframe");
                    ifr.setAttribute("id", iframeId);
                    ifr.style.visibility = "hidden";
                    ifr.style.position = "absolute";
                    ifr.style.width = ifr.style.height = "0";
                    adalFrame = document.getElementsByTagName("body")[0].appendChild(ifr);
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
        renewToken(scopes, resolve, reject, user, authenticationRequest, extraQueryParameters) {
            const scope = scopes.join(" ").toLowerCase();
            this._requestContext.logger.verbose('renewToken is called for scope:' + scope);
            const frameHandle = this.addAdalFrame('msalRenewFrame' + scope);
            authenticationRequest.state = authenticationRequest.state + "|" + scope;
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            const acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + user.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
            }
            const authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
            }
            this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=none";
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, scope, resolve, reject);
            this._requestContext.logger.infoPii('Navigate to:' + urlNavigate);
            frameHandle.src = "about:blank";
            this.loadFrameTimeout(urlNavigate, 'msalRenewFrame' + scope, scope);
        }
        renewIdToken(scopes, resolve, reject, user, authenticationRequest, extraQueryParameters) {
            const scope = scopes.join(" ").toLowerCase();
            this._requestContext.logger.info('renewidToken is called');
            const frameHandle = this.addAdalFrame("msalIdTokenFrame");
            authenticationRequest.state = authenticationRequest.state + "|" + this.clientId;
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            const acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + user.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
            }
            const authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
            }
            this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=none";
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, resolve, reject);
            this._requestContext.logger.infoPii('Navigate to:' + urlNavigate);
            frameHandle.src = "about:blank";
            this.loadFrameTimeout(urlNavigate, "adalIdTokenFrame", this.clientId);
        }
        getUser() {
            if (this._user) {
                return this._user;
            }
            const rawIdToken = this._cacheStorage.getItem(Msal.Constants.idTokenKey);
            const rawClientInfo = this._cacheStorage.getItem(Msal.Constants.clientInfo);
            if (!Msal.Utils.isEmpty(rawIdToken) && !Msal.Utils.isEmpty(rawClientInfo)) {
                const idToken = new Msal.IdToken(rawIdToken);
                const clientInfo = new Msal.ClientInfo(rawClientInfo);
                this._user = Msal.User.createUser(idToken, clientInfo, this.authority);
                return this._user;
            }
            return null;
        }
        ;
        handleAuthenticationResponse(hash, resolve, reject) {
            if (hash == null) {
                hash = window.location.hash;
            }
            if (this.isCallback(hash)) {
                const requestInfo = this.getRequestInfo(hash);
                this._requestContext.logger.info("Returned from redirect url");
                this.saveTokenFromHash(requestInfo);
                let token = null, tokenReceivedCallback = null, tokenType;
                if ((requestInfo.requestType === Msal.Constants.renewToken) && window.parent) {
                    if (window.parent !== window)
                        this._requestContext.logger.verbose("Window is in iframe, acquiring token silently");
                    else
                        this._requestContext.logger.verbose("acquiring token interactive in progress");
                    if (window.parent.callBackMappedToRenewStates[requestInfo.stateResponse])
                        tokenReceivedCallback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    else
                        tokenReceivedCallback = this._tokenReceivedCallback;
                    token = requestInfo.parameters[Msal.Constants.accessToken] || requestInfo.parameters[Msal.Constants.idToken];
                    tokenType = Msal.Constants.accessToken;
                }
                else if (requestInfo.requestType === Msal.Constants.login) {
                    tokenReceivedCallback = this._tokenReceivedCallback;
                    token = requestInfo.parameters[Msal.Constants.idToken];
                    tokenType = Msal.Constants.idToken;
                }
                try {
                    var errorDesc = this._cacheStorage.getItem(Msal.Constants.errorDescription);
                    var error = this._cacheStorage.getItem(Msal.Constants.error);
                    if (error || errorDesc) {
                        if (reject) {
                            reject(errorDesc + ": " + error);
                        }
                    }
                    if (resolve) {
                        resolve(token);
                    }
                    else if (tokenReceivedCallback) {
                        tokenReceivedCallback(this._cacheStorage.getItem(Msal.Constants.errorDescription), token, this._cacheStorage.getItem(Msal.Constants.error), tokenType);
                    }
                }
                catch (err) {
                    this._requestContext.logger.error('Error occurred in token received callback function: ' + err);
                }
                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = "";
                    if (this.navigateToLoginRequestUrl && window.location.href.replace("#", "") !== this._cacheStorage.getItem(Msal.Constants.loginRequest))
                        window.location.href = this._cacheStorage.getItem(Msal.Constants.loginRequest);
                }
            }
        }
        saveAccessToken(authority, tokenResponse, user, clientInfo, idToken) {
            let scope;
            let clientObj = new Msal.ClientInfo(clientInfo);
            if (tokenResponse.parameters.hasOwnProperty("scope")) {
                scope = tokenResponse.parameters["scope"];
                const consentedScopes = scope.split(" ");
                const accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, authority);
                for (let i = 0; i < accessTokenCacheItems.length; i++) {
                    const accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
                        const cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
                        if (Msal.Utils.isIntersectingScopes(cachedScopes, consentedScopes))
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
                const accessTokenKey = new Msal.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
                const accessTokenValue = new Msal.AccessTokenValue(tokenResponse.parameters[Msal.Constants.accessToken], idToken.rawIdToken, Msal.Utils.expiresIn(tokenResponse.parameters[Msal.Constants.expiresIn]).toString(), clientInfo);
                this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
            else {
                scope = this.clientId;
                const accessTokenKey = new Msal.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
                const accessTokenValue = new Msal.AccessTokenValue(tokenResponse.parameters[Msal.Constants.idToken], tokenResponse.parameters[Msal.Constants.idToken], idToken.expiration, clientInfo);
                this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
        }
        saveTokenFromHash(tokenResponse) {
            this._requestContext.logger.info('State status:' + tokenResponse.stateMatch + '; Request type:' + tokenResponse.requestType);
            this._cacheStorage.setItem(Msal.Constants.error, "");
            this._cacheStorage.setItem(Msal.Constants.errorDescription, "");
            var scope = this.getScopeFromState(tokenResponse.stateResponse);
            if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.errorDescription)) {
                this._requestContext.logger.info('Error :' + tokenResponse.parameters[Msal.Constants.error] + '; Error description:' + tokenResponse.parameters[Msal.Constants.errorDescription]);
                this._cacheStorage.setItem(Msal.Constants.error, tokenResponse.parameters["error"]);
                this._cacheStorage.setItem(Msal.Constants.errorDescription, tokenResponse.parameters[Msal.Constants.errorDescription]);
                if (tokenResponse.requestType === Msal.Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.setItem(Msal.Constants.loginError, tokenResponse.parameters["errorDescription"]);
                }
                if (tokenResponse.requestType === Msal.Constants.renewToken) {
                    this._acquireTokenInProgress = false;
                }
            }
            else {
                if (tokenResponse.stateMatch) {
                    this._requestContext.logger.info("State is right");
                    if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.sessionState))
                        this._cacheStorage.setItem(Msal.Constants.sessionState, tokenResponse.parameters[Msal.Constants.sessionState]);
                    var idToken;
                    var clientInfo = '';
                    if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.accessToken)) {
                        this._requestContext.logger.info("Fragment has access token");
                        this._acquireTokenInProgress = false;
                        let user;
                        if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.idToken)) {
                            idToken = new Msal.IdToken(tokenResponse.parameters[Msal.Constants.idToken]);
                        }
                        else {
                            idToken = new Msal.IdToken(this._cacheStorage.getItem(Msal.Constants.idTokenKey));
                        }
                        let authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + tokenResponse.stateResponse;
                        let authority;
                        if (!Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                            authority = this._cacheStorage.getItem(authorityKey);
                            authority = Msal.Utils.replaceFirstPath(authority, idToken.tenantId);
                        }
                        if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.clientInfo)) {
                            clientInfo = tokenResponse.parameters[Msal.Constants.clientInfo];
                            user = Msal.User.createUser(idToken, new Msal.ClientInfo(clientInfo), authority);
                        }
                        else {
                            this._requestContext.logger.warning("ClientInfo not received in the response from AAD");
                            user = Msal.User.createUser(idToken, new Msal.ClientInfo(clientInfo), authority);
                        }
                        let acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + user.userIdentifier + Msal.Constants.resourceDelimeter + tokenResponse.stateResponse;
                        let acquireTokenUser;
                        if (!Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                            acquireTokenUser = JSON.parse(this._cacheStorage.getItem(acquireTokenUserKey));
                            if (user && acquireTokenUser && Msal.Utils.compareObjects(user, acquireTokenUser)) {
                                this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
                                this._requestContext.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
                            }
                            else {
                                this._requestContext.logger.warning("The user object created from the response is not the same as the one passed in the acquireToken request");
                            }
                        }
                    }
                    if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.idToken)) {
                        if (scope.indexOf(this.clientId) > -1) {
                            this._requestContext.logger.info("Fragment has id token");
                            this._loginInProgress = false;
                            idToken = new Msal.IdToken(tokenResponse.parameters[Msal.Constants.idToken]);
                            if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.clientInfo)) {
                                clientInfo = tokenResponse.parameters[Msal.Constants.clientInfo];
                            }
                            else {
                                this._requestContext.logger.warning("ClientInfo not received in the response from AAD");
                            }
                            let authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + tokenResponse.stateResponse;
                            let authority;
                            if (!Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                                authority = this._cacheStorage.getItem(authorityKey);
                                authority = Msal.Utils.replaceFirstPath(authority, idToken.tenantId);
                            }
                            this._user = Msal.User.createUser(idToken, new Msal.ClientInfo(clientInfo), authority);
                            if (idToken && idToken.nonce) {
                                if (idToken.nonce !== this._cacheStorage.getItem(Msal.Constants.nonceIdToken)) {
                                    this._user = null;
                                    this._cacheStorage.setItem(Msal.Constants.loginError, 'Nonce Mismatch.Expected: ' + this._cacheStorage.getItem(Msal.Constants.nonceIdToken) + ',' + 'Actual: ' + idToken.nonce);
                                }
                                else {
                                    this._cacheStorage.setItem(Msal.Constants.idTokenKey, tokenResponse.parameters[Msal.Constants.idToken]);
                                    this._cacheStorage.setItem(Msal.Constants.clientInfo, clientInfo);
                                    this.saveAccessToken(authority, tokenResponse, this._user, clientInfo, idToken);
                                }
                            }
                            else {
                                this._cacheStorage.setItem(Msal.Constants.error, 'invalid idToken');
                                this._cacheStorage.setItem(Msal.Constants.errorDescription, 'Invalid idToken. idToken: ' + tokenResponse.parameters[Msal.Constants.idToken]);
                            }
                        }
                    }
                }
                else {
                    this._cacheStorage.setItem(Msal.Constants.error, 'Invalid_state');
                    this._cacheStorage.setItem(Msal.Constants.errorDescription, 'Invalid_state. state: ' + tokenResponse.stateResponse);
                }
            }
            this._cacheStorage.setItem(Msal.Constants.renewStatus + scope, Msal.Constants.tokenRenewStatusCompleted);
            this._cacheStorage.removeAcquireTokenEntries(Msal.Constants.acquireTokenUser, Msal.Constants.renewStatus);
            this._cacheStorage.removeAcquireTokenEntries(Msal.Constants.authority + Msal.Constants.resourceDelimeter, Msal.Constants.renewStatus);
        }
        ;
        isCallback(hash) {
            hash = this.getHash(hash);
            const parameters = Msal.Utils.deserialize(hash);
            return (parameters.hasOwnProperty(Msal.Constants.errorDescription) ||
                parameters.hasOwnProperty(Msal.Constants.accessToken) ||
                parameters.hasOwnProperty(Msal.Constants.idToken));
        }
        getHash(hash) {
            if (hash.indexOf("#/") > -1) {
                hash = hash.substring(hash.indexOf("#/") + 2);
            }
            else if (hash.indexOf("#") > -1) {
                hash = hash.substring(1);
            }
            return hash;
        }
        ;
        getRequestInfo(hash) {
            hash = this.getHash(hash);
            const parameters = Msal.Utils.deserialize(hash);
            const tokenResponse = new Msal.TokenResponse();
            if (parameters) {
                tokenResponse.parameters = parameters;
                if (parameters.hasOwnProperty(Msal.Constants.errorDescription) ||
                    parameters.hasOwnProperty(Msal.Constants.accessToken) ||
                    parameters.hasOwnProperty(Msal.Constants.idToken)) {
                    tokenResponse.valid = true;
                    let stateResponse;
                    if (parameters.hasOwnProperty("state"))
                        stateResponse = parameters.state;
                    else
                        return tokenResponse;
                    tokenResponse.stateResponse = stateResponse;
                    if (stateResponse === this._cacheStorage.getItem(Msal.Constants.stateLogin)) {
                        tokenResponse.requestType = Msal.Constants.login;
                        tokenResponse.stateMatch = true;
                        return tokenResponse;
                    }
                    else if (stateResponse === this._cacheStorage.getItem(Msal.Constants.stateAcquireToken)) {
                        tokenResponse.requestType = Msal.Constants.renewToken;
                        tokenResponse.stateMatch = true;
                        return tokenResponse;
                    }
                    if (!tokenResponse.stateMatch && window.parent && window.parent.msal) {
                        const clientApplication = window.parent.msal;
                        const statesInParentContext = clientApplication._renewStates;
                        for (let i = 0; i < statesInParentContext.length; i++) {
                            if (statesInParentContext[i] === tokenResponse.stateResponse) {
                                tokenResponse.requestType = Msal.Constants.renewToken;
                                tokenResponse.stateMatch = true;
                                break;
                            }
                        }
                    }
                }
            }
            return tokenResponse;
        }
        ;
        getScopeFromState(state) {
            if (state) {
                const splitIndex = state.indexOf("|");
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return "";
        }
        ;
    }
    Msal.UserAgentApplication = UserAgentApplication;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class Utils {
        static compareObjects(u1, u2) {
            if (!u1 || !u2)
                return false;
            if (u1.userIdentifier && u2.userIdentifier) {
                if (u1.userIdentifier === u2.userIdentifier) {
                    return true;
                }
            }
            return false;
        }
        ;
        static expiresIn(expires) {
            if (!expires)
                expires = "3599";
            return this.now() + parseInt(expires, 10);
        }
        ;
        static now() {
            return Math.round(new Date().getTime() / 1000.0);
        }
        ;
        static isEmpty(str) {
            return (typeof str === "undefined" || !str || 0 === str.length);
        }
        ;
        static extractIdToken(encodedIdToken) {
            const decodedToken = this.decodeJwt(encodedIdToken);
            if (!decodedToken) {
                return null;
            }
            try {
                const base64IdToken = decodedToken.JWSPayload;
                const base64Decoded = this.base64DecodeStringUrlSafe(base64IdToken);
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
            base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken));
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        }
        ;
        static encode(input) {
            const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            let output = "";
            let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
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
                output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }
            return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
            var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            base64IdToken = String(base64IdToken).replace(/=+$/, "");
            var length = base64IdToken.length;
            if (length % 4 === 1) {
                throw new Error("The token to be decoded is not correctly encoded.");
            }
            let h1, h2, h3, h4, bits, c1, c2, c3, decoded = "";
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
            const idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
            const matches = idTokenPartsRegex.exec(jwtToken);
            if (!matches || matches.length < 4) {
                return null;
            }
            const crackedToken = {
                header: matches[1],
                JWSPayload: matches[2],
                JWSSig: matches[3]
            };
            return crackedToken;
        }
        ;
        static deserialize(query) {
            let match;
            const pl = /\+/g;
            const search = /([^&=]+)=([^&]*)/g;
            const decode = (s) => decodeURIComponent(s.replace(pl, " "));
            const obj = {};
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
            return scopes.every((value) => cachedScopes.indexOf(value.toString().toLowerCase()) >= 0);
        }
        static convertToLowerCase(scopes) {
            return scopes.map(scope => scope.toLowerCase());
        }
        static removeElement(scopes, scope) {
            return scopes.filter(value => value !== scope);
        }
        static decimalToHex(num) {
            var hex = num.toString(16);
            while (hex.length < 2) {
                hex = "0" + hex;
            }
            return hex;
        }
        static getLibraryVersion() {
            return "0.1.0";
        }
        static replaceFirstPath(href, tenantId) {
            var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
            if (match) {
                var urlObject = Utils.GetUrlComponents(href);
                var pathArray = urlObject.PathSegments;
                pathArray.shift();
                if (pathArray[0] && pathArray[0] === 'common' || pathArray[0] === 'organizations') {
                    pathArray[0] = tenantId;
                    href = urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join('/');
                }
            }
            return href;
        }
        static createNewGuid() {
            const cryptoObj = window.crypto;
            if (cryptoObj && cryptoObj.getRandomValues) {
                const buffer = new Uint8Array(16);
                cryptoObj.getRandomValues(buffer);
                buffer[6] |= 0x40;
                buffer[6] &= 0x4f;
                buffer[8] |= 0x80;
                buffer[8] &= 0xbf;
                return Utils.decimalToHex(buffer[0]) + Utils.decimalToHex(buffer[1])
                    + Utils.decimalToHex(buffer[2]) + Utils.decimalToHex(buffer[3])
                    + "-" + Utils.decimalToHex(buffer[4]) + Utils.decimalToHex(buffer[5])
                    + "-" + Utils.decimalToHex(buffer[6]) + Utils.decimalToHex(buffer[7])
                    + "-" + Utils.decimalToHex(buffer[8]) + Utils.decimalToHex(buffer[9])
                    + "-" + Utils.decimalToHex(buffer[10]) + Utils.decimalToHex(buffer[11])
                    + Utils.decimalToHex(buffer[12]) + Utils.decimalToHex(buffer[13])
                    + Utils.decimalToHex(buffer[14]) + Utils.decimalToHex(buffer[15]);
            }
            else {
                const guidHolder = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
                const hex = "0123456789abcdef";
                let r = 0;
                let guidResponse = "";
                for (let i = 0; i < 36; i++) {
                    if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
                        r = Math.random() * 16 | 0;
                    }
                    if (guidHolder[i] === "x") {
                        guidResponse += hex[r];
                    }
                    else if (guidHolder[i] === "y") {
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
        static GetUrlComponents(url) {
            if (!url) {
                throw "Url required";
            }
            var regEx = new RegExp(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
            var match = url.match(regEx);
            if (!match || match.length < 6) {
                throw "Valid url required";
            }
            let urlComponents = {
                Protocol: match[1],
                HostNameAndPort: match[4],
                AbsolutePath: match[5]
            };
            let pathSegments = urlComponents.AbsolutePath.split("/");
            pathSegments = pathSegments.filter((val) => val && val.length > 0);
            urlComponents.PathSegments = pathSegments;
            return urlComponents;
        }
        static CanonicalizeUri(url) {
            if (url) {
                url = url.toLowerCase();
            }
            if (url && !Utils.endsWith(url, "/")) {
                url += "/";
            }
            return url;
        }
        static endsWith(url, suffix) {
            if (!url || !suffix) {
                return false;
            }
            return url.indexOf(suffix, url.length - suffix.length) !== -1;
        }
    }
    Msal.Utils = Utils;
})(Msal || (Msal = {}));
"use strict";
var Msal;
(function (Msal) {
    class XhrClient {
        sendRequestAsync(url, method, enableCaching) {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                if (enableCaching) {
                }
                xhr.onload = (ev) => {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(this.handleError(xhr.responseText));
                    }
                    try {
                        var jsonResponse = JSON.parse(xhr.responseText);
                    }
                    catch (e) {
                        reject(this.handleError(xhr.responseText));
                    }
                    resolve(jsonResponse);
                };
                xhr.onerror = (ev) => {
                    reject(xhr.status);
                };
                if (method == 'GET') {
                    xhr.send();
                }
                else {
                    throw "not implemented";
                }
            });
        }
        handleError(responseText) {
            var jsonResponse;
            try {
                jsonResponse = JSON.parse(responseText);
                if (jsonResponse.error) {
                    return jsonResponse.error;
                }
                else
                    throw responseText;
            }
            catch (e) {
                return responseText;
            }
        }
    }
    Msal.XhrClient = XhrClient;
})(Msal || (Msal = {}));
//# sourceMappingURL=msal.js.map