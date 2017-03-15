interface Window {
    MSAL: Object,
    callBackMappedToRenewStates: Object;
    callBacksMappedToRenewStates: Object;
}

namespace MSAL {

    enum ResponseTypes {
        id_token,
        token
    }

    enum LoggingLevel {
        ERROR,
        WARN,
        INFO,
        VERBOSE
    }

    export class Logging {
        static _logLevel: number = 0;
        static _loginCallback: Function = null;
        static _correlationId: string = null;
        static initialize(logLevel: number, loginCallback: Function, correlationId?: string) {
            this._logLevel = logLevel;
            this._loginCallback = loginCallback;
            this._correlationId = correlationId;
        }
    }

    export class Constants {
        static get errorDescription(): string { return "error_description"; }
        static get idToken(): string { return "id_token"; }
        static get accessToken(): string { return "access_token"; }
        static get expiresIn(): string { return "expires_in"; }
        static get sessionState(): string { return "session_state"; }
        static get tokenKeys(): string { return "adal.token.keys"; }
        static get accessTokenKey(): string { return "adal.access.token.key"; }
        static get expirationKey(): string { return "adal.expiration.key"; }
        static get stateLogin(): string { return "adal.state.login"; }
        static get stateAcquireToken(): string { return "adal.state.acquireToken"; }
        static get stateRenew(): string { return "adal.state.renew"; }
        static get nonceIdToken(): string { return "adal.nonce.idtoken"; }
        static get userName(): string { return "adal.username"; }
        static get idTokenKey(): string { return "adal.idtoken"; }
        static get error(): string { return "adal.error"; }
        static get loginRequest(): string { return "adal.login.request"; }
        static get loginError(): string { return "adal.login.error"; }
        static get renewStatus(): string { return "adal.token.renew.status"; }
        static get resourceDelimeter(): string { return "|"; }
        private static _loadFrameTimeout: number = 6000;
        static get loadFrameTimeout(): number {
            return this._loadFrameTimeout;
        };
        static set loadFrameTimeout(timeout: number) {
            this._loadFrameTimeout = timeout;
        };
        static get tokenRenewStatusCancelled(): string { return "Canceled"; }
        static get tokenRenewStatusCompleted(): string { return "Completed"; }
        static get tokenRenewStatusInProgress(): string { return "In Progress"; }
        private static _popUpWidth: number = 483;
        static get popUpWidth(): number { return this._popUpWidth; }
        static set popUpWidth(width: number) {
            this._popUpWidth = width;
        };
        private static _popUpHeight: number = 600;
        static get popUpHeight(): number { return this._popUpHeight; }
        static set popUpHeight(height: number) {
            this._popUpHeight = height;
        };
        static get login(): string { return "LOGIN"; }
        static get renewToken(): string { return "renewToken"; }
        static get unknown(): string { return "UNKNOWN"; }
    }

    export class UserAgentApplication {

        private _cacheLocations = {
            localStorage: 'localStorage',
            sessionStorage: 'sessionStorage'
        };
        private _cacheLocation: string = 'sessionStorage';
        set cacheLocation(cache: string) {
            this._cacheLocation = cache;
            if (this._cacheLocations[cache])
                this._cacheStorage = new Storage(this._cacheLocations[cache]);
            else
                throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
        }
        get cacheLocation() {
            return this._cacheLocation;
        }
        private _interactionModes = {
            popUp: 'popUp',
            redirect: 'redirect'
        }
        private _interactionMode: string = 'redirect';
        set interactionMode(mode: string) {
            if (this._interactionModes[mode])
                this._interactionMode = this._interactionModes[mode];
            else
                throw new Error('Interantion mode is not valid. Provided value:' + this._interactionMode + '.Possible values are: ' + this._interactionModes.redirect + ',' + this._interactionModes.popUp);
        }
        get interactionMode() {
            return this._interactionMode;
        }
        private _loginInProgress: boolean;
        private _acquireTokenInProgress: boolean;
        private _checkSessionIframe: HTMLIFrameElement;
        private _renewStates: Array<string>;
        private _activeRenewals: Object;
        private _sessionState: string;
        private _clockSkew: number = 300;
        private _cacheStorage: Storage;
        private _userCallback: Function = null;
        user: User;
        clientId: string;
        authority: string = "https://login.microsoftonline.com/common";
        redirectUri: string;
        postLogoutredirectUri: string;
        correlationId: string;
        // validatAuthority: boolean = true; This will be implemented after the build. Only scenarios that will be affected are the ones where the authority is dynamically discovered.
        navigateToLoginRequestUrl: boolean = true;

