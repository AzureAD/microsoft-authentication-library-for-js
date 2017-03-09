interface Window {
    MSAL: Object,
    callBackMappedToRenewStates: Object;
    callBacksMappedToRenewStates: Object;
}

namespace MSAL {

    export class ClientApplication {

        private loginInProgress: boolean;
        User: User;
        ERROR_DESCRIPTION: string = "error_description";
        ID_TOKEN: string = "id_token";
        ACCESS_TOKEN: string = "access_token";
        EXPIRES_IN: string = 'expires_in';
        SESSION_STATE: string = 'session_state';
        TOKEN_KEYS: string = 'adal.token.keys';
        ACCESS_TOKEN_KEY: string = 'adal.access.token.key';
        EXPIRATION_KEY: string = 'adal.expiration.key';
        STATE_LOGIN: string = 'adal.state.login';
        STATE_RENEW: string = 'adal.state.renew';
        NONCE_IDTOKEN: string = 'adal.nonce.idtoken';
        USERNAME: string = 'adal.username';
        IDTOKEN: string = 'adal.idtoken';
        ERROR: string = 'adal.error';
        LOGIN_REQUEST: string = 'adal.login.request';
        LOGIN_ERROR: string = 'adal.login.error';
        RENEW_STATUS: string = 'adal.token.renew.status';
        RESOURCE_DELIMETER: string = '|';
        LOADFRAME_TIMEOUT: number = 6000;
        TOKEN_RENEW_STATUS_CANCELED: string = 'Canceled';
        TOKEN_RENEW_STATUS_COMPLETED: string = 'Completed';
        TOKEN_RENEW_STATUS_IN_PROGRESS: string = 'In Progress';
        POPUP_WIDTH: number = 483;
        POPUP_HEIGHT: number = 600;
        LOGIN: string = 'LOGIN';
        RENEW_TOKEN: string = 'RENEW_TOKEN';
        UNKNOWN: string = 'UNKNOWN';

        ClientId: string;
        Authority: string;
        AuthenticationMode: AuthenticationModes;
        RedirectUri: string;
        ClockSkew: number;
        PostLogoutRedirectUri: string;
        CorrelationId: string;
        CacheLocation: CacheLocations;
        CheckSessionIframe: HTMLIFrameElement;
        RenewStates: Array<string>;
        ActiveRenewals: Object;
        SessionState: string;


        constructor(clientId: string) {
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
        }

        GetUser(): User {
            // IDToken is first call
            if (this.User) {
                return this.User;
            }

            // frame is used to get idtoken
            var idtoken = this.getItem(this.IDTOKEN);
            if (!this.isEmpty(idtoken)) {
                this.User = this.createUser(idtoken);
                return this.User;
            }

            return null;
        };

        private openPopup(urlNavigate: string, title: string, popUpWidth: number, popUpHeight: number) {
            try {
                /**
                * adding winLeft and winTop to account for dual monitor
                * using screenLeft and screenTop for IE8 and earlier
                */
                let winLeft = window.screenLeft ? window.screenLeft : window.screenX;
                let winTop = window.screenTop ? window.screenTop : window.screenY;
                /**
                * window.innerWidth displays browser window's height and width excluding toolbars
                * using document.documentElement.clientWidth for IE8 and earlier
                */
                let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                let left = ((width / 2) - (popUpWidth / 2)) + winLeft;
                let top = ((height / 2) - (popUpHeight / 2)) + winTop;

                let popupWindow = window.open(urlNavigate, title, 'width=' + popUpWidth + ', height=' + popUpHeight + ', top=' + top + ', left=' + left);
                if (popupWindow.focus) {
                    popupWindow.focus();
                }
                return popupWindow;
            } catch (e) {
                console.log('Error opening popup, ' + e.message);
                this.loginInProgress = false;
                return null;
            }

        }

        AcquireToken(scopes: Array<string>, callback: Function): void;
        AcquireToken(scopes: Array<string>, callback: Function, loginHint: string): void;
        AcquireToken(scopes: Array<string>, callback: Function, loginHint: string, extraQueryParameters: string): void;

