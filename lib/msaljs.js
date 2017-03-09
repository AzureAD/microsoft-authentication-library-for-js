var MSAL;
(function (MSAL) {
    var ClientApplication = (function () {
        function ClientApplication(clientId) {
            this.ERROR_DESCRIPTION = "error_description";
            this.ID_TOKEN = "id_token";
            this.ACCESS_TOKEN = "access_token";
            this.EXPIRES_IN = 'expires_in';
            this.SESSION_STATE = 'session_state';
            this.TOKEN_KEYS = 'adal.token.keys';
            this.ACCESS_TOKEN_KEY = 'adal.access.token.key';
            this.EXPIRATION_KEY = 'adal.expiration.key';
            this.STATE_LOGIN = 'adal.state.login';
            this.STATE_RENEW = 'adal.state.renew';
            this.NONCE_IDTOKEN = 'adal.nonce.idtoken';
            this.USERNAME = 'adal.username';
            this.IDTOKEN = 'adal.idtoken';
            this.ERROR = 'adal.error';
            this.LOGIN_REQUEST = 'adal.login.request';
            this.LOGIN_ERROR = 'adal.login.error';
            this.RENEW_STATUS = 'adal.token.renew.status';
            this.RESOURCE_DELIMETER = '|';
            this.LOADFRAME_TIMEOUT = 6000;
            this.TOKEN_RENEW_STATUS_CANCELED = 'Canceled';
            this.TOKEN_RENEW_STATUS_COMPLETED = 'Completed';
            this.TOKEN_RENEW_STATUS_IN_PROGRESS = 'In Progress';
            this.POPUP_WIDTH = 483;
            this.POPUP_HEIGHT = 600;
            this.LOGIN = 'LOGIN';
            this.RENEW_TOKEN = 'RENEW_TOKEN';
            this.UNKNOWN = 'UNKNOWN';
            this.ClientId = clientId;
            this.Authority = "https://login.microsoftonline.com/common";
            this.RedirectUri = window.location.href;
            this.ClockSkew = 300;
            this.PostLogoutRedirectUri = this.RedirectUri;
            this.CacheLocation = CacheLocations.SessionStorage;
            this.AuthenticationMode = AuthenticationModes.Redirect;
            this.loginInProgress = false;
            this.RenewStates = [];
            this.CheckSessionIframe = null;
            this.ActiveRenewals = {};
            window.MSAL = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
            this.SessionState = null;
        };
        ClientApplication.prototype.GetUser = function () {
            if (this.User) {
                return this.User;
            }
            var idtoken = this.getItem(this.IDTOKEN);
            if (!this.isEmpty(idtoken)) {
                this.User = this.createUser(idtoken);
                return this.User;
            }
            return null;
        };
        ClientApplication.prototype.openPopup = function (urlNavigate, title, popUpWidth, popUpHeight) {
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
                console.log('Error opening popup, ' + e.message);
                this.loginInProgress = false;
                return null;
            }
        };
        ClientApplication.prototype.AcquireToken = function (scopes, callback, loginHint, extraQueryParameters) {
            this.validateInputScope(scopes);
            if (!this.User) {
                callback('User login is required', null);
                return;
            }
            var scope = scopes.join(' ');
            var parameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, null, ResponseTypes.Token, this.RedirectUri);
            var expectedState = parameters.State + '|' + scope;
            this.saveItem(this.NONCE_IDTOKEN, parameters.Nonce);
            parameters.State = expectedState;
            if (extraQueryParameters)
                parameters.ExtraQueryParameters = extraQueryParameters;
            var urlNavigate = parameters.CreateNavigateUrl(scopes);
            urlNavigate = this.addHintParameters(urlNavigate, loginHint);
            this.RenewStates.push(expectedState);
            this.registerCallback(expectedState, scope, callback);
            console.log('Navigate to:' + urlNavigate);
            var popupWindow = this.openPopup(urlNavigate, "acquireToken", this.POPUP_WIDTH, this.POPUP_HEIGHT);
            if (popupWindow == null) {
                return;
            }
            if (this.RedirectUri.indexOf('#') != -1)
                var registeredRedirectUri = this.RedirectUri.split("#")[0];
            else
                var registeredRedirectUri = this.RedirectUri;
            var that = this;
            var pollTimer = window.setInterval(function () {
                if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
                    window.clearInterval(pollTimer);
                }
                try {
                    if (popupWindow.location.href.indexOf(registeredRedirectUri) != -1) {
                        that.HandleAuthenticationResponse(popupWindow.location.hash);
                        window.clearInterval(pollTimer);
                        console.log("Closing popup window");
                        popupWindow.close();
                    }
                }
                catch (e) {
                }
            }, 1);
        };
        ClientApplication.prototype.AcquireTokenSilent = function (scopes, callback) {
            this.validateInputScope(scopes);
            if (!this.User) {
                callback('User login is required', null);
                return;
            }
            var scope = scopes.join(' ');
            if (this.ActiveRenewals[scope]) {
                this.registerCallback(this.ActiveRenewals[scope], scope, callback);
            }
            else {
                if (!this.isEmpty(scope) && scope.indexOf(this.ClientId) > -1) {
                    console.log('renewing idtoken');
                    this.renewIdToken(scopes, callback);
                }
                else {
                    console.log('renewing accesstoken');
                    this.renewToken(scopes, callback);
                }
            }
        };
        ClientApplication.prototype.renewToken = function (scopes, callback) {
            var scope = scopes.join(' ');
            console.log('renewToken is called for resource:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            var parameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, scopes, ResponseTypes.Token, this.RedirectUri);
            var expectedState = Utils.Guid() + '|' + scope;
            parameters.State = expectedState;
            this.RenewStates.push(expectedState);
            console.log('Renew token Expected state: ' + expectedState);
            var urlNavigate = parameters.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.registerCallback(expectedState, scope, callback);
            console.log('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        };
        ClientApplication.prototype.renewIdToken = function (scopes, callback) {
            console.log('renewIdToken is called');
            var frameHandle = this.addAdalFrame('adalIdTokenFrame');
            var parameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, scopes, ResponseTypes.IdToken, this.RedirectUri);
            var expectedState = parameters.State + '|' + this.ClientId;
            this.saveItem(this.NONCE_IDTOKEN, parameters.Nonce);
            parameters.State = expectedState;
            var urlNavigate = parameters.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.RenewStates.push(expectedState);
            this.registerCallback(expectedState, this.ClientId, callback);
            console.log('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.ClientId);
        };
        ClientApplication.prototype.validateInputScope = function (scopes) {
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
            if (scopes.indexOf(this.ClientId) > -1) {
                if (scopes.length > 1) {
                    throw new Error('Client Id can only be provided as a single scope');
                }
            }
        };
        ClientApplication.prototype.registerCallback = function (expectedState, resource, callback) {
            this.ActiveRenewals[resource] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            var self = this;
            window.callBacksMappedToRenewStates[expectedState].push(callback);
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] = function (message, token) {
                    for (var i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                        window.callBacksMappedToRenewStates[expectedState][i](message, token);
                    }
                    self.ActiveRenewals[resource] = null;
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        };
        ClientApplication.prototype.addHintParameters = function (urlNavigate, loginHint) {
            if (this.User && this.User.profile && this.User.profile.hasOwnProperty('preferred_username')) {
                if (loginHint) {
                    urlNavigate += '&login_hint=' + encodeURIComponent(loginHint);
                }
                else {
                    urlNavigate += '&login_hint=' + encodeURIComponent(this.User.profile.preferred_username);
                }
                if (!this.urlContainsQueryStringParameter('domain_hint', urlNavigate) && this.User.profile.hasOwnProperty('tid')) {
                    if (this.User.profile.tid === '9188040d-6c67-4c5b-b112-36a304b66dad') {
                        urlNavigate += '&domain_hint=' + encodeURIComponent("consumers");
                    }
                    else {
                        urlNavigate += '&domain_hint=' + encodeURIComponent("organizations");
                    }
                }
            }
            return urlNavigate;
        };
        ClientApplication.prototype.urlContainsQueryStringParameter = function (name, url) {
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        };
        ClientApplication.prototype.loadFrameTimeout = function (urlNavigate, frameName, resource) {
            console.log('Set loading state to pending for: ' + resource);
            this.saveItem(this.RENEW_STATUS + resource, this.TOKEN_RENEW_STATUS_IN_PROGRESS);
            this.loadFrame(urlNavigate, frameName);
            var self = this;
            setTimeout(function () {
                if (self.getItem(self.RENEW_STATUS + resource) === self.TOKEN_RENEW_STATUS_IN_PROGRESS) {
                    console.log('Loading frame has timed out after: ' + (self.LOADFRAME_TIMEOUT / 1000) + ' seconds for resource ' + resource);
                    var expectedState = self.ActiveRenewals[resource];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null);
                    }
                    self.saveItem(self.RENEW_STATUS + resource, self.TOKEN_RENEW_STATUS_CANCELED);
                }
            }, self.LOADFRAME_TIMEOUT);
        };
        ClientApplication.prototype.loadFrame = function (urlNavigate, frameName) {
            var self = this;
            console.log('LoadFrame: ' + frameName);
            var frameCheck = frameName;
            setTimeout(function () {
                var frameHandle = self.addAdalFrame(frameCheck);
                if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                    frameHandle.src = urlNavigate;
                    self.loadFrame(urlNavigate, frameCheck);
                }
            }, 500);
        };
        ClientApplication.prototype.addAdalFrame = function (iframeId) {
            if (typeof iframeId === 'undefined') {
                return;
            }
            console.log('Add adal frame to document:' + iframeId);
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
        ClientApplication.prototype.Logout = function () {
            this.clearCache();
            this.User = null;
            var urlNavigate;
            var logout = '';
            if (this.PostLogoutRedirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.PostLogoutRedirectUri);
            }
            urlNavigate = this.Authority + '/oauth2/v2.0/logout?' + logout;
            if (urlNavigate) {
                window.location.replace(urlNavigate);
            }
        };
        ClientApplication.prototype.Login = function () {
            var parameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, null, ResponseTypes.IdToken, this.RedirectUri);
            if (this.loginInProgress) {
                return;
            }
            this.saveItem(this.LOGIN_REQUEST, window.location.href);
            this.saveItem(this.LOGIN_ERROR, '');
            this.saveItem(this.STATE_LOGIN, parameters.State);
            this.saveItem(this.NONCE_IDTOKEN, parameters.Nonce);
            this.saveItem(this.ERROR, '');
            this.saveItem(this.ERROR_DESCRIPTION, '');
            var scopes = [this.ClientId];
            var urlNavigate = parameters.CreateNavigateUrl(scopes);
            console.log(urlNavigate);
            this.loginInProgress = true;
            if (this.AuthenticationMode == AuthenticationModes.PopUp) {
                return;
            }
            else {
                if (urlNavigate) {
                    window.location.replace(urlNavigate);
                }
            }
        };
        ClientApplication.prototype.HandleAuthenticationResponse = function (hash) {
            if (this.isCallback(hash)) {
                var requestInfo = this.getRequestInfo(hash);
                this.saveTokenFromHash(requestInfo);
                var token = null, callback = null;
                if ((requestInfo.requestType === this.RENEW_TOKEN) && window.parent) {
                    console.log('Window is in iframe');
                    callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    if (callback)
                        callback(this.getItem(this.ERROR_DESCRIPTION), requestInfo.parameters[this.ACCESS_TOKEN] || requestInfo.parameters[this.ID_TOKEN]);
                    return;
                }
                try {
                    if (callback)
                        callback(this.getItem(this.ERROR_DESCRIPTION), token, this.getItem(this.ERROR));
                }
                catch (err) {
                }
                if (!(this.AuthenticationMode == AuthenticationModes.PopUp)) {
                    window.location.hash = '';
                    window.location.href = this.getItem(this.LOGIN_REQUEST);
                }
            }
        };
        ClientApplication.prototype.checkSession = function () {
            console.log("checkSession");
            try {
                var frameId = "adalSession";
                this.CheckSessionIframe = this.addAdalFrame("adalSession");
                this.CheckSessionIframe.src = this.Authority + "/oauth2/checkSession";
                var boundMessageEvent = this.receiveMessage.bind(this);
                if (window.addEventListener) {
                    window.addEventListener("message", boundMessageEvent, false);
                }
                var self_1 = this;
                setTimeout(function () {
                    var sessionState = self_1.getItem(self_1.SESSION_STATE) || Utils.Guid();
                    var expectedState = self_1.ClientId + ' ' + sessionState;
                    self_1.CheckSessionIframe.contentWindow.postMessage(expectedState, self_1.Authority.replace("/common", ""));
                }, 300);
            }
            catch (err) {
                console.log('Error navigating iframe to checkSession endpoint', err);
            }
        };
        ClientApplication.prototype.receiveMessage = function (e) {
            if (e.origin === this.Authority.replace("/common", "") && e.source === this.CheckSessionIframe.contentWindow) {
                if (e.data === "error") {
                    console.log("error message from check session op iframe");
                    this.SessionState = e.data;
                }
                else if (e.data === "changed") {
                    console.log("Session state: " + e.data + " received from check session op iframe");
                    this.SessionState = e.data;
                    this.userSessionChanged(e.data);
                }
                else {
                    console.log("Session state: " + e.data + " received from check session op iframe");
                    this.SessionState = e.data;
                    this.userSessionChanged(e.data);
                }
            }
        };
        ClientApplication.prototype.userSessionChanged = function (sessionState) {
            var evt = new CustomEvent('adal:userSessionChanged', { detail: sessionState });
            window.dispatchEvent(evt);
        };
        ClientApplication.prototype.saveTokenFromHash = function (requestInfo) {
            this.saveItem(this.ERROR, '');
            this.saveItem(this.ERROR_DESCRIPTION, '');
            var resource = this.getResourceFromState(requestInfo.stateResponse);
            if (requestInfo.parameters.hasOwnProperty(this.ERROR_DESCRIPTION)) {
                this.saveItem(this.ERROR, requestInfo.parameters["error"]);
                this.saveItem(this.ERROR_DESCRIPTION, requestInfo.parameters[this.ERROR_DESCRIPTION]);
                if (requestInfo.requestType === this.LOGIN) {
                    this.loginInProgress = false;
                    this.saveItem(this.LOGIN_ERROR, requestInfo.parameters["error_description"]);
                }
            }
            else {
                if (requestInfo.stateMatch) {
                    if (requestInfo.parameters.hasOwnProperty(this.SESSION_STATE)) {
                        this.saveItem(this.SESSION_STATE, requestInfo.parameters[this.SESSION_STATE]);
                    }
                    var keys;
                    if (requestInfo.parameters.hasOwnProperty(this.ACCESS_TOKEN)) {
                        if (!this.hasResource(resource)) {
                            keys = this.getItem(this.TOKEN_KEYS) || '';
                            this.saveItem(this.TOKEN_KEYS, keys + resource + this.RESOURCE_DELIMETER);
                        }
                        this.saveItem(this.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.ACCESS_TOKEN]);
                        this.saveItem(this.EXPIRATION_KEY + resource, this.expiresIn(requestInfo.parameters[this.EXPIRES_IN]).toString());
                    }
                    if (requestInfo.parameters.hasOwnProperty(this.ID_TOKEN)) {
                        this.loginInProgress = false;
                        this.User = this.createUser(requestInfo.parameters[this.ID_TOKEN]);
                        if (this.User && this.User.profile) {
                            if (this.User.profile.nonce !== this.getItem(this.NONCE_IDTOKEN)) {
                                this.User = null;
                                this.saveItem(this.LOGIN_ERROR, 'Nonce is not same');
                            }
                            else {
                                this.saveItem(this.IDTOKEN, requestInfo.parameters[this.ID_TOKEN]);
                                resource = this.ClientId;
                                if (!this.hasResource(resource)) {
                                    keys = this.getItem(this.TOKEN_KEYS) || '';
                                    this.saveItem(this.TOKEN_KEYS, keys + resource + this.RESOURCE_DELIMETER);
                                }
                                this.saveItem(this.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.ID_TOKEN]);
                                this.saveItem(this.EXPIRATION_KEY + resource, this.User.profile.exp);
                            }
                        }
                        else {
                            this.saveItem(this.ERROR, 'invalid id_token');
                            this.saveItem(this.ERROR_DESCRIPTION, 'Invalid id_token. id_token: ' + requestInfo.parameters[this.ID_TOKEN]);
                        }
                    }
                }
                else {
                    this.saveItem(this.ERROR, 'Invalid_state');
                    this.saveItem(this.ERROR_DESCRIPTION, 'Invalid_state. state: ' + requestInfo.stateResponse);
                }
            }
            this.saveItem(this.RENEW_STATUS + resource, this.TOKEN_RENEW_STATUS_COMPLETED);
        };
        ;
        ClientApplication.prototype.isCallback = function (hash) {
            hash = this.getHash(hash);
            var parameters = this.deserialize(hash);
            return (parameters.hasOwnProperty(this.ERROR_DESCRIPTION) ||
                parameters.hasOwnProperty(this.ACCESS_TOKEN) ||
                parameters.hasOwnProperty(this.ID_TOKEN));
        };
        ClientApplication.prototype.getHash = function (hash) {
            if (hash.indexOf('#/') > -1) {
                hash = hash.substring(hash.indexOf('#/') + 2);
            }
            else if (hash.indexOf('#') > -1) {
                hash = hash.substring(1);
            }
            return hash;
        };
        ;
        ClientApplication.prototype.deserialize = function (query) {
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
        ClientApplication.prototype.hasResource = function (key) {
            var keys = this.getItem(this.TOKEN_KEYS);
            return keys && !this.isEmpty(keys) && (keys.indexOf(key + this.RESOURCE_DELIMETER) > -1);
        };
        ;
        ClientApplication.prototype.isEmpty = function (str) {
            return (typeof str === 'undefined' || !str || 0 === str.length);
        };
        ;
        ClientApplication.prototype.createUser = function (idToken) {
            var user;
            var parsedJson = this.extractIdToken(idToken);
            if (parsedJson && parsedJson.hasOwnProperty('aud')) {
                if (parsedJson.aud.toLowerCase() === this.ClientId.toLowerCase()) {
                    user = {
                        username: '',
                        profile: parsedJson
                    };
                    if (parsedJson.hasOwnProperty('upn')) {
                        user.username = parsedJson.upn;
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
        ClientApplication.prototype.extractIdToken = function (encodedIdToken) {
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
        ClientApplication.prototype.base64DecodeStringUrlSafe = function (base64IdToken) {
            base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken));
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        };
        ;
        ClientApplication.prototype.decode = function (base64IdToken) {
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
        ClientApplication.prototype.decodeJwt = function (jwtToken) {
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
        ClientApplication.prototype.getRequestInfo = function (hash) {
            hash = this.getHash(hash);
            var parameters = this.deserialize(hash);
            var requestInfo = new RequestInfo();
            if (parameters) {
                requestInfo.parameters = parameters;
                if (parameters.hasOwnProperty(this.ERROR_DESCRIPTION) ||
                    parameters.hasOwnProperty(this.ACCESS_TOKEN) ||
                    parameters.hasOwnProperty(this.ID_TOKEN)) {
                    requestInfo.valid = true;
                    var stateResponse = '';
                    if (parameters.hasOwnProperty('state')) {
                        stateResponse = parameters.state;
                    }
                    else {
                        return requestInfo;
                    }
                    requestInfo.stateResponse = stateResponse;
                    if (stateResponse === this.getItem(this.STATE_LOGIN)) {
                        requestInfo.requestType = this.LOGIN;
                        requestInfo.stateMatch = true;
                        return requestInfo;
                    }
                    if (!requestInfo.stateMatch && window.parent && window.parent.MSAL) {
                        var clientApplication = window.parent.MSAL;
                        var statesInParentContext = clientApplication.RenewStates;
                        for (var i = 0; i < statesInParentContext.length; i++) {
                            if (statesInParentContext[i] === requestInfo.stateResponse) {
                                requestInfo.requestType = this.RENEW_TOKEN;
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
        ClientApplication.prototype.getResourceFromState = function (state) {
            if (state) {
                var splitIndex = state.indexOf('|');
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return '';
        };
        ;
        ClientApplication.prototype.expiresIn = function (expires) {
            if (!expires)
                expires = '3599';
            return this.now() + parseInt(expires, 10);
        };
        ;
        ClientApplication.prototype.now = function () {
            return Math.round(new Date().getTime() / 1000.0);
        };
        ;
        ClientApplication.prototype.clearCache = function () {
            this.saveItem(this.ACCESS_TOKEN_KEY, '');
            this.saveItem(this.EXPIRATION_KEY, "0");
            this.saveItem(this.SESSION_STATE, '');
            this.saveItem(this.STATE_LOGIN, '');
            this.saveItem(this.USERNAME, '');
            this.saveItem(this.IDTOKEN, '');
            this.saveItem(this.ERROR, '');
            this.saveItem(this.ERROR_DESCRIPTION, '');
            var key = this.getItem(this.TOKEN_KEYS);
            if (!this.isEmpty(key)) {
                var keys = key.split(this.RESOURCE_DELIMETER);
                for (var i = 0; i < keys.length; i++) {
                    this.saveItem(this.ACCESS_TOKEN_KEY + keys[i], '');
                    this.saveItem(this.EXPIRATION_KEY + keys[i], "0");
                }
            }
            this.saveItem(this.TOKEN_KEYS, '');
        };
        ;
        ClientApplication.prototype.saveItem = function (key, obj) {
            if (this.CacheLocation && this.CacheLocation == CacheLocations.LocalStorage) {
                if (!this.supportsLocalStorage()) {
                    return false;
                }
                localStorage.setItem(key, obj);
                return true;
            }
            if (!this.supportsSessionStorage()) {
                return false;
            }
            sessionStorage.setItem(key, obj);
            return true;
        };
        ;
        ClientApplication.prototype.getItem = function (key) {
            if (this.CacheLocation && this.CacheLocation == CacheLocations.LocalStorage) {
                if (!this.supportsLocalStorage()) {
                    return null;
                }
                return localStorage.getItem(key);
            }
            if (!this.supportsSessionStorage()) {
                return null;
            }
            return sessionStorage.getItem(key);
        };
        ;
        ClientApplication.prototype.supportsLocalStorage = function () {
            try {
                var supportsLocalStorage = 'localStorage' in window && window['localStorage'];
                if (supportsLocalStorage) {
                    window.localStorage.setItem('storageTest', '');
                    window.localStorage.removeItem('storageTest');
                }
                return true;
            }
            catch (e) {
                return false;
            }
        };
        ;
        ClientApplication.prototype.supportsSessionStorage = function () {
            try {
                var supportsSessionStorage = 'sessionStorage' in window && window['sessionStorage'];
                if (supportsSessionStorage) {
                    window.sessionStorage.setItem('storageTest', '');
                    window.sessionStorage.removeItem('storageTest');
                }
                return true;
            }
            catch (e) {
                return false;
            }
        };
        ;
        return ClientApplication;
    }());
    MSAL.ClientApplication = ClientApplication;
    var AuthenticationModes;
    (function (AuthenticationModes) {
        AuthenticationModes[AuthenticationModes["Redirect"] = 0] = "Redirect";
        AuthenticationModes[AuthenticationModes["PopUp"] = 1] = "PopUp";
    })(AuthenticationModes || (AuthenticationModes = {}));
    var CacheLocations;
    (function (CacheLocations) {
        CacheLocations[CacheLocations["SessionStorage"] = 0] = "SessionStorage";
        CacheLocations[CacheLocations["LocalStorage"] = 1] = "LocalStorage";
    })(CacheLocations || (CacheLocations = {}));
    var PromptValues = (function () {
        function PromptValues() {
        }
        PromptValues.None = "none";
        PromptValues.SelectAccount = "select_account";
        return PromptValues;
    }());
    var ResponseTypes = (function () {
        function ResponseTypes() {
        }
        ResponseTypes.IdToken = "id_token";
        ResponseTypes.Token = "token";
        return ResponseTypes;
    }());
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
    var AuthenticationResult = (function () {
        function AuthenticationResult() {
        }
        return AuthenticationResult;
    }());
    var AuthenticationRequestParameters = (function () {
        function AuthenticationRequestParameters(authority, clientId, promptValue, scopes, responseType, redirectUri) {
            this.Authority = authority;
            this.ClientId = clientId;
            this.PromptValue = promptValue;
            this.Scopes = scopes;
            this.ResponseType = responseType;
            this.RedirectUri = redirectUri;
            if (responseType !== "token") {
                this.Nonce = Utils.Guid();
            }
            if (this.Scopes == null)
                this.Scopes = new Array();
            this.CorrelationId = Utils.Guid();
            this.State = Utils.Guid();
            this.Nonce = Utils.Guid();
            this.XClientSku = "Js";
            this.XClientVer = Utils.GetLibraryVersion();
        }
        AuthenticationRequestParameters.prototype.CreateNavigateUrl = function (scopes) {
            var requestUrl = "";
            var str = [];
            str.push('?response_type=' + this.ResponseType);
            if (scopes) {
                this.Scopes = this.Scopes.concat(scopes);
            }
            if (this.ResponseType === ResponseTypes.IdToken) {
                if (this.Scopes.indexOf(this.ClientId) > -1) {
                    this.translateClientIdUsedInScope(this.Scopes);
                }
            }
            str.push('scope=' + encodeURIComponent(this.parseScope(this.Scopes)));
            str.push('client_id=' + encodeURIComponent(this.ClientId));
            str.push('redirect_uri=' + encodeURIComponent(this.RedirectUri));
            str.push('state=' + encodeURIComponent(this.State));
            str.push('nonce=' + encodeURIComponent(this.Nonce));
            if (this.ExtraQueryParameters) {
                str.push(this.ExtraQueryParameters);
            }
            str.push('client-request-id=' + encodeURIComponent(this.CorrelationId));
            requestUrl = this.Authority + '/oauth2/v2.0/authorize' + str.join('&') + "&x-client-SKU=" + this.XClientSku + "&x-client-Ver=" + this.XClientVer;
            return requestUrl;
        };
        AuthenticationRequestParameters.prototype.translateClientIdUsedInScope = function (scopes) {
            var clientIdIndex = scopes.indexOf(this.ClientId);
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
    var Utils = (function () {
        function Utils() {
        }
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