        constructor(clientId: string, authority?: string, userCallback?: Function) {
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

        login(): void {
            /*
            1. Create navigate url
            2. saves value in cache
            3. redirect user to AAD
            */
            if (this._loginInProgress) {
                return;
            }
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, null, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            this._cacheStorage.saveItem(Constants.loginRequest, window.location.href);
            this._cacheStorage.saveItem(Constants.loginError, '');
            this._cacheStorage.saveItem(Constants.stateLogin, authenticationRequest.state);
            this._cacheStorage.saveItem(Constants.nonceIdToken, authenticationRequest.nonce);
            this._cacheStorage.saveItem(Constants.error, '');
            this._cacheStorage.saveItem(Constants.errorDescription, '');
            let urlNavigate: string = authenticationRequest.CreateNavigateUrl(null);
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

        private openConsentWindow(urlNavigate: string, title: string, interval: number, instance: this, callback: Function): void {
            let popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false
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
                    instance._acquireTokenInProgress = false
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
                } catch (e) {
                    //Cross Domain url check error. Will be thrown until AAD redirects the user back to the app's root page with the token. No need to log or throw this error as it will create unnecessary traffic.
                }
            }, interval);
        }

        logout(): void {
            this._cacheStorage.clear();
            this.user = null;
            var logout = '';
            if (this.postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.postLogoutredirectUri);
            }
            let urlNavigate: string = this.authority + '/oauth2/v2.0/logout?' + logout;
            if (urlNavigate) {
                window.location.replace(urlNavigate);
            }
        }

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
                Logger.warn('error opening popup, ' + e.message);
                this._loginInProgress = false;
                return null;
            }
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
            if (scopes.indexOf(this.clientId) > -1) {
                if (scopes.length > 1) {
                    throw new Error('Client Id can only be provided as a single scope');
                }
            }
        }

        private registerCallback(expectedState: string, scope: string, callback: Function): void {
            this._activeRenewals[scope] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            var self = this;
            window.callBacksMappedToRenewStates[expectedState].push(callback);
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] = function (errorDesc: string, token: string, error: string) {
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
        }

        private getCachedToken(scopes: Array<string>): string {
            let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, this.authority);
            let accessTokenItems: Array<AccessTokenCacheItem> = []; // Array to store multiple accessTokens for the same set of scopes
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                let accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.user.profile.oid === this.user.profile.oid) {
                    let cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                    if (Utils.containsScope(cachedScopes, scopes)) {
                        accessTokenItems.push(accessTokenCacheItem);
                    }
                }
            }
            if (accessTokenItems.length === 0 || accessTokenCacheItems.length > 1)
                return null; //access token not found
            else {
                let accessTokenCacheItem = accessTokenItems[0];
                var expired: number = Number(accessTokenCacheItem.value.ExpiresIn);
                // If expiration is within offset, it will force renew
                var offset = this._clockSkew || 300;
                if (expired && (expired > Utils.now() + offset)) {
                    return accessTokenCacheItem.value.AccessToken;
                } else {
                    this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[0]));
                    return null;
                }
            }
        }

        private addHintParameters(urlNavigate: string, loginHint?: string): string {
            if (this.user && this.user.profile && this.user.profile.hasOwnProperty('preferred_username')) {
                // add login_hint
                if (loginHint) {
                    urlNavigate += '&login_hint=' + encodeURIComponent(loginHint);
                }
                else {
                    urlNavigate += '&login_hint=' + encodeURIComponent(this.user.profile.preferred_username);
                }
                // don't add domain_hint twice if user provided it in the extraQueryParameter value
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

        private urlContainsQueryStringParameter(name: string, url: string): boolean {
            // regex to detect pattern of a ? or & followed by the name parameter and an equals character
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }

        acquireToken(scopes: Array<string>, callback: Function): void;
        acquireToken(scopes: Array<string>, callback: Function, loginHint: string): void;
        acquireToken(scopes: Array<string>, callback: Function, loginHint: string, extraQueryParameters: string): void;

        acquireToken(scopes: Array<string>, callback: Function, loginHint?: string, extraQueryParameters?: string): void {
            if (this._acquireTokenInProgress) {
                return;
            }
            this.validateInputScope(scopes);
            let scope: string = scopes.join(' ');
            if (!this.user) {
                callback('user login is required', null);
                return;
            }
            this._acquireTokenInProgress = true;
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            let urlNavigate: string = authenticationRequest.CreateNavigateUrl(scopes);
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

        }

        acquireTokenSilent(scopes: Array<string>, callback: Function): void {
            this.validateInputScope(scopes);
            var token = this.getCachedToken(scopes);
            let scope: string = scopes.join(' ');
            if (token) {
                Logger.info('Token is already in cache for scope:' + scope);
                callback(null, token);
                return;
            }
            if (!this.user) {
                callback('user login is required', null);
                return;
            }
            // refresh attept with iframe
            //Already renewing for this scope, callback when we get the token.
            if (this._activeRenewals[scope]) {
                //Active renewals contains the state for each renewal.
                this.registerCallback(this._activeRenewals[scope], scope, callback);
            }
            else {
                if (!Utils.isEmpty(scope) && scope.indexOf(this.clientId) > -1) {
                    // App uses idToken to send to api endpoints
                    // Default scope is tracked as clientId to store this token
                    Logger.verbose('renewing idToken');
                    this.renewIdToken(scopes, callback);
                } else {
                    Logger.verbose('renewing accesstoken');
                    this.renewToken(scopes, callback);
                }
            }
        }

        private loadFrameTimeout(urlNavigate: string, frameName: string, scope: string): void {
            //set iframe session to pending
            Logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            var self = this;
            setTimeout(function () {
                if (self._cacheStorage.getItem(Constants.renewStatus + scope) === Constants.tokenRenewStatusInProgress) {
                    // fail the iframe session if it's in pending state
                    Logger.verbose('Loading frame has timed out after: ' + (Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    var expectedState = self._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null);
                    }

                    self._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCancelled);
                }
            }, Constants.loadFrameTimeout);
        }

        private loadFrame(urlNavigate: string, frameName: string): void {
            // This trick overcomes iframe navigation in IE
            // IE does not load the page consistently in iframe
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
        }

        private addAdalFrame(iframeId: string): HTMLIFrameElement {
            if (typeof iframeId === 'undefined') {
                return;
            }
            Logger.info('Add adal frame to document:' + iframeId);
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

        private renewToken(scopes: Array<string>, callback: Function): void {
            var scope = scopes.join(' ');
            Logger.verbose('renewToken is called for scope:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            // renew happens in iframe, so it keeps javascript context
            this._renewStates.push(authenticationRequest.state);
            Logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            let urlNavigate: string = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this.registerCallback(authenticationRequest.state, scope, callback);
            Logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        }

        private renewIdToken(scopes: Array<string>, callback: Function): void {
            Logger.info('renewidToken is called');
            let frameHandle = this.addAdalFrame('adalIdTokenFrame');
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + this.clientId;
            this._cacheStorage.saveItem(Constants.nonceIdToken, authenticationRequest.nonce);
            Logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, callback);
            Logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalIdTokenFrame', this.clientId);
        }

        private hasScope(key: string): boolean {
            var keys = this._cacheStorage.getItem(Constants.tokenKeys);
            return keys && !Utils.isEmpty(keys) && (keys.indexOf(key + Constants.resourceDelimeter) > -1);
        };

        getUser(): User {
            // idToken is first call
            if (this.user) {
                return this.user;
            }
            // frame is used to get idToken
            var idToken = this._cacheStorage.getItem(Constants.idTokenKey);
            if (!Utils.isEmpty(idToken)) {
                this.user = this.createUser(idToken);
                return this.user;
            }
            return null;
        };

        handleAuthenticationResponse(hash: string): void {
            if (hash == null)
                hash = window.location.hash;
            if (this.isCallback(hash)) {
                let requestInfo: RequestInfo = this.getRequestInfo(hash);
                Logger.info('Returned from redirect url');
                this.saveTokenFromHash(requestInfo);
                let token: string = null, callback: Function = null;
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
                } else if (requestInfo.requestType === Constants.login) {
                    callback = this._userCallback;
                    token = requestInfo.parameters[Constants.idToken];
                }
                try {
                    if (callback)
                        callback(this._cacheStorage.getItem(Constants.errorDescription), token, this._cacheStorage.getItem(Constants.error));
                } catch (err) {
                    Logger.error('Error occurred in user defined callback function', err)
                }
                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = '';
                    if (this.navigateToLoginRequestUrl && window.location.href.replace('#', '') !== this._cacheStorage.getItem(Constants.loginRequest))
                        window.location.href = this._cacheStorage.getItem(Constants.loginRequest);
                }
            }
        }

        private saveAccessToken(requestInfo: RequestInfo): void {
            if (requestInfo.parameters.hasOwnProperty('scope')) {
                this.user = this.getUser();
                let scopes = requestInfo.parameters['scope'];
                let consentedScopes = scopes.split(' ');
                let accessTokenCacheItems: Array<AccessTokenCacheItem> = this._cacheStorage.getAllAccessTokens(this.clientId, this.authority);
                for (let i = 0; i < accessTokenCacheItems.length; i++) {
                    let accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.user.profile.oid === this.user.profile.oid) {
                        var cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                        if (Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem));
                        }
                    }
                }
                let accessTokenKey = new AccessTokenKey(this.authority, this.clientId, this.user, scopes);
                let accessTokenValue = new AccessTokenValue(requestInfo.parameters[Constants.accessToken], Utils.expiresIn(requestInfo.parameters[Constants.expiresIn]).toString());
                this._cacheStorage.saveItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
        }

        private saveTokenFromHash(requestInfo: RequestInfo): void {
            Logger.info('State status:' + requestInfo.stateMatch + '; Request type:' + requestInfo.requestType);
            this._cacheStorage.saveItem(Constants.error, '');
            this._cacheStorage.saveItem(Constants.errorDescription, '');
            var scope = this.getScopeFromState(requestInfo.stateResponse);
            // Record error
            if (requestInfo.parameters.hasOwnProperty(Constants.errorDescription)) {
                Logger.info('Error :' + requestInfo.parameters[Constants.error] + '; Error description:' + requestInfo.parameters[Constants.errorDescription]);
                this._cacheStorage.saveItem(Constants.error, requestInfo.parameters["error"]);
                this._cacheStorage.saveItem(Constants.errorDescription, requestInfo.parameters[Constants.errorDescription]);
                if (requestInfo.requestType === Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.saveItem(Constants.loginError, requestInfo.parameters["errorDescription"]);
                }
            } else {
                // It must verify the state from redirect
                if (requestInfo.stateMatch) {
                    // record tokens to storage if exists
                    Logger.info('State is right');
                    if (requestInfo.parameters.hasOwnProperty(Constants.sessionState)) {
                        this._cacheStorage.saveItem(Constants.sessionState, requestInfo.parameters[Constants.sessionState]);
                    }
                    var keys: string;
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
                            } else {
                                this._cacheStorage.saveItem(Constants.idTokenKey, requestInfo.parameters[Constants.idToken]);
                                // Save idToken as access token for app itself
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
                } else {
                    this._cacheStorage.saveItem(Constants.error, 'Invalid_state');
                    this._cacheStorage.saveItem(Constants.errorDescription, 'Invalid_state. state: ' + requestInfo.stateResponse);
                }
            }
            this._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCompleted);
        };

        isCallback(hash: string): boolean {
            hash = this.getHash(hash);
            var parameters = Utils.deserialize(hash);
            return (
                parameters.hasOwnProperty(Constants.errorDescription) ||
                parameters.hasOwnProperty(Constants.accessToken) ||
                parameters.hasOwnProperty(Constants.idToken)
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

        private getRequestInfo(hash: string): RequestInfo {
            hash = this.getHash(hash);
            let parameters = Utils.deserialize(hash);
            let requestInfo: RequestInfo = new RequestInfo();
            if (parameters) {
                requestInfo.parameters = parameters;
                if (parameters.hasOwnProperty(Constants.errorDescription) ||
                    parameters.hasOwnProperty(Constants.accessToken) ||
                    parameters.hasOwnProperty(Constants.idToken)) {
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
                    // external api requests may have many renewtoken requests for different resource
                    if (!requestInfo.stateMatch && window.parent && window.parent.MSAL) {
                        var clientApplication = <UserAgentApplication>window.parent.MSAL;
                        var statesInParentContext: Array<string> = clientApplication._renewStates;
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

        private getScopeFromState(state: string): string {
            if (state) {
                var splitIndex = state.indexOf('|');
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return '';
        };

        private createUser(idToken: string): User {
            var user: User;
            var parsedJson = Utils.extractIdToken(idToken);
            if (parsedJson && parsedJson.hasOwnProperty('aud')) {
                if (parsedJson.aud.toLowerCase() === this.clientId.toLowerCase()) {
                    user = {
                        username: '',
                        profile: parsedJson
                    };
                    if (parsedJson.hasOwnProperty('preferred_username')) {
                        user.username = parsedJson.preferred_username;
                    } else if (parsedJson.hasOwnProperty('email')) {
                        user.username = parsedJson.email;
                    }
                } else {
                }
            }
            return user;
        };

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

    class AccessTokenCacheItem {
        key: AccessTokenKey;
        value: AccessTokenValue;
        constructor(key: AccessTokenKey, value: AccessTokenValue) {
            this.key = key;
            this.value = value;
        }
    }

    class AccessTokenValue {
        AccessToken: string;
        ExpiresIn: string;
        constructor(accessToken: string, expiresIn: string) {
            this.AccessToken = accessToken;
            this.ExpiresIn = expiresIn;
        }
    }

    class AccessTokenKey {
        authority: string;
        clientId: string;
        user: User;
        Scopes: string;

        constructor(authority: string, clientId: string, user: User, scopes: string) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.user = user;
        }
    }

    class AuthenticationRequestParameters {
        authority: string;
        clientId: string;
        nonce: string;
        state: string;
        correlationId: string;
        xClientVer: string;
        xClientSku: string;
        scopes: Array<string>;
        responseType: string;
        promptValue: string;
        extraQueryParameters: string;
        loginHint: string;
        domainHint: string;
        redirectUri: string;

        constructor(authority: string, clientId: string, scope: Array<string>, responseType: string, redirectUri: string) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scope;
            this.responseType = responseType;
            this.redirectUri = redirectUri;
            // randomly generated values
            if (responseType !== "token") {
                this.nonce = Utils.Guid();
            }
            this.correlationId = Utils.Guid();
            this.state = Utils.Guid();
            this.nonce = Utils.Guid();
            // telemetry information
            this.xClientSku = "Js";
            this.xClientVer = Utils.GetLibraryVersion();
        }

        CreateNavigateUrl(scopes: Array<string>): string {
            if (!scopes)
                scopes = [this.clientId];
            let requestUrl = "";
            let str: Array<string> = [];
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

        translateclientIdUsedInScope(scopes: Array<string>): void {
            var clientIdIndex = scopes.indexOf(this.clientId);
            if (clientIdIndex >= 0) {
                scopes.splice(clientIdIndex, 1);
                scopes.push('openid');
                scopes.push('profile');
            }
        }

        parseScope(scopes: Array<string>): string {
            var scopeList = '';
            if (scopes) {
                for (var i = 0; i < scopes.length; ++i) {
                    scopeList += (i !== scopes.length - 1) ? scopes[i] + ' ' : scopes[i];
                }
            }
            return scopeList;
        }
    }

    class Storage {

        private _localStorageSupported: boolean;
        private _sessionStorageSupported: boolean;
        private _cacheLocation: string;

        constructor(cacheLocation: string) {
            this._cacheLocation = cacheLocation;
            this._localStorageSupported = typeof window[this._cacheLocation] != "undefined" && window[this._cacheLocation] != null;
            this._sessionStorageSupported = typeof window[cacheLocation] != "undefined" && window[cacheLocation] != null;
            if (!this._localStorageSupported && !this._sessionStorageSupported)
                throw new Error('localStorage and sessionStorage not supported');
        }

        // add value to storage
        saveItem(key: string, value: string): void {
            if (window[this._cacheLocation])
                window[this._cacheLocation].setItem(key, value);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }

        // get one item by key from storage
        getItem(key: string): string {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].getItem(key);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }

        // remove value from storage
        removeItem(key: string): void {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].removeItem(key);
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }

        // clear storage (remove all items from it)
        clear(): void {
            if (window[this._cacheLocation])
                return window[this._cacheLocation].clear();
            else
                throw new Error('localStorage and sessionStorage are not supported');
        }

        getAllAccessTokens(clientId: string, authority: string): Array<AccessTokenCacheItem> {
            let key: string;
            let results: Array<AccessTokenCacheItem> = [];
            let accessTokenCacheItem: AccessTokenCacheItem;
            let storage = window[this._cacheLocation];
            if (storage) {
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(authority)) {
                            let value = this.getItem(key);
                            accessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
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


    class Logger {

        static log(level: number, message: string, error: string): void {
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
        }

        static error(message: string, error: string): void {
            this.log(LoggingLevel.ERROR, message, error);
        }

        static warn(message: string): void {
            this.log(LoggingLevel.WARN, message, null);
        }

        static info(message: string): void {
            this.log(LoggingLevel.INFO, message, null);
        }

        static verbose(message: string): void {
            this.log(LoggingLevel.VERBOSE, message, null);
        }

        static libVersion(): string {
            return '1.0.0';
        }
    }

    class Utils {

        static expiresIn(expires: string): number {
            // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
            if (!expires) expires = '3599';
            return this.now() + parseInt(expires, 10);
        };

        static now(): number {
            return Math.round(new Date().getTime() / 1000.0);
        };

        static isEmpty(str: string): boolean {
            return (typeof str === 'undefined' || !str || 0 === str.length);
        };

        static extractIdToken(encodedIdToken: string): any {
            // id token will be decoded to get the username
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
                // ECMA script has JSON built-in support
                return JSON.parse(base64Decoded);
            } catch (err) {
                Logger.error('The returned id_token could not be decoded', err);
            }

            return null;
        };

        static base64DecodeStringUrlSafe(base64IdToken: string): string {
            // html5 should support atob function for decoding
            base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
            if (window.atob) {
                return decodeURIComponent(window.atob(base64IdToken)); // jshint ignore:line
            }
            else {
                return decodeURIComponent(this.decode(base64IdToken));
            }
        };

        static decode(base64IdToken: string): string {
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

        static decodeJwt(jwtToken: string): any {
            if (this.isEmpty(jwtToken)) {
                return null;
            };
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


        static deserialize(query: string): any {
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

        static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean {
            for (let i = 0; i < scopes.length; i++) {
                if (cachedScopes.indexOf(scopes[i]) > -1)
                    return true;
            }
            return false;
        }

        static containsScope(cachedScopes: Array<string>, scopes: Array<string>): boolean {
            return scopes.every(function (value) {
                return cachedScopes.indexOf(value) >= 0;
            });
        }

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