/*! msal v0.1.1 2017-05-09 */

'use strict';
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
var Msal;
(function (Msal) {
    var AuthorityType;
    (function (AuthorityType) {
        AuthorityType[AuthorityType["Aad"] = 0] = "Aad";
        AuthorityType[AuthorityType["Adfs"] = 1] = "Adfs";
        AuthorityType[AuthorityType["B2C"] = 2] = "B2C";
    })(AuthorityType = Msal.AuthorityType || (Msal.AuthorityType = {}));
    var Authority = (function () {
        function Authority(authority, validateAuthority) {
            this.IsValidationEnabled = validateAuthority;
            this.CanonicalAuthority = authority;
            this.validateAsUri();
        }
        Object.defineProperty(Authority.prototype, "Tenant", {
            get: function () {
                return this.CanonicalAuthorityUrlComponents.PathSegments[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "AuthorizationEndpoint", {
            get: function () {
                this.validateResolved();
                return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.Tenant);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "EndSessionEndpoint", {
            get: function () {
                this.validateResolved();
                return this.tenantDiscoveryResponse.EndSessionEndpoint.replace("{tenant}", this.Tenant);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "SelfSignedJwtAudience", {
            get: function () {
                this.validateResolved();
                return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.Tenant);
            },
            enumerable: true,
            configurable: true
        });
        Authority.prototype.validateResolved = function () {
            if (!this.tenantDiscoveryResponse) {
                throw "Please call ResolveEndpointsAsync first";
            }
        };
        Object.defineProperty(Authority.prototype, "CanonicalAuthority", {
            get: function () {
                return this.canonicalAuthority;
            },
            set: function (url) {
                this.canonicalAuthority = Msal.Utils.CanonicalizeUri(url);
                this.canonicalAuthorityUrlComponents = null;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Authority.prototype, "CanonicalAuthorityUrlComponents", {
            get: function () {
                if (!this.canonicalAuthorityUrlComponents) {
                    this.canonicalAuthorityUrlComponents = Msal.Utils.GetUrlComponents(this.CanonicalAuthority);
                }
                return this.canonicalAuthorityUrlComponents;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Authority.prototype, "DefaultOpenIdConfigurationEndpoint", {
            get: function () {
                return this.CanonicalAuthority + "v2.0/.well-known/openid-configuration";
            },
            enumerable: true,
            configurable: true
        });
        Authority.prototype.validateAsUri = function () {
            var components;
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
        };
        Authority.DetectAuthorityFromUrl = function (authorityUrl) {
            authorityUrl = Msal.Utils.CanonicalizeUri(authorityUrl);
            var components = Msal.Utils.GetUrlComponents(authorityUrl);
            var pathSegments = components.PathSegments;
            switch (pathSegments[0]) {
                case "tfp":
                    return AuthorityType.B2C;
                case "adfs":
                    return AuthorityType.Adfs;
                default:
                    return AuthorityType.Aad;
            }
        };
        Authority.CreateInstance = function (authorityUrl, validateAuthority) {
            var type = Authority.DetectAuthorityFromUrl(authorityUrl);
            switch (type) {
                case AuthorityType.B2C:
                    return new Msal.B2cAuthority(authorityUrl, validateAuthority);
                case AuthorityType.Aad:
                    return new Msal.AadAuthority(authorityUrl, validateAuthority);
                default:
                    throw Msal.ErrorMessage.invalidAuthorityType;
            }
        };
        Authority.prototype.DiscoverEndpoints = function (openIdConfigurationEndpoint) {
            var client = new Msal.XhrClient();
            return client.sendRequestAsync(openIdConfigurationEndpoint, "GET", true)
                .then(function (response) {
                return {
                    AuthorizationEndpoint: response.authorization_endpoint,
                    EndSessionEndpoint: response.end_session_endpoint,
                    Issuer: response.issuer
                };
            });
        };
        Authority.prototype.ResolveEndpointsAsync = function () {
            var _this = this;
            var openIdConfigurationEndpoint = "";
            return this.GetOpenIdConfigurationEndpointAsync().then(function (openIdConfigurationEndpointResponse) {
                openIdConfigurationEndpoint = openIdConfigurationEndpointResponse;
                return _this.DiscoverEndpoints(openIdConfigurationEndpoint);
            }).then(function (tenantDiscoveryResponse) {
                _this.tenantDiscoveryResponse = tenantDiscoveryResponse;
                return _this;
            });
        };
        return Authority;
    }());
    Msal.Authority = Authority;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var AadAuthority = (function (_super) {
        __extends(AadAuthority, _super);
        function AadAuthority(authority, validateAuthority) {
            return _super.call(this, authority, validateAuthority) || this;
        }
        Object.defineProperty(AadAuthority.prototype, "AadInstanceDiscoveryEndpointUrl", {
            get: function () {
                return AadAuthority.AadInstanceDiscoveryEndpoint + "?api-version=1.0&authorization_endpoint=" + this.CanonicalAuthority + "oauth2/v2.0/authorize";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AadAuthority.prototype, "AuthorityType", {
            get: function () {
                return Msal.AuthorityType.Aad;
            },
            enumerable: true,
            configurable: true
        });
        AadAuthority.prototype.GetOpenIdConfigurationEndpointAsync = function () {
            var _this = this;
            var resultPromise = new Promise(function (resolve, reject) {
                return resolve(_this.DefaultOpenIdConfigurationEndpoint);
            });
            if (!this.IsValidationEnabled) {
                return resultPromise;
            }
            var host = this.CanonicalAuthorityUrlComponents.HostNameAndPort;
            if (this.IsInTrustedHostList(host)) {
                return resultPromise;
            }
            var client = new Msal.XhrClient();
            return client.sendRequestAsync(this.AadInstanceDiscoveryEndpointUrl, "GET", true)
                .then(function (response) {
                return response.tenant_discovery_endpoint;
            });
        };
        AadAuthority.prototype.IsInTrustedHostList = function (host) {
            return AadAuthority.TrustedHostList[host.toLowerCase()];
        };
        return AadAuthority;
    }(Msal.Authority));
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
var Msal;
(function (Msal) {
    var AccessTokenCacheItem = (function () {
        function AccessTokenCacheItem(key, value) {
            this.key = key;
            this.value = value;
        }
        return AccessTokenCacheItem;
    }());
    Msal.AccessTokenCacheItem = AccessTokenCacheItem;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var AccessTokenKey = (function () {
        function AccessTokenKey(authority, clientId, scopes, uid, utid) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scopes;
            this.userIdentifier = Msal.Utils.base64EncodeStringUrlSafe(uid) + "." + Msal.Utils.base64EncodeStringUrlSafe(utid);
        }
        return AccessTokenKey;
    }());
    Msal.AccessTokenKey = AccessTokenKey;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var AccessTokenValue = (function () {
        function AccessTokenValue(accessToken, idToken, expiresIn, clientInfo) {
            this.accessToken = accessToken;
            this.idToken = idToken;
            this.expiresIn = expiresIn;
            this.clientInfo = clientInfo;
        }
        return AccessTokenValue;
    }());
    Msal.AccessTokenValue = AccessTokenValue;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var AuthenticationRequestParameters = (function () {
        function AuthenticationRequestParameters(authority, clientId, scope, responseType, redirectUri) {
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
        Object.defineProperty(AuthenticationRequestParameters.prototype, "authority", {
            get: function () {
                return this.authorityInstance.CanonicalAuthority;
            },
            enumerable: true,
            configurable: true
        });
        AuthenticationRequestParameters.prototype.createNavigateUrl = function (scopes) {
            if (!scopes) {
                scopes = [this.clientId];
            }
            if (scopes.indexOf(this.clientId) === -1) {
                scopes.push(this.clientId);
            }
            var str = [];
            str.push("response_type=" + this.responseType);
            this.translateclientIdUsedInScope(scopes);
            str.push("scope=" + encodeURIComponent(this.parseScope(scopes)));
            str.push("client_id=" + encodeURIComponent(this.clientId));
            str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));
            str.push("state=" + encodeURIComponent(this.state));
            str.push("nonce=" + encodeURIComponent(this.nonce));
            str.push("client_info=1");
            str.push("x-client-SKU=" + this.xClientSku);
            str.push("x-client-Ver=" + this.xClientVer);
            if (this.extraQueryParameters) {
                str.push(this.extraQueryParameters);
            }
            str.push("client-request-id=" + encodeURIComponent(this.correlationId));
            var authEndpoint = this.authorityInstance.AuthorizationEndpoint;
            if (authEndpoint.indexOf("?") < 0) {
                authEndpoint += '?';
            }
            else {
                authEndpoint += '&';
            }
            var requestUrl = "" + authEndpoint + str.join("&");
            return requestUrl;
        };
        AuthenticationRequestParameters.prototype.translateclientIdUsedInScope = function (scopes) {
            var clientIdIndex = scopes.indexOf(this.clientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                if (scopes.indexOf("openid") === -1) {
                    scopes.push("openid");
                }
                if (scopes.indexOf("profile") === -1) {
                    scopes.push("profile");
                }
            }
        };
        AuthenticationRequestParameters.prototype.parseScope = function (scopes) {
            var scopeList = "";
            if (scopes) {
                for (var i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + " " : scopes[i];
                }
            }
            return scopeList;
        };
        return AuthenticationRequestParameters;
    }());
    Msal.AuthenticationRequestParameters = AuthenticationRequestParameters;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var B2cAuthority = (function (_super) {
        __extends(B2cAuthority, _super);
        function B2cAuthority(authority, validateAuthority) {
            var _this = _super.call(this, authority, validateAuthority) || this;
            var urlComponents = Msal.Utils.GetUrlComponents(authority);
            var pathSegments = urlComponents.PathSegments;
            if (pathSegments.length < 3) {
                throw Msal.ErrorMessage.b2cAuthorityUriInvalidPath;
            }
            _this.CanonicalAuthority = "https://" + urlComponents.HostNameAndPort + "/" + pathSegments[0] + "/" + pathSegments[1] + "/" + pathSegments[2] + "/";
            return _this;
        }
        Object.defineProperty(B2cAuthority.prototype, "AuthorityType", {
            get: function () {
                return Msal.AuthorityType.B2C;
            },
            enumerable: true,
            configurable: true
        });
        B2cAuthority.prototype.GetOpenIdConfigurationEndpointAsync = function () {
            var _this = this;
            var resultPromise = new Promise(function (resolve, reject) {
                return resolve(_this.DefaultOpenIdConfigurationEndpoint);
            });
            if (!this.IsValidationEnabled) {
                return resultPromise;
            }
            if (this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
                return resultPromise;
            }
            return new Promise(function (resolve, reject) {
                return reject(Msal.ErrorMessage.unsupportedAuthorityValidation);
            });
        };
        return B2cAuthority;
    }(Msal.AadAuthority));
    Msal.B2cAuthority = B2cAuthority;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var ClientInfo = (function () {
        function ClientInfo(rawClientInfo) {
            if (!rawClientInfo || Msal.Utils.isEmpty(rawClientInfo)) {
                this.uid = "";
                this.utid = "";
                return;
            }
            try {
                var decodedClientInfo = Msal.Utils.base64DecodeStringUrlSafe(rawClientInfo);
                var clientInfo = JSON.parse(decodedClientInfo);
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
        Object.defineProperty(ClientInfo.prototype, "uid", {
            get: function () {
                return this._uid ? this._uid : "";
            },
            set: function (uid) {
                this._uid = uid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClientInfo.prototype, "utid", {
            get: function () {
                return this._utid ? this._utid : "";
            },
            set: function (utid) {
                this._utid = utid;
            },
            enumerable: true,
            configurable: true
        });
        return ClientInfo;
    }());
    Msal.ClientInfo = ClientInfo;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var Constants = (function () {
        function Constants() {
        }
        Object.defineProperty(Constants, "errorDescription", {
            get: function () { return "error_description"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "error", {
            get: function () { return "error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "scope", {
            get: function () { return "scope"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "acquireTokenUser", {
            get: function () { return "msal_acquireTokenUser"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "clientInfo", {
            get: function () { return "client_info"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "clientId", {
            get: function () { return "clientId"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "authority", {
            get: function () { return "authority"; },
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
            get: function () { return "msal.token.keys"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "accessTokenKey", {
            get: function () { return "msal.access.token.key"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "expirationKey", {
            get: function () { return "msal.expiration.key"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "stateLogin", {
            get: function () { return "msal.state.login"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "stateAcquireToken", {
            get: function () { return "msal.state.acquireToken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "stateRenew", {
            get: function () { return "msal.state.renew"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "nonceIdToken", {
            get: function () { return "msal.nonce.idtoken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "userName", {
            get: function () { return "msal.username"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "idTokenKey", {
            get: function () { return "msal.idtoken"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "loginRequest", {
            get: function () { return "msal.login.request"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "loginError", {
            get: function () { return "msal.login.error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Constants, "renewStatus", {
            get: function () { return "msal.token.renew.status"; },
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
        return Constants;
    }());
    Constants._loadFrameTimeout = 6000;
    Constants._popUpWidth = 483;
    Constants._popUpHeight = 600;
    Msal.Constants = Constants;
    var ErrorCodes = (function () {
        function ErrorCodes() {
        }
        Object.defineProperty(ErrorCodes, "loginProgressError", {
            get: function () { return "login_progress_error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorCodes, "acquireTokenProgressError", {
            get: function () { return "acquiretoken_progress_error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorCodes, "inputScopesError", {
            get: function () { return "input_scopes_error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorCodes, "endpointResolutionError", {
            get: function () { return "endpoints_resolution_error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorCodes, "popUpWindowError", {
            get: function () { return "popup_window_error"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorCodes, "userLoginError", {
            get: function () { return "user_login_error"; },
            enumerable: true,
            configurable: true
        });
        return ErrorCodes;
    }());
    Msal.ErrorCodes = ErrorCodes;
    var ErrorDescription = (function () {
        function ErrorDescription() {
        }
        Object.defineProperty(ErrorDescription, "loginProgressError", {
            get: function () { return "Login is in progress"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorDescription, "acquireTokenProgressError", {
            get: function () { return "Acquire token is in progress"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorDescription, "inputScopesError", {
            get: function () { return "Invalid value of input scopes provided"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorDescription, "endpointResolutionError", {
            get: function () { return "Endpoints cannot be resolved"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorDescription, "popUpWindowError", {
            get: function () { return "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser."; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorDescription, "userLoginError", {
            get: function () { return "User login is required"; },
            enumerable: true,
            configurable: true
        });
        return ErrorDescription;
    }());
    Msal.ErrorDescription = ErrorDescription;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var ErrorMessage = (function () {
        function ErrorMessage() {
        }
        Object.defineProperty(ErrorMessage, "authorityUriInvalidPath", {
            get: function () { return "AuthorityUriInvalidPath"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorMessage, "authorityUriInsecure", {
            get: function () { return "AuthorityUriInsecure"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorMessage, "invalidAuthorityType", {
            get: function () { return "InvalidAuthorityType"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorMessage, "unsupportedAuthorityValidation", {
            get: function () { return "UnsupportedAuthorityValidation"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorMessage, "b2cAuthorityUriInvalidPath", {
            get: function () { return "B2cAuthorityUriInvalidPath"; },
            enumerable: true,
            configurable: true
        });
        return ErrorMessage;
    }());
    Msal.ErrorMessage = ErrorMessage;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var IdToken = (function () {
        function IdToken(rawIdToken) {
            if (Msal.Utils.isEmpty(rawIdToken)) {
                throw new Error("null or empty raw idtoken");
            }
            try {
                this.rawIdToken = rawIdToken;
                var decodedIdToken = Msal.Utils.extractIdToken(rawIdToken);
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
        return IdToken;
    }());
    Msal.IdToken = IdToken;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Error"] = 0] = "Error";
        LogLevel[LogLevel["Warning"] = 1] = "Warning";
        LogLevel[LogLevel["Info"] = 2] = "Info";
        LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
    })(LogLevel = Msal.LogLevel || (Msal.LogLevel = {}));
    var Logger = (function () {
        function Logger(correlationId) {
            this._level = LogLevel.Info;
            this._piiLoggingEnabled = false;
            if (Logger._instance) {
                return Logger._instance;
            }
            this._correlationId = correlationId;
            Logger._instance = this;
            return Logger._instance;
        }
        Object.defineProperty(Logger.prototype, "correlationId", {
            get: function () { return this._correlationId; },
            set: function (correlationId) {
                this._correlationId = correlationId;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Logger.prototype, "level", {
            get: function () { return this._level; },
            set: function (logLevel) {
                if (LogLevel[logLevel]) {
                    this._level = logLevel;
                }
                else
                    throw new Error("Provide a valid value for level. Possibles range for logLevel is 0-3");
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Logger.prototype, "piiLoggingEnabled", {
            get: function () { return this._piiLoggingEnabled; },
            set: function (piiLoggingEnabled) {
                this._piiLoggingEnabled = piiLoggingEnabled;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Logger.prototype, "localCallback", {
            get: function () { return this._localCallback; },
            set: function (localCallback) {
                if (this.localCallback) {
                    throw new Error("MSAL logging callback can only be set once per process and should never change once set.");
                }
                this._localCallback = localCallback;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Logger.prototype.logMessage = function (logMessage, logLevel, containsPii) {
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
        };
        Logger.prototype.executeCallback = function (level, message, containsPii) {
            if (this.localCallback) {
                this.localCallback(level, message, containsPii);
            }
        };
        Logger.prototype.error = function (message) {
            this.logMessage(message, LogLevel.Error, false);
        };
        Logger.prototype.errorPii = function (message) {
            this.logMessage(message, LogLevel.Error, true);
        };
        Logger.prototype.warning = function (message) {
            this.logMessage(message, LogLevel.Warning, false);
        };
        Logger.prototype.warningPii = function (message) {
            this.logMessage(message, LogLevel.Warning, true);
        };
        Logger.prototype.info = function (message) {
            this.logMessage(message, LogLevel.Info, false);
        };
        Logger.prototype.infoPii = function (message) {
            this.logMessage(message, LogLevel.Info, true);
        };
        Logger.prototype.verbose = function (message) {
            this.logMessage(message, LogLevel.Verbose, false);
        };
        Logger.prototype.verbosePii = function (message) {
            this.logMessage(message, LogLevel.Verbose, true);
        };
        return Logger;
    }());
    Msal.Logger = Logger;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var RequestContext = (function () {
        function RequestContext(correlationId) {
            if (RequestContext._instance) {
                return RequestContext._instance;
            }
            this._logger = new Msal.Logger(correlationId);
            this._correlationId = this._logger.correlationId;
            RequestContext._instance = this;
        }
        Object.defineProperty(RequestContext.prototype, "correlationId", {
            get: function () { return this._correlationId; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RequestContext.prototype, "logger", {
            get: function () { return this._logger; },
            enumerable: true,
            configurable: true
        });
        return RequestContext;
    }());
    Msal.RequestContext = RequestContext;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var TokenResponse = (function () {
        function TokenResponse() {
            this.valid = false;
            this.parameters = {};
            this.stateMatch = false;
            this.stateResponse = "";
            this.requestType = "unknown";
        }
        return TokenResponse;
    }());
    Msal.TokenResponse = TokenResponse;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var Storage = (function () {
        function Storage(cacheLocation) {
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
        Storage.prototype.setItem = function (key, value) {
            if (window[this._cacheLocation]) {
                window[this._cacheLocation].setItem(key, value);
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        };
        Storage.prototype.getItem = function (key) {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].getItem(key);
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        };
        Storage.prototype.removeItem = function (key) {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].removeItem(key);
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        };
        Storage.prototype.clear = function () {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].clear();
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        };
        Storage.prototype.getAllAccessTokens = function (clientId, userIdentifier) {
            var results = [];
            var accessTokenCacheItem;
            var storage = window[this._cacheLocation];
            if (storage) {
                var key = void 0;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(userIdentifier)) {
                            var value = this.getItem(key);
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
        };
        Storage.prototype.removeAcquireTokenEntries = function (acquireTokenUser, acquireTokenStatus) {
            var storage = window[this._cacheLocation];
            if (storage) {
                var key = void 0;
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
        };
        Storage.prototype.resetCacheItems = function () {
            var storage = window[this._cacheLocation];
            if (storage) {
                var key = void 0;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        storage[key] = "";
                    }
                }
            }
            else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        };
        return Storage;
    }());
    Msal.Storage = Storage;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var Telemetry = (function () {
        function Telemetry() {
        }
        Telemetry.prototype.RegisterReceiver = function (receiverCallback) {
            this.receiverCallback = receiverCallback;
        };
        Telemetry.GetInstance = function () {
            return this.instance || (this.instance = new this());
        };
        return Telemetry;
    }());
    Msal.Telemetry = Telemetry;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var User = (function () {
        function User(displayableId, name, identityProvider, userIdentifier) {
            this.displayableId = displayableId;
            this.name = name;
            this.identityProvider = identityProvider;
            this.userIdentifier = userIdentifier;
        }
        User.createUser = function (idToken, clientInfo, authority) {
            var uid;
            var utid;
            if (!clientInfo) {
                uid = "";
                utid = "";
            }
            else {
                uid = clientInfo.uid;
                utid = clientInfo.utid;
            }
            var userIdentifier = Msal.Utils.base64EncodeStringUrlSafe(uid) + "." + Msal.Utils.base64EncodeStringUrlSafe(utid);
            return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier);
        };
        return User;
    }());
    Msal.User = User;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var ResponseTypes = {
        id_token: "id_token",
        token: "token",
        id_token_token: "id_token token"
    };
    var UserAgentApplication = (function () {
        function UserAgentApplication(clientId, authority, tokenReceivedCallback, validateAuthority) {
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
            if (!window.opener) {
                var isCallback = this.isCallback(window.location.hash);
                if (isCallback)
                    this.handleAuthenticationResponse(window.location.hash);
            }
        }
        Object.defineProperty(UserAgentApplication.prototype, "cacheLocation", {
            get: function () {
                return this._cacheLocation;
            },
            set: function (cache) {
                this._cacheLocation = cache;
                if (this._cacheLocations[cache]) {
                    this._cacheStorage = new Msal.Storage(this._cacheLocations[cache]);
                }
                else {
                    throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UserAgentApplication.prototype, "authority", {
            get: function () {
                return this.authorityInstance.CanonicalAuthority;
            },
            set: function (val) {
                this.authorityInstance = Msal.Authority.CreateInstance(val, this.validateAuthority);
            },
            enumerable: true,
            configurable: true
        });
        UserAgentApplication.prototype.loginRedirect = function (scopes, extraQueryParameters) {
            var _this = this;
            if (this._loginInProgress) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback("Login is in progress", null, null, Msal.Constants.idToken);
                    return;
                }
            }
            if (scopes) {
                var isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                    if (this._tokenReceivedCallback) {
                        this._tokenReceivedCallback(isValidScope, null, null, Msal.Constants.idToken);
                        return;
                    }
                }
                scopes = this.filterScopes(scopes);
            }
            this.authorityInstance.ResolveEndpointsAsync()
                .then(function () {
                var authenticationRequest = new Msal.AuthenticationRequestParameters(_this.authorityInstance, _this.clientId, scopes, ResponseTypes.id_token, _this.redirectUri);
                if (extraQueryParameters) {
                    authenticationRequest.extraQueryParameters = extraQueryParameters;
                }
                _this._cacheStorage.setItem(Msal.Constants.loginRequest, window.location.href);
                _this._cacheStorage.setItem(Msal.Constants.loginError, "");
                _this._cacheStorage.setItem(Msal.Constants.stateLogin, authenticationRequest.state);
                _this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                _this._cacheStorage.setItem(Msal.Constants.error, "");
                _this._cacheStorage.setItem(Msal.Constants.errorDescription, "");
                var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                if (Msal.Utils.isEmpty(_this._cacheStorage.getItem(authorityKey))) {
                    _this._cacheStorage.setItem(authorityKey, _this.authority);
                }
                var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                _this._loginInProgress = true;
                _this.promptUser(urlNavigate);
            });
        };
        UserAgentApplication.prototype.loginPopup = function (scopes, extraQueryParameters) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this._interactionMode = _this._interactionModes.popUp;
                if (_this._loginInProgress) {
                    reject(Msal.ErrorCodes.loginProgressError + ':' + Msal.ErrorDescription.loginProgressError);
                    return;
                }
                if (scopes) {
                    var isValidScope = _this.validateInputScope(scopes);
                    if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                        reject(Msal.ErrorCodes.inputScopesError + ':' + Msal.ErrorDescription.inputScopesError);
                        return;
                    }
                    scopes = _this.filterScopes(scopes);
                }
                var popUpWindow = _this.openWindow('about:blank', '_blank', 1, _this, resolve, reject);
                if (!popUpWindow) {
                    return;
                }
                _this.authorityInstance.ResolveEndpointsAsync().then(function () {
                    var authenticationRequest = new Msal.AuthenticationRequestParameters(_this.authorityInstance, _this.clientId, scopes, ResponseTypes.id_token, _this.redirectUri);
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }
                    _this._cacheStorage.setItem(Msal.Constants.loginRequest, window.location.href);
                    _this._cacheStorage.setItem(Msal.Constants.loginError, "");
                    _this._cacheStorage.setItem(Msal.Constants.stateLogin, authenticationRequest.state);
                    _this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                    _this._cacheStorage.setItem(Msal.Constants.error, "");
                    _this._cacheStorage.setItem(Msal.Constants.errorDescription, "");
                    var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                    if (Msal.Utils.isEmpty(_this._cacheStorage.getItem(authorityKey))) {
                        _this._cacheStorage.setItem(authorityKey, _this.authority);
                    }
                    var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                    _this._loginInProgress = true;
                    if (popUpWindow) {
                        popUpWindow.location.href = urlNavigate;
                    }
                }, function () {
                    _this._requestContext.logger.info(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    _this._cacheStorage.setItem(Msal.Constants.error, Msal.ErrorCodes.endpointResolutionError);
                    _this._cacheStorage.setItem(Msal.Constants.errorDescription, Msal.ErrorDescription.endpointResolutionError);
                    if (reject) {
                        reject(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    }
                    if (popUpWindow) {
                        popUpWindow.close();
                    }
                });
            });
        };
        UserAgentApplication.prototype.promptUser = function (urlNavigate) {
            if (urlNavigate && !Msal.Utils.isEmpty(urlNavigate)) {
                this._requestContext.logger.info('Navigate to:' + urlNavigate);
                window.location.replace(urlNavigate);
            }
            else {
                this._requestContext.logger.info('Navigate url is empty');
            }
        };
        ;
        UserAgentApplication.prototype.openWindow = function (urlNavigate, title, interval, instance, resolve, reject) {
            var _this = this;
            var popupWindow = this.openPopup(urlNavigate, title, Msal.Constants.popUpWidth, Msal.Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
                this._requestContext.logger.info(Msal.ErrorCodes.popUpWindowError + ':' + Msal.ErrorDescription.popUpWindowError);
                this._cacheStorage.setItem(Msal.Constants.error, Msal.ErrorCodes.popUpWindowError);
                this._cacheStorage.setItem(Msal.Constants.errorDescription, Msal.ErrorDescription.popUpWindowError);
                if (reject) {
                    reject(Msal.ErrorCodes.popUpWindowError + ':' + Msal.ErrorDescription.popUpWindowError);
                }
                return null;
            }
            var pollTimer = window.setInterval(function () {
                if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
                    instance._loginInProgress = false;
                    instance._acquireTokenInProgress = false;
                    window.clearInterval(pollTimer);
                }
                try {
                    if (popupWindow.location.href.indexOf(_this.redirectUri) !== -1) {
                        _this.handleAuthenticationResponse(popupWindow.location.hash, resolve, reject);
                        window.clearInterval(pollTimer);
                        instance._loginInProgress = false;
                        instance._acquireTokenInProgress = false;
                        _this._requestContext.logger.info("Closing popup window");
                        popupWindow.close();
                    }
                }
                catch (e) {
                }
            }, interval);
            return popupWindow;
        };
        UserAgentApplication.prototype.logout = function () {
            this.clearCache();
            this._user = null;
            var logout = "";
            if (this.postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.postLogoutredirectUri);
            }
            var urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
            this.promptUser(urlNavigate);
        };
        UserAgentApplication.prototype.clearCache = function () {
            this._renewStates = [];
            var accessTokenItems = this._cacheStorage.getAllAccessTokens(Msal.Constants.clientId, Msal.Constants.authority);
            for (var i = 0; i < accessTokenItems.length; i++) {
                this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
            }
            this._cacheStorage.removeAcquireTokenEntries(Msal.Constants.acquireTokenUser, Msal.Constants.renewStatus);
            this._cacheStorage.removeAcquireTokenEntries(Msal.Constants.authority + Msal.Constants.resourceDelimeter, Msal.Constants.renewStatus);
            this._cacheStorage.resetCacheItems();
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
                this._requestContext.logger.error('error opening popup ' + e.message);
                this._loginInProgress = false;
                this._acquireTokenInProgress = false;
                return null;
            }
        };
        UserAgentApplication.prototype.validateInputScope = function (scopes) {
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
        };
        UserAgentApplication.prototype.filterScopes = function (scopes) {
            scopes = scopes.filter(function (element) {
                return element !== "openid";
            });
            scopes = scopes.filter(function (element) {
                return element !== "profile";
            });
            return scopes;
        };
        UserAgentApplication.prototype.registerCallback = function (expectedState, scope, resolve, reject) {
            var _this = this;
            this._activeRenewals[scope] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            window.callBacksMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] =
                    function (errorDesc, token, error, tokenType) {
                        _this._activeRenewals[scope] = null;
                        for (var i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
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
                                _this._requestContext.logger.warning(e);
                            }
                        }
                        window.callBacksMappedToRenewStates[expectedState] = null;
                        window.callBackMappedToRenewStates[expectedState] = null;
                    };
            }
        };
        UserAgentApplication.prototype.getCachedToken = function (authenticationRequest, user) {
            var accessTokenCacheItem = null;
            var scopes = authenticationRequest.scopes;
            var tokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user.userIdentifier);
            if (tokenCacheItems.length === 0) {
                return null;
            }
            var filteredItems = [];
            if (!authenticationRequest.authority) {
                for (var i = 0; i < tokenCacheItems.length; i++) {
                    var cacheItem = tokenCacheItems[i];
                    var cachedScopes = cacheItem.key.scopes.split(" ");
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
                    var authorityList = this.getUniqueAuthority(tokenCacheItems, 'authority');
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
                for (var i = 0; i < tokenCacheItems.length; i++) {
                    var cacheItem = tokenCacheItems[i];
                    var cachedScopes = cacheItem.key.scopes.split(" ");
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
                var expired = Number(accessTokenCacheItem.value.expiresIn);
                var offset = this._clockSkew || 300;
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
        };
        UserAgentApplication.prototype.getAllUsers = function () {
            var users = [];
            var accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(Msal.Constants.clientId, Msal.Constants.authority);
            for (var i = 0; i < accessTokenCacheItems.length; i++) {
                var idToken = new Msal.IdToken(accessTokenCacheItems[i].value.idToken);
                var clientInfo = new Msal.ClientInfo(accessTokenCacheItems[i].value.clientInfo);
                var user = Msal.User.createUser(idToken, clientInfo, this.authority);
                users.push(user);
            }
            return this.getUniqueUsers(users);
        };
        UserAgentApplication.prototype.getUniqueUsers = function (users) {
            if (!users || users.length <= 1) {
                return users;
            }
            var flags = [];
            var uniqueUsers = [];
            for (var index = 0; index < users.length; ++index) {
                if (users[index].userIdentifier && flags.indexOf(users[index].userIdentifier) === -1) {
                    flags.push(users[index].userIdentifier);
                    uniqueUsers.push(users[index]);
                }
            }
            return uniqueUsers;
        };
        UserAgentApplication.prototype.getUniqueAuthority = function (accessTokenCacheItems, property) {
            var authorityList = [];
            var flags = [];
            accessTokenCacheItems.forEach(function (element) {
                if (element.key.hasOwnProperty(property) && (flags.indexOf(element.key[property]) === -1)) {
                    flags.push(element.key[property]);
                    authorityList.push(element.key[property]);
                }
            });
            return authorityList;
        };
        UserAgentApplication.prototype.addHintParameters = function (urlNavigate, user) {
            var userObject = user ? user : this._user;
            var decodedClientInfo = userObject.userIdentifier.split('.');
            var uid = Msal.Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
            var utid = Msal.Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);
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
        };
        UserAgentApplication.prototype.urlContainsQueryStringParameter = function (name, url) {
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        };
        UserAgentApplication.prototype.acquireTokenRedirect = function (scopes, authority, user, extraQueryParameters) {
            var _this = this;
            var isValidScope = this.validateInputScope(scopes);
            if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback(isValidScope, null, null, Msal.Constants.accessToken);
                    return;
                }
            }
            if (scopes) {
                scopes = this.filterScopes(scopes);
            }
            var userObject = user ? user : this._user;
            if (this._acquireTokenInProgress) {
                return;
            }
            var scope = scopes.join(" ").toLowerCase();
            if (!userObject) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback(Msal.ErrorDescription.userLoginError, null, Msal.ErrorCodes.userLoginError, Msal.Constants.accessToken);
                    return;
                }
            }
            this._acquireTokenInProgress = true;
            var authenticationRequest;
            var acquireTokenAuthority = authority ? Msal.Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
            acquireTokenAuthority.ResolveEndpointsAsync().then(function () {
                if (Msal.Utils.compareObjects(userObject, _this._user)) {
                    authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.token, _this.redirectUri);
                }
                else {
                    authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.id_token_token, _this.redirectUri);
                }
                _this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                var acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + userObject.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                if (Msal.Utils.isEmpty(_this._cacheStorage.getItem(acquireTokenUserKey))) {
                    _this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                }
                var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                if (Msal.Utils.isEmpty(_this._cacheStorage.getItem(authorityKey))) {
                    _this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);
                }
                if (extraQueryParameters) {
                    authenticationRequest.extraQueryParameters = extraQueryParameters;
                }
                var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                urlNavigate = _this.addHintParameters(urlNavigate, userObject);
                if (urlNavigate) {
                    _this._cacheStorage.setItem(Msal.Constants.stateAcquireToken, authenticationRequest.state);
                    window.location.replace(urlNavigate);
                }
            });
        };
        UserAgentApplication.prototype.acquireTokenPopup = function (scopes, authority, user, extraQueryParameters) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this._interactionMode = _this._interactionModes.popUp;
                var isValidScope = _this.validateInputScope(scopes);
                if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                    reject(Msal.ErrorCodes.inputScopesError + ':' + isValidScope);
                }
                if (scopes) {
                    scopes = _this.filterScopes(scopes);
                }
                var userObject = user ? user : _this._user;
                if (_this._acquireTokenInProgress) {
                    reject(Msal.ErrorCodes.acquireTokenProgressError + ':' + Msal.ErrorDescription.acquireTokenProgressError);
                    return;
                }
                var scope = scopes.join(" ").toLowerCase();
                if (!userObject) {
                    reject(Msal.ErrorCodes.userLoginError + ':' + Msal.ErrorDescription.userLoginError);
                    return;
                }
                _this._acquireTokenInProgress = true;
                var authenticationRequest;
                var acquireTokenAuthority = authority ? Msal.Authority.CreateInstance(authority, _this.validateAuthority) : _this.authorityInstance;
                var popUpWindow = _this.openWindow('about:blank', '_blank', 1, _this, resolve, reject);
                if (!popUpWindow) {
                    return;
                }
                acquireTokenAuthority.ResolveEndpointsAsync().then(function () {
                    if (Msal.Utils.compareObjects(userObject, _this._user)) {
                        authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.token, _this.redirectUri);
                    }
                    else {
                        authenticationRequest = new Msal.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.id_token_token, _this.redirectUri);
                    }
                    _this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
                    authenticationRequest.state = authenticationRequest.state;
                    var acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + userObject.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                    if (Msal.Utils.isEmpty(_this._cacheStorage.getItem(acquireTokenUserKey))) {
                        _this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                    }
                    var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
                    if (Msal.Utils.isEmpty(_this._cacheStorage.getItem(authorityKey))) {
                        _this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);
                    }
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }
                    var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                    urlNavigate = _this.addHintParameters(urlNavigate, userObject);
                    _this._renewStates.push(authenticationRequest.state);
                    _this.registerCallback(authenticationRequest.state, scope, resolve, reject);
                    if (popUpWindow) {
                        popUpWindow.location.href = urlNavigate;
                    }
                }, function () {
                    _this._requestContext.logger.info(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    _this._cacheStorage.setItem(Msal.Constants.error, Msal.ErrorCodes.endpointResolutionError);
                    _this._cacheStorage.setItem(Msal.Constants.errorDescription, Msal.ErrorDescription.endpointResolutionError);
                    if (reject) {
                        reject(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    }
                    if (popUpWindow)
                        popUpWindow.close();
                });
            });
        };
        UserAgentApplication.prototype.acquireTokenSilent = function (scopes, authority, user, extraQueryParameters) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var isValidScope = _this.validateInputScope(scopes);
                if (isValidScope && !Msal.Utils.isEmpty(isValidScope)) {
                    reject(Msal.ErrorCodes.inputScopesError + ':' + isValidScope);
                }
                else {
                    if (scopes) {
                        scopes = _this.filterScopes(scopes);
                    }
                    var scope = scopes.join(" ").toLowerCase();
                    var userObject_1 = user ? user : _this._user;
                    if (!userObject_1) {
                        reject(Msal.ErrorCodes.userLoginError + ':' + Msal.ErrorDescription.userLoginError);
                        return;
                    }
                    var authenticationRequest_1;
                    var newAuthority = authority ? Msal.Authority.CreateInstance(authority, _this.validateAuthority) : _this.authorityInstance;
                    if (Msal.Utils.compareObjects(userObject_1, _this._user)) {
                        authenticationRequest_1 = new Msal.AuthenticationRequestParameters(newAuthority, _this.clientId, scopes, ResponseTypes.token, _this.redirectUri);
                    }
                    else {
                        authenticationRequest_1 = new Msal.AuthenticationRequestParameters(newAuthority, _this.clientId, scopes, ResponseTypes.id_token_token, _this.redirectUri);
                    }
                    var cacheResult = _this.getCachedToken(authenticationRequest_1, userObject_1);
                    if (cacheResult) {
                        if (cacheResult.token) {
                            _this._requestContext.logger.info('Token is already in cache for scope:' + scope);
                            resolve(cacheResult.token);
                            return;
                        }
                        else if (cacheResult.errorDesc || cacheResult.error) {
                            _this._requestContext.logger.info(cacheResult.errorDesc + ":" + cacheResult.error);
                            reject(cacheResult.errorDesc + ": " + cacheResult.error);
                            return;
                        }
                    }
                    if (_this._activeRenewals[scope]) {
                        _this.registerCallback(_this._activeRenewals[scope], scope, resolve, reject);
                    }
                    return _this.authorityInstance.ResolveEndpointsAsync()
                        .then(function () {
                        if (scopes && scopes.indexOf(_this.clientId) > -1 && scopes.length === 1) {
                            _this._requestContext.logger.verbose("renewing idToken");
                            _this.renewIdToken(scopes, resolve, reject, userObject_1, authenticationRequest_1, extraQueryParameters);
                        }
                        else {
                            _this._requestContext.logger.verbose("renewing accesstoken");
                            _this.renewToken(scopes, resolve, reject, userObject_1, authenticationRequest_1, extraQueryParameters);
                        }
                    });
                }
            });
        };
        UserAgentApplication.prototype.loadFrameTimeout = function (urlNavigate, frameName, scope) {
            var _this = this;
            this._requestContext.logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.setItem(Msal.Constants.renewStatus + scope, Msal.Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            setTimeout(function () {
                if (_this._cacheStorage.getItem(Msal.Constants.renewStatus + scope) === Msal.Constants.tokenRenewStatusInProgress) {
                    _this._requestContext.logger.verbose('Loading frame has timed out after: ' + (Msal.Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    var expectedState = _this._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState])
                        window.callBackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, null, Msal.Constants.accessToken);
                    _this._cacheStorage.setItem(Msal.Constants.renewStatus + scope, Msal.Constants.tokenRenewStatusCancelled);
                }
            }, Msal.Constants.loadFrameTimeout);
        };
        UserAgentApplication.prototype.loadFrame = function (urlNavigate, frameName) {
            var _this = this;
            this._requestContext.logger.info('LoadFrame: ' + frameName);
            var frameCheck = frameName;
            setTimeout(function () {
                var frameHandle = _this.addAdalFrame(frameCheck);
                if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                    frameHandle.src = urlNavigate;
                }
            }, 500);
        };
        UserAgentApplication.prototype.addAdalFrame = function (iframeId) {
            if (typeof iframeId === "undefined") {
                return null;
            }
            this._requestContext.logger.info('Add msal frame to document:' + iframeId);
            var adalFrame = document.getElementById(iframeId);
            if (!adalFrame) {
                if (document.createElement &&
                    document.documentElement &&
                    (window.navigator.userAgent.indexOf("MSIE 5.0") === -1)) {
                    var ifr = document.createElement("iframe");
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
        };
        UserAgentApplication.prototype.renewToken = function (scopes, resolve, reject, user, authenticationRequest, extraQueryParameters) {
            var scope = scopes.join(" ").toLowerCase();
            this._requestContext.logger.verbose('renewToken is called for scope:' + scope);
            var frameHandle = this.addAdalFrame('msalRenewFrame' + scope);
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            var acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + user.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
            }
            var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
            }
            this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=none";
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, scope, resolve, reject);
            this._requestContext.logger.infoPii('Navigate to:' + urlNavigate);
            frameHandle.src = "about:blank";
            this.loadFrameTimeout(urlNavigate, 'msalRenewFrame' + scope, scope);
        };
        UserAgentApplication.prototype.renewIdToken = function (scopes, resolve, reject, user, authenticationRequest, extraQueryParameters) {
            var scope = scopes.join(" ").toLowerCase();
            this._requestContext.logger.info('renewidToken is called');
            var frameHandle = this.addAdalFrame("msalIdTokenFrame");
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            var acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + user.userIdentifier + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
            }
            var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + authenticationRequest.state;
            if (Msal.Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
            }
            this._cacheStorage.setItem(Msal.Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=none";
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, resolve, reject);
            this._requestContext.logger.infoPii('Navigate to:' + urlNavigate);
            frameHandle.src = "about:blank";
            this.loadFrameTimeout(urlNavigate, "adalIdTokenFrame", this.clientId);
        };
        UserAgentApplication.prototype.getUser = function () {
            if (this._user) {
                return this._user;
            }
            var rawIdToken = this._cacheStorage.getItem(Msal.Constants.idTokenKey);
            var rawClientInfo = this._cacheStorage.getItem(Msal.Constants.clientInfo);
            if (!Msal.Utils.isEmpty(rawIdToken) && !Msal.Utils.isEmpty(rawClientInfo)) {
                var idToken = new Msal.IdToken(rawIdToken);
                var clientInfo = new Msal.ClientInfo(rawClientInfo);
                this._user = Msal.User.createUser(idToken, clientInfo, this.authority);
                return this._user;
            }
            return null;
        };
        ;
        UserAgentApplication.prototype.handleAuthenticationResponse = function (hash, resolve, reject) {
            if (hash == null) {
                hash = window.location.hash;
            }
            if (this.isCallback(hash)) {
                var requestInfo = this.getRequestInfo(hash);
                this._requestContext.logger.info("Returned from redirect url");
                this.saveTokenFromHash(requestInfo);
                var token = null, tokenReceivedCallback = null, tokenType = void 0;
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
                    var errorDesc = requestInfo.parameters[Msal.Constants.errorDescription];
                    var error = requestInfo.parameters[Msal.Constants.error];
                    if (reject && resolve) {
                        if (error || errorDesc) {
                            reject(errorDesc + ":" + error);
                        }
                        else if (token) {
                            resolve(token);
                        }
                    }
                    else if (tokenReceivedCallback) {
                        tokenReceivedCallback(errorDesc, token, error, tokenType);
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
        };
        UserAgentApplication.prototype.saveAccessToken = function (authority, tokenResponse, user, clientInfo, idToken) {
            var scope;
            var clientObj = new Msal.ClientInfo(clientInfo);
            if (tokenResponse.parameters.hasOwnProperty("scope")) {
                scope = tokenResponse.parameters["scope"];
                var consentedScopes = scope.split(" ");
                var accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, authority);
                for (var i = 0; i < accessTokenCacheItems.length; i++) {
                    var accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
                        var cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
                        if (Msal.Utils.isIntersectingScopes(cachedScopes, consentedScopes))
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
                var accessTokenKey = new Msal.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
                var accessTokenValue = new Msal.AccessTokenValue(tokenResponse.parameters[Msal.Constants.accessToken], idToken.rawIdToken, Msal.Utils.expiresIn(tokenResponse.parameters[Msal.Constants.expiresIn]).toString(), clientInfo);
                this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
            else {
                scope = this.clientId;
                var accessTokenKey = new Msal.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
                var accessTokenValue = new Msal.AccessTokenValue(tokenResponse.parameters[Msal.Constants.idToken], tokenResponse.parameters[Msal.Constants.idToken], idToken.expiration, clientInfo);
                this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
        };
        UserAgentApplication.prototype.saveTokenFromHash = function (tokenResponse) {
            this._requestContext.logger.info('State status:' + tokenResponse.stateMatch + '; Request type:' + tokenResponse.requestType);
            this._cacheStorage.setItem(Msal.Constants.error, "");
            this._cacheStorage.setItem(Msal.Constants.errorDescription, "");
            var scope = '';
            if (tokenResponse.parameters.hasOwnProperty("scope")) {
                scope = tokenResponse.parameters["scope"];
            }
            else {
                scope = this.clientId;
            }
            if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.errorDescription) || tokenResponse.parameters.hasOwnProperty(Msal.Constants.error)) {
                this._requestContext.logger.info('Error :' + tokenResponse.parameters[Msal.Constants.error] + '; Error description:' + tokenResponse.parameters[Msal.Constants.errorDescription]);
                this._cacheStorage.setItem(Msal.Constants.error, tokenResponse.parameters["error"]);
                this._cacheStorage.setItem(Msal.Constants.errorDescription, tokenResponse.parameters[Msal.Constants.errorDescription]);
                if (tokenResponse.requestType === Msal.Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.setItem(Msal.Constants.loginError, tokenResponse.parameters[Msal.Constants.errorDescription] + ':' + tokenResponse.parameters[Msal.Constants.error]);
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
                        var user = void 0;
                        if (tokenResponse.parameters.hasOwnProperty(Msal.Constants.idToken)) {
                            idToken = new Msal.IdToken(tokenResponse.parameters[Msal.Constants.idToken]);
                        }
                        else {
                            idToken = new Msal.IdToken(this._cacheStorage.getItem(Msal.Constants.idTokenKey));
                        }
                        var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + tokenResponse.stateResponse;
                        var authority = void 0;
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
                        var acquireTokenUserKey = Msal.Constants.acquireTokenUser + Msal.Constants.resourceDelimeter + user.userIdentifier + Msal.Constants.resourceDelimeter + tokenResponse.stateResponse;
                        var acquireTokenUser = void 0;
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
                            var authorityKey = Msal.Constants.authority + Msal.Constants.resourceDelimeter + tokenResponse.stateResponse;
                            var authority = void 0;
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
        };
        ;
        UserAgentApplication.prototype.isCallback = function (hash) {
            hash = this.getHash(hash);
            var parameters = Msal.Utils.deserialize(hash);
            return (parameters.hasOwnProperty(Msal.Constants.errorDescription) ||
                parameters.hasOwnProperty(Msal.Constants.error) ||
                parameters.hasOwnProperty(Msal.Constants.accessToken) ||
                parameters.hasOwnProperty(Msal.Constants.idToken));
        };
        UserAgentApplication.prototype.getHash = function (hash) {
            if (hash.indexOf("#/") > -1) {
                hash = hash.substring(hash.indexOf("#/") + 2);
            }
            else if (hash.indexOf("#") > -1) {
                hash = hash.substring(1);
            }
            return hash;
        };
        ;
        UserAgentApplication.prototype.getRequestInfo = function (hash) {
            hash = this.getHash(hash);
            var parameters = Msal.Utils.deserialize(hash);
            var tokenResponse = new Msal.TokenResponse();
            if (parameters) {
                tokenResponse.parameters = parameters;
                if (parameters.hasOwnProperty(Msal.Constants.errorDescription) ||
                    parameters.hasOwnProperty(Msal.Constants.error) ||
                    parameters.hasOwnProperty(Msal.Constants.accessToken) ||
                    parameters.hasOwnProperty(Msal.Constants.idToken)) {
                    tokenResponse.valid = true;
                    var stateResponse = void 0;
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
                        var clientApplication = window.parent.msal;
                        var statesInParentContext = clientApplication._renewStates;
                        for (var i = 0; i < statesInParentContext.length; i++) {
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
        };
        ;
        UserAgentApplication.prototype.getScopeFromState = function (state) {
            if (state) {
                var splitIndex = state.indexOf("|");
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return "";
        };
        ;
        return UserAgentApplication;
    }());
    Msal.UserAgentApplication = UserAgentApplication;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.compareObjects = function (u1, u2) {
            if (!u1 || !u2)
                return false;
            if (u1.userIdentifier && u2.userIdentifier) {
                if (u1.userIdentifier === u2.userIdentifier) {
                    return true;
                }
            }
            return false;
        };
        ;
        Utils.expiresIn = function (expires) {
            if (!expires)
                expires = "3599";
            return this.now() + parseInt(expires, 10);
        };
        ;
        Utils.now = function () {
            return Math.round(new Date().getTime() / 1000.0);
        };
        ;
        Utils.isEmpty = function (str) {
            return (typeof str === "undefined" || !str || 0 === str.length);
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
                    return null;
                }
                return JSON.parse(base64Decoded);
            }
            catch (err) {
            }
            return null;
        };
        ;
        Utils.base64EncodeStringUrlSafe = function (input) {
            if (window.btoa) {
                return window.btoa(input);
            }
            else {
                return this.encode(input);
            }
        };
        Utils.base64DecodeStringUrlSafe = function (base64IdToken) {
            base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken));
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        };
        ;
        Utils.encode = function (input) {
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
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
                output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }
            return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        };
        Utils.utf8Encode = function (input) {
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
        };
        Utils.decode = function (base64IdToken) {
            var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            base64IdToken = String(base64IdToken).replace(/=+$/, "");
            var length = base64IdToken.length;
            if (length % 4 === 1) {
                throw new Error("The token to be decoded is not correctly encoded.");
            }
            var h1, h2, h3, h4, bits, c1, c2, c3, decoded = "";
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
            var match;
            var pl = /\+/g;
            var search = /([^&=]+)=([^&]*)/g;
            var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
            var obj = {};
            match = search.exec(query);
            while (match) {
                obj[decode(match[1])] = decode(match[2]);
                match = search.exec(query);
            }
            return obj;
        };
        ;
        Utils.isIntersectingScopes = function (cachedScopes, scopes) {
            cachedScopes = this.convertToLowerCase(cachedScopes);
            for (var i = 0; i < scopes.length; i++) {
                if (cachedScopes.indexOf(scopes[i].toLowerCase()) > -1)
                    return true;
            }
            return false;
        };
        Utils.containsScope = function (cachedScopes, scopes) {
            cachedScopes = this.convertToLowerCase(cachedScopes);
            return scopes.every(function (value) { return cachedScopes.indexOf(value.toString().toLowerCase()) >= 0; });
        };
        Utils.convertToLowerCase = function (scopes) {
            return scopes.map(function (scope) { return scope.toLowerCase(); });
        };
        Utils.removeElement = function (scopes, scope) {
            return scopes.filter(function (value) { return value !== scope; });
        };
        Utils.decimalToHex = function (num) {
            var hex = num.toString(16);
            while (hex.length < 2) {
                hex = "0" + hex;
            }
            return hex;
        };
        Utils.getLibraryVersion = function () {
            return "0.1.1";
        };
        Utils.replaceFirstPath = function (href, tenantId) {
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
        };
        Utils.createNewGuid = function () {
            var cryptoObj = window.crypto;
            if (cryptoObj && cryptoObj.getRandomValues) {
                var buffer = new Uint8Array(16);
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
                var guidHolder = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
                var hex = "0123456789abcdef";
                var r = 0;
                var guidResponse = "";
                for (var i = 0; i < 36; i++) {
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
        };
        ;
        Utils.GetUrlComponents = function (url) {
            if (!url) {
                throw "Url required";
            }
            var regEx = new RegExp(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
            var match = url.match(regEx);
            if (!match || match.length < 6) {
                throw "Valid url required";
            }
            var urlComponents = {
                Protocol: match[1],
                HostNameAndPort: match[4],
                AbsolutePath: match[5]
            };
            var pathSegments = urlComponents.AbsolutePath.split("/");
            pathSegments = pathSegments.filter(function (val) { return val && val.length > 0; });
            urlComponents.PathSegments = pathSegments;
            return urlComponents;
        };
        Utils.CanonicalizeUri = function (url) {
            if (url) {
                url = url.toLowerCase();
            }
            if (url && !Utils.endsWith(url, "/")) {
                url += "/";
            }
            return url;
        };
        Utils.endsWith = function (url, suffix) {
            if (!url || !suffix) {
                return false;
            }
            return url.indexOf(suffix, url.length - suffix.length) !== -1;
        };
        return Utils;
    }());
    Msal.Utils = Utils;
})(Msal || (Msal = {}));
var Msal;
(function (Msal) {
    var XhrClient = (function () {
        function XhrClient() {
        }
        XhrClient.prototype.sendRequestAsync = function (url, method, enableCaching) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                if (enableCaching) {
                }
                xhr.onload = function (ev) {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(_this.handleError(xhr.responseText));
                    }
                    try {
                        var jsonResponse = JSON.parse(xhr.responseText);
                    }
                    catch (e) {
                        reject(_this.handleError(xhr.responseText));
                    }
                    resolve(jsonResponse);
                };
                xhr.onerror = function (ev) {
                    reject(xhr.status);
                };
                if (method == 'GET') {
                    xhr.send();
                }
                else {
                    throw "not implemented";
                }
            });
        };
        XhrClient.prototype.handleError = function (responseText) {
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
        };
        return XhrClient;
    }());
    Msal.XhrClient = XhrClient;
})(Msal || (Msal = {}));
//# sourceMappingURL=msal.js.map