        AcquireToken(scopes: Array<string>, callback: Function, loginHint?: string, extraQueryParameters?: string):void {
            this.validateInputScope(scopes);
            //var token = this.getCachedToken(resource);
            //if (token) {
            //    console.log('Token is already in cache for resource:' + resource);
            //    callback(null, token);
            //    return;
            //}

            if (!this.User) {
                callback('User login is required', null);
                return;
            }

            let scope: string = scopes.join(' ');

            // refresh attept with iframe
            //Already renewing for this resource, callback when we get the token.
            //if (this.ActiveRenewals[scope]) {
            //    //Active renewals contains the state for each renewal.
            //    this.registerCallback(this.ActiveRenewals[scope], scope, callback);
            //}
            //else {
                let parameters: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, null, ResponseTypes.Token, this.RedirectUri);
                let expectedState = parameters.State + '|' + scope;
                this.saveItem(this.NONCE_IDTOKEN, parameters.Nonce);
                parameters.State = expectedState;

                if (extraQueryParameters) parameters.ExtraQueryParameters = extraQueryParameters;
                let urlNavigate: string = parameters.CreateNavigateUrl(scopes);
                urlNavigate = this.addHintParameters(urlNavigate, loginHint);
                this.RenewStates.push(expectedState);
                this.registerCallback(expectedState, scope, callback);
                console.log('Navigate to:' + urlNavigate);
                let popupWindow = this.openPopup(urlNavigate, "acquireToken", this.POPUP_WIDTH, this.POPUP_HEIGHT);
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
                    } catch (e) {
                    }
                }, 1);

            //}
       
        }

        AcquireTokenSilent(scopes: Array<string>, callback: Function): void {
            this.validateInputScope(scopes);
            //var token = this.getCachedToken(resource);
            //if (token) {
            //    console.log('Token is already in cache for resource:' + resource);
            //    callback(null, token);
            //    return;
            //}

            if (!this.User) {
                callback('User login is required', null);
                return;
            }

            let scope: string = scopes.join(' ');

            // refresh attept with iframe
            //Already renewing for this resource, callback when we get the token.
            if (this.ActiveRenewals[scope]) {
                //Active renewals contains the state for each renewal.
                this.registerCallback(this.ActiveRenewals[scope], scope, callback);
            }
            else {
                if (!this.isEmpty(scope) && scope.indexOf(this.ClientId) > -1) {
                    // App uses idtoken to send to api endpoints
                    // Default resource is tracked as clientid to store this token
                    console.log('renewing idtoken');
                    this.renewIdToken(scopes, callback);
                } else {
                    console.log('renewing accesstoken');
                    this.renewToken(scopes, callback);
                }
            }
        }

        private renewToken(scopes: Array<string>, callback: Function): void {
            var scope = scopes.join(' ');
            console.log('renewToken is called for resource:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            let parameters: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, scopes, ResponseTypes.Token, this.RedirectUri);
            var expectedState = Utils.Guid() + '|' + scope;
            parameters.State = expectedState;
            // renew happens in iframe, so it keeps javascript context
            this.RenewStates.push(expectedState);
            console.log('Renew token Expected state: ' + expectedState);
            var urlNavigate = parameters.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.registerCallback(expectedState, scope, callback);
            console.log('Navigate to:' + urlNavigate);
            //this.saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, '');
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        }

        private renewIdToken(scopes: Array<string>, callback: Function): void {
            console.log('renewIdToken is called');
            let frameHandle = this.addAdalFrame('adalIdTokenFrame');
            let parameters: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, scopes, ResponseTypes.IdToken, this.RedirectUri);
            let expectedState = parameters.State + '|' + this.ClientId;
            this.saveItem(this.NONCE_IDTOKEN, parameters.Nonce);
            parameters.State = expectedState;
            let urlNavigate: string = parameters.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.RenewStates.push(expectedState);
            this.registerCallback(expectedState, this.ClientId, callback);
            console.log('Navigate to:' + urlNavigate);
            //this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, '');
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.ClientId);
        }

        private validateInputScope(scopes: Array<string>): void {
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

        }

        private registerCallback(expectedState: string, resource: string, callback: Function): void {
            this.ActiveRenewals[resource] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            var self = this;
            window.callBacksMappedToRenewStates[expectedState].push(callback);
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] = function (message: string, token: string) {
                    for (var i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                        window.callBacksMappedToRenewStates[expectedState][i](message, token);
                    }
                    self.ActiveRenewals[resource] = null;
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        }

        private addHintParameters(urlNavigate: string, loginHint?: string): string {
            if (this.User && this.User.profile && this.User.profile.hasOwnProperty('preferred_username')) {
                // add login_hint
                if (loginHint) {
                    urlNavigate += '&login_hint=' + encodeURIComponent(loginHint);
                }
                else {
                    urlNavigate += '&login_hint=' + encodeURIComponent(this.User.profile.preferred_username);
                }
                // don't add domain_hint twice if user provided it in the extraQueryParameter value
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
        }

        private urlContainsQueryStringParameter(name: string, url: string): boolean {
            // regex to detect pattern of a ? or & followed by the name parameter and an equals character
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }

        private loadFrameTimeout(urlNavigate: string, frameName: string, resource: string): void {
            //set iframe session to pending
            console.log('Set loading state to pending for: ' + resource);
            this.saveItem(this.RENEW_STATUS + resource, this.TOKEN_RENEW_STATUS_IN_PROGRESS);
            this.loadFrame(urlNavigate, frameName);
            var self = this;
            setTimeout(function () {
                if (self.getItem(self.RENEW_STATUS + resource) === self.TOKEN_RENEW_STATUS_IN_PROGRESS) {
                    // fail the iframe session if it's in pending state
                    console.log('Loading frame has timed out after: ' + (self.LOADFRAME_TIMEOUT / 1000) + ' seconds for resource ' + resource);
                    var expectedState = self.ActiveRenewals[resource];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null);
                    }

                    self.saveItem(self.RENEW_STATUS + resource, self.TOKEN_RENEW_STATUS_CANCELED);
                }
            }, self.LOADFRAME_TIMEOUT);
        }

        private loadFrame(urlNavigate: string, frameName: string): void {
            // This trick overcomes iframe navigation in IE
            // IE does not load the page consistently in iframe
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
        }

        private addAdalFrame(iframeId: string): HTMLIFrameElement {
            if (typeof iframeId === 'undefined') {
                return;
            }

            console.log('Add adal frame to document:' + iframeId);
            var adalFrame = <HTMLIFrameElement>document.getElementById(iframeId);

            if (!adalFrame) {
                if (document.createElement && document.documentElement &&
                    (window.navigator.userAgent.indexOf('MSIE 5.0') === -1)) {
                    var ifr = document.createElement('iframe');
                    ifr.setAttribute('id', iframeId);
                    ifr.style.visibility = 'hidden';
                    ifr.style.position = 'absolute';
                    ifr.style.width = ifr.style.height = '0px';

                    adalFrame = <HTMLIFrameElement>document.getElementsByTagName('body')[0].appendChild(ifr);
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

        Logout(): void {
            this.clearCache();
            this.User = null;
            var urlNavigate: string;

            var logout = '';

            if (this.PostLogoutRedirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.PostLogoutRedirectUri);
            }

            urlNavigate = this.Authority + '/oauth2/v2.0/logout?' + logout;

            if (urlNavigate) {
                window.location.replace(urlNavigate);
            }
        }

        Login(): void {
            /*
            1. Create navigate url
            2. saves value in cache
            3. redirect user to AAD
            */

            let parameters: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.Authority, this.ClientId, this.AuthenticationMode, null , ResponseTypes.IdToken, this.RedirectUri);
            if (this.loginInProgress) {
                return;
            }

            this.saveItem(this.LOGIN_REQUEST, window.location.href);
            this.saveItem(this.LOGIN_ERROR, '');
            this.saveItem(this.STATE_LOGIN, parameters.State);
            this.saveItem(this.NONCE_IDTOKEN, parameters.Nonce);
            this.saveItem(this.ERROR, '');
            this.saveItem(this.ERROR_DESCRIPTION, '');

            let scopes = [this.ClientId];
            let urlNavigate: string = parameters.CreateNavigateUrl(scopes);
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
        }

        HandleAuthenticationResponse(hash:string): void {
            if (this.isCallback(hash)) {
                let requestInfo: RequestInfo = this.getRequestInfo(hash);
                this.saveTokenFromHash(requestInfo);
                let token: string = null, callback: any = null;
                if ((requestInfo.requestType === this.RENEW_TOKEN) && window.parent) {
                    // iframe call but same single page
                    console.log('Window is in iframe');
                    callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    if (callback)
                        callback(this.getItem(this.ERROR_DESCRIPTION), requestInfo.parameters[this.ACCESS_TOKEN] || requestInfo.parameters[this.ID_TOKEN]);
                    return;
                }
                try {
                    if (callback)
                        callback(this.getItem(this.ERROR_DESCRIPTION), token, this.getItem(this.ERROR));
                } catch (err) {
                }
                if (!(this.AuthenticationMode == AuthenticationModes.PopUp)) {
                    window.location.hash = '';
                    window.location.href = this.getItem(this.LOGIN_REQUEST);
                }
            }
        }

        checkSession(): void {
            console.log("checkSession");
            try {
                let frameId = "adalSession";
                this.CheckSessionIframe = this.addAdalFrame("adalSession");
                this.CheckSessionIframe.src = this.Authority + "/oauth2/checkSession";
                let boundMessageEvent = this.receiveMessage.bind(this);
                if (window.addEventListener) {  // For all major browsers, except IE 8 and earlier
                    window.addEventListener("message", boundMessageEvent, false);
                }
                let self = this;
                setTimeout(function () {
                    var sessionState = self.getItem(self.SESSION_STATE) || Utils.Guid();
                    var expectedState = self.ClientId + ' ' + sessionState;
                    self.CheckSessionIframe.contentWindow.postMessage(expectedState, self.Authority.replace("/common", ""));
                }, 300);
            } catch (err) {
                console.log('Error navigating iframe to checkSession endpoint', err);
            }
        }

        receiveMessage(e: MessageEvent): void {
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
        }

        private userSessionChanged(sessionState: string): void {
            var evt = new CustomEvent('adal:userSessionChanged', { detail: sessionState });
            window.dispatchEvent(evt);
        }

        private saveTokenFromHash(requestInfo: RequestInfo): void {
            this.saveItem(this.ERROR, '');
            this.saveItem(this.ERROR_DESCRIPTION, '');

            var resource = this.getResourceFromState(requestInfo.stateResponse);

            // Record error
            if (requestInfo.parameters.hasOwnProperty(this.ERROR_DESCRIPTION)) {
                this.saveItem(this.ERROR, requestInfo.parameters["error"]);
                this.saveItem(this.ERROR_DESCRIPTION, requestInfo.parameters[this.ERROR_DESCRIPTION]);

                if (requestInfo.requestType === this.LOGIN) {
                    this.loginInProgress = false;
                    this.saveItem(this.LOGIN_ERROR, requestInfo.parameters["error_description"]);
                }
            } else {
                // It must verify the state from redirect
                if (requestInfo.stateMatch) {
                    // record tokens to storage if exists
                    if (requestInfo.parameters.hasOwnProperty(this.SESSION_STATE)) {
                        this.saveItem(this.SESSION_STATE, requestInfo.parameters[this.SESSION_STATE]);
                    }

                    var keys: string;

                    if (requestInfo.parameters.hasOwnProperty(this.ACCESS_TOKEN)) {
                        if (!this.hasResource(resource)) {
                            keys = this.getItem(this.TOKEN_KEYS) || '';
                            this.saveItem(this.TOKEN_KEYS, keys + resource + this.RESOURCE_DELIMETER);
                        }
                        // save token with related resource
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
                            } else {
                                this.saveItem(this.IDTOKEN, requestInfo.parameters[this.ID_TOKEN]);

                                // Save idtoken as access token for app itself
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
                } else {
                    this.saveItem(this.ERROR, 'Invalid_state');
                    this.saveItem(this.ERROR_DESCRIPTION, 'Invalid_state. state: ' + requestInfo.stateResponse);
                }
            }
            this.saveItem(this.RENEW_STATUS + resource, this.TOKEN_RENEW_STATUS_COMPLETED);
        };

        isCallback(hash: string): boolean {
            hash = this.getHash(hash);
            var parameters = this.deserialize(hash);
            return (
                parameters.hasOwnProperty(this.ERROR_DESCRIPTION) ||
                parameters.hasOwnProperty(this.ACCESS_TOKEN) ||
                parameters.hasOwnProperty(this.ID_TOKEN)
            );
        }

        private getHash(hash: string): string {
            if (hash.indexOf('#/') > -1) {
                hash = hash.substring(hash.indexOf('#/') + 2);
            } else if (hash.indexOf('#') > -1) {
                hash = hash.substring(1);
            }

            return hash;
        };

        private deserialize(query: string): any {
            let match: Array<string>,
                pl = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=([^&]*)/g,
                decode = function (s: string) {
                    return decodeURIComponent(s.replace(pl, ' '));
                },
                obj = {};
            match = search.exec(query);
            while (match) {
                obj[decode(match[1])] = decode(match[2]);
                match = search.exec(query);
            }

            return obj;
        };

        private hasResource(key: string): boolean {
            var keys = this.getItem(this.TOKEN_KEYS);
            return keys && !this.isEmpty(keys) && (keys.indexOf(key + this.RESOURCE_DELIMETER) > -1);
        };

        private isEmpty(str: string): boolean {
            return (typeof str === 'undefined' || !str || 0 === str.length);
        };

        private createUser(idToken: string): User {
            var user: User;
            var parsedJson = this.extractIdToken(idToken);
            if (parsedJson && parsedJson.hasOwnProperty('aud')) {
                if (parsedJson.aud.toLowerCase() === this.ClientId.toLowerCase()) {

                    user = {
                        username: '',
                        profile: parsedJson
                    };

                    if (parsedJson.hasOwnProperty('upn')) {
                        user.username = parsedJson.upn;
                    } else if (parsedJson.hasOwnProperty('email')) {
                        user.username = parsedJson.email;
                    }
                } else {
                }

            }

            return user;
        };

        private extractIdToken(encodedIdToken: string): any {
            // id token will be decoded to get the username
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

                // ECMA script has JSON built-in support
                return JSON.parse(base64Decoded);
            } catch (err) {
            }

            return null;
        };

        private base64DecodeStringUrlSafe(base64IdToken: string): string {
            // html5 should support atob function for decoding
            base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken)); // jshint ignore:line
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        };

        private decode(base64IdToken: string): string {
            var codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            base64IdToken = String(base64IdToken).replace(/=+$/, '');

            var length = base64IdToken.length;
            if (length % 4 === 1) {
                throw new Error('The token to be decoded is not correctly encoded.');
            }

            let h1: number, h2: number, h3: number, h4: number, bits: number, c1: number, c2: number, c3: number, decoded = '';
            for (var i = 0; i < length; i += 4) {
                //Every 4 base64 encoded character will be converted to 3 byte string, which is 24 bits
                // then 6 bits per base64 encoded character
                h1 = codes.indexOf(base64IdToken.charAt(i));
                h2 = codes.indexOf(base64IdToken.charAt(i + 1));
                h3 = codes.indexOf(base64IdToken.charAt(i + 2));
                h4 = codes.indexOf(base64IdToken.charAt(i + 3));

                // For padding, if last two are '='
                if (i + 2 === length - 1) {
                    bits = h1 << 18 | h2 << 12 | h3 << 6;
                    c1 = bits >> 16 & 255;
                    c2 = bits >> 8 & 255;
                    decoded += String.fromCharCode(c1, c2);
                    break;
                }
                // if last one is '='
                else if (i + 1 === length - 1) {
                    bits = h1 << 18 | h2 << 12
                    c1 = bits >> 16 & 255;
                    decoded += String.fromCharCode(c1);
                    break;
                }

                bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

                // then convert to 3 byte chars
                c1 = bits >> 16 & 255;
                c2 = bits >> 8 & 255;
                c3 = bits & 255;

                decoded += String.fromCharCode(c1, c2, c3);
            }

            return decoded;
        };

        private decodeJwt(jwtToken: string): any {
            if (this.isEmpty(jwtToken)) {
                return null;
            };

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


        private getRequestInfo(hash: string): RequestInfo {
            hash = this.getHash(hash);
            let parameters = this.deserialize(hash);
            let requestInfo: RequestInfo = new RequestInfo();
            if (parameters) {
                requestInfo.parameters = parameters;
                if (parameters.hasOwnProperty(this.ERROR_DESCRIPTION) ||
                    parameters.hasOwnProperty(this.ACCESS_TOKEN) ||
                    parameters.hasOwnProperty(this.ID_TOKEN)) {

                    requestInfo.valid = true;

                    // which call
                    var stateResponse = '';
                    if (parameters.hasOwnProperty('state')) {
                        stateResponse = parameters.state;
                    } else {
                        return requestInfo;
                    }

                    requestInfo.stateResponse = stateResponse;

                    // async calls can fire iframe and login request at the same time if developer does not use the API as expected
                    // incoming callback needs to be looked up to find the request type
                    if (stateResponse === this.getItem(this.STATE_LOGIN)) {
                        requestInfo.requestType = this.LOGIN;
                        requestInfo.stateMatch = true;
                        return requestInfo;
                    }

                    // external api requests may have many renewtoken requests for different resource
                    if (!requestInfo.stateMatch && window.parent && window.parent.MSAL) {
                        var clientApplication = <ClientApplication>window.parent.MSAL;
                        var statesInParentContext: Array<string> = clientApplication.RenewStates;
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

        private getResourceFromState(state: string): string {
            if (state) {
                var splitIndex = state.indexOf('|');
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }

            return '';
        };

        private expiresIn(expires: string): number {
            // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
            if (!expires) expires = '3599';
            return this.now() + parseInt(expires, 10);
        };

        private now(): number {
            return Math.round(new Date().getTime() / 1000.0);
        };

        private clearCache(): void {
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
                var keys: Array<string> = key.split(this.RESOURCE_DELIMETER);
                for (var i = 0; i < keys.length; i++) {
                    this.saveItem(this.ACCESS_TOKEN_KEY + keys[i], '');
                    this.saveItem(this.EXPIRATION_KEY + keys[i], "0");
                }
            }
            this.saveItem(this.TOKEN_KEYS, '');
        };

        private saveItem(key: string, obj: string): boolean {

            if (this.CacheLocation && this.CacheLocation == CacheLocations.LocalStorage) {
                if (!this.supportsLocalStorage()) {
                    return false;
                }
                localStorage.setItem(key, obj);
                return true;
            }

            // Default as session storage
            if (!this.supportsSessionStorage()) {
                return false;
            }
            sessionStorage.setItem(key, obj);
            return true;
        };

        private getItem(key: string): string {

            if (this.CacheLocation && this.CacheLocation == CacheLocations.LocalStorage) {
                if (!this.supportsLocalStorage()) {
                    return null;
                }

                return localStorage.getItem(key);
            }

            // Default as session storage
            if (!this.supportsSessionStorage()) {
                return null;
            }

            return sessionStorage.getItem(key);
        };

        private supportsLocalStorage(): boolean {
            try {
                var supportsLocalStorage = 'localStorage' in window && window['localStorage'];
                if (supportsLocalStorage) {
                    window.localStorage.setItem('storageTest', '');
                    window.localStorage.removeItem('storageTest');
                }
                return true;
            } catch (e) {
                return false;
            }
        };

        private supportsSessionStorage(): boolean {
            try {
                var supportsSessionStorage = 'sessionStorage' in window && window['sessionStorage'];
                if (supportsSessionStorage) {
                    window.sessionStorage.setItem('storageTest', '');
                    window.sessionStorage.removeItem('storageTest');
                }
                return true;
            } catch (e) {
                return false;
            }
        };

    }

    enum AuthenticationModes {
        Redirect,
        PopUp
    }

    enum CacheLocations {
        SessionStorage,
        LocalStorage
    }

    class PromptValues {
        static None: string = "none";
        static SelectAccount: string = "select_account";
    }

    class ResponseTypes {
        static IdToken: string = "id_token";
        static Token: string = "token";
    }

    class User {
        username: string;
        profile: any;
    }

    class RequestInfo {
        valid: boolean;
        parameters: Object;
        stateMatch: boolean;
        stateResponse: string;
        requestType: string;

        constructor() {
            this.valid = false;
            this.parameters = {};
            this.stateMatch = false;
            this.stateResponse = '';
            this.requestType = 'unknown';
        }
    }

    class AuthenticationResult {

    }

    class AuthenticationRequestParameters {

        Authority: string;
        ClientId: string;
        Nonce: string;
        State: string;
        CorrelationId: string;
        PromptValue: AuthenticationModes;
        XClientVer: string;
        XClientSku: string;
        Scopes: Array<string>;
        ResponseType: string;
        ExtraQueryParameters: string;
        LoginHint: string;
        DomainHint: string;
        RedirectUri: string;

        constructor(authority: string, clientId: string, promptValue: AuthenticationModes, scopes: Array<string>, responseType: string, redirectUri: string) {
            this.Authority = authority;
            this.ClientId = clientId;
            this.PromptValue = promptValue;
            this.Scopes = scopes;
            this.ResponseType = responseType;
            this.RedirectUri = redirectUri;

            // randomly generated values
            if (responseType !== "token") {
                this.Nonce = Utils.Guid();
            }

            if (this.Scopes == null) this.Scopes = new Array<string>();
            this.CorrelationId = Utils.Guid();
            this.State = Utils.Guid();
            this.Nonce = Utils.Guid();

            // telemetry information
            this.XClientSku = "Js";
            this.XClientVer = Utils.GetLibraryVersion();
        }

        CreateNavigateUrl(scopes: Array<string>): string {
            let requestUrl = "";
            let str: Array<string> = [];
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
        }

        private translateClientIdUsedInScope(scopes: Array<string>): void {
            var clientIdIndex = scopes.indexOf(this.ClientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                scopes.push('openid');
                scopes.push('profile');
            }
        }

        private parseScope(scopes: Array<string>): string {
            var scopeList = '';
            if (scopes) {
                for (var i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + ' ' : scopes[i];
                }
            }
            return scopeList;
        }
    }

    class Utils {

        static DecimalToHex(num: number): string {
            var hex: string = num.toString(16);
            while (hex.length < 2) {
                hex = '0' + hex;
            }
            return hex;
        }

        static GetLibraryVersion(): string {
            return "0.1";
        }

        static Guid(): string {
            // RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
            // pseudo-random numbers.
            // The algorithm is as follows:
            //     Set the two most significant bits (bits 6 and 7) of the
            //        clock_seq_hi_and_reserved to zero and one, respectively.
            //     Set the four most significant bits (bits 12 through 15) of the
            //        time_hi_and_version field to the 4-bit version number from
            //        Section 4.1.3. Version4
            //     Set all the other bits to randomly (or pseudo-randomly) chosen
            //     values.
            // UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
            // time-low               = 4hexOctet
            // time-mid               = 2hexOctet
            // time-high-and-version  = 2hexOctet
            // clock-seq-and-reserved = hexOctet:
            // clock-seq-low          = hexOctet
            // node                   = 6hexOctet
            // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            // y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
            // y values are 8, 9, A, B

            var cryptoObj: Crypto = window.crypto; // for IE 11
            if (cryptoObj && cryptoObj.getRandomValues) {
                var buffer: Uint8Array = new Uint8Array(16);
                cryptoObj.getRandomValues(buffer);

                //buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
                buffer[6] |= 0x40; //buffer[6] | 01000000 will set the 6 bit to 1.
                buffer[6] &= 0x4f; //buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".

                //buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
                buffer[8] |= 0x80; //buffer[8] | 10000000 will set the 7 bit to 1.
                buffer[8] &= 0xbf; //buffer[8] & 10111111 will set the 6 bit to 0.

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
                var guidHolder: string = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
                var hex: string = '0123456789abcdef';
                var r: number = 0;
                var guidResponse: string = "";
                for (var i: number = 0; i < 36; i++) {
                    if (guidHolder[i] !== '-' && guidHolder[i] !== '4') {
                        // each x and y needs to be random
                        r = Math.random() * 16 | 0;
                    }
                    if (guidHolder[i] === 'x') {
                        guidResponse += hex[r];
                    } else if (guidHolder[i] === 'y') {
                        // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                        r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                        r |= 0x8; // set pos 3 to 1 as 1???
                        guidResponse += hex[r];
                    } else {
                        guidResponse += guidHolder[i];
                    }
                }
                return guidResponse;
            }
        };
    }
}