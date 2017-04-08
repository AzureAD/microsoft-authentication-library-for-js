namespace MSAL {

    export class UserAgentApplication {

        private _cacheLocations = {
            localStorage: 'localStorage',
            sessionStorage: 'sessionStorage'
        };

        private _cacheLocation: string = 'sessionStorage';
        get cacheLocation(): string {
            return this._cacheLocation;
        }

        set cacheLocation(cache: string) {
            this._cacheLocation = cache;
            if (this._cacheLocations[cache])
                this._cacheStorage = new Storage(this._cacheLocations[cache]);
            else
                throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
        }

        private _interactionModes = {
            popUp: 'popUp',
            redirect: 'redirect'
        }

        private _interactionMode: string = 'redirect';
        get interactionMode(): string {
            return this._interactionMode;
        }

        set interactionMode(mode: string) {
            if (this._interactionModes[mode])
                this._interactionMode = this._interactionModes[mode];
            else
                throw new Error('Interantion mode is not valid. Provided value:' + this._interactionMode + '.Possible values are: ' + this._interactionModes.redirect + ',' + this._interactionModes.popUp);
        }

        private _requestContext: RequestContext;
        private _loginInProgress: boolean;
        private _acquireTokenInProgress: boolean;
        private _renewStates: Array<string>;
        private _activeRenewals: Object;
        private _clockSkew: number = 300;
        private _cacheStorage: Storage;
        private _userCallback: (errorDesc: string, token: string, error: string) => void = null;
        user: User;
        clientId: string;
        authority: string = "https://login.microsoftonline.com/common";
        redirectUri: string;
        postLogoutredirectUri: string;
        correlationId: string;
        // validatAuthority: boolean = true; This will be implemented after the build. Only scenarios that will be affected are the ones where the authority is dynamically discovered.
        navigateToLoginRequestUrl: boolean = true;

        constructor(clientId: string, authority: string, userCallback: (errorDesc: string, token: string, error: string) => void) {
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
            this._cacheStorage = new Storage(this._cacheLocation);//cache keys msal
            this._requestContext = new RequestContext('');
            window.MSAL = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
        }

        login(extraQueryParameters?: Array<string>): void {
            /*
            1. Create navigate url
            2. saves value in cache
            3. redirect user to AAD
            */
            if (this._loginInProgress) {
                return;
            }

            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, null, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
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
                this._requestContext.logger.info('Popup Window is null. This can happen if you are using IE');
                this._cacheStorage.saveItem(Constants.error, 'Error opening popup');
                this._cacheStorage.saveItem(Constants.errorDescription, 'Popup Window is null. This can happen if you are using IE');
                this._cacheStorage.saveItem(Constants.loginError, 'Popup Window is null. This can happen if you are using IE');
                if (callback) {
                    callback(this._cacheStorage.getItem(Constants.loginError), null, null);
                }

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
                        self._requestContext.logger.info("Closing popup window");
                        popupWindow.close();
                    }
                } catch (e) {
                    //Cross Domain url check error. Will be thrown until AAD redirects the user back to the app's root page with the token. No need to log or throw this error as it will create unnecessary traffic.
                }
            }, interval);

        }

        logout(): void {
            this.clearCache();
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

        private clearCache(): void {
            this._cacheStorage.saveItem(Constants.sessionState, '');
            this._cacheStorage.saveItem(Constants.stateLogin, '');
            this._renewStates = [];
            this._cacheStorage.saveItem(Constants.idTokenKey, '');
            this._cacheStorage.saveItem(Constants.clientInfo, '');
            this._cacheStorage.saveItem(Constants.error, '');
            this._cacheStorage.saveItem(Constants.errorDescription, '');
            var keys = this._cacheStorage.getItem(Constants.tokenKeys);
            if (!Utils.isEmpty(keys)) {
                let keysArray: Array<string> = keys.split(Constants.resourceDelimeter);
                for (var i = 0; i < keysArray.length - 1; i++) {
                    this._cacheStorage.saveItem(Constants.accessTokenKey + keysArray[i], '');
                    this._cacheStorage.saveItem(Constants.expirationKey + keysArray[i], '0');
                }
            }
            this._cacheStorage.saveItem(Constants.tokenKeys, '');
            let accessTokenItems: Array<AccessTokenCacheItem> = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.authority);
            for (let i = 0; i < accessTokenItems.length; i++) {
                this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
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
                this._requestContext.logger.error('error opening popup ' + e.message);
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
                if (scopes.length > 1)
                    throw new Error('Client Id can only be provided as a single scope');
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
                            self._requestContext.logger.warning(error);
                        }
                    }
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        }

        private getCachedToken(scopes: Array<string>, user?: User): string {
            let userObject = user ? user : this.user;
            let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user.identityProvider);
            let accessTokenItems: Array<AccessTokenCacheItem> = []; // Array to store multiple accessTokens for the same set of scopes
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                let accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.userIdentifier === userObject.userIdentifier) {
                    let cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                    if (Utils.containsScope(cachedScopes, scopes))
                        accessTokenItems.push(accessTokenCacheItem);
                }
            }
            if (accessTokenItems.length === 0 || accessTokenCacheItems.length > 1)
                return null; //access token not found
            else {
                let accessTokenCacheItem = accessTokenItems[0];
                var expired: number = Number(accessTokenCacheItem.value.expiresIn);
                // If expiration is within offset, it will force renew
                var offset = this._clockSkew || 300;
                if (expired && (expired > Utils.now() + offset))
                    return accessTokenCacheItem.value.accessToken;
                else {
                    this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[0].key));
                    return null;
                }
            }
        }

        getAllUsers(): Array<User> {
            let users: Array<User> = [];
            let accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.authority);
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                let idToken: IdToken = new IdToken(accessTokenCacheItems[i].value.idToken);
                let clientInfo: ClientInfo = new ClientInfo(accessTokenCacheItems[i].value.clientInfo);
                let user: User = User.createUser(idToken, clientInfo);
                users.push(user);
            }
            return users;
        }

        private addHintParameters(urlNavigate: string, user: User): string {
            let userObject: User = user ? user : this.user;
            if (!Utils.isEmpty(userObject.displayableId)) {
                urlNavigate += '&login_hint=' + encodeURIComponent(user.displayableId);
            }
            if (!this.urlContainsQueryStringParameter('domain_req', urlNavigate) && !Utils.isEmpty(userObject.utid)) {
                urlNavigate += '&domain_req=' + encodeURIComponent(userObject.utid);
            }
            if (!this.urlContainsQueryStringParameter('login_req', urlNavigate) && !Utils.isEmpty(userObject.uid)) {
                urlNavigate += '&login_req=' + encodeURIComponent(user.uid);
            }
            if (!this.urlContainsQueryStringParameter('domain_hint', urlNavigate) && !Utils.isEmpty(userObject.utid)) {
                if (user.utid === '9188040d-6c67-4c5b-b112-36a304b66dad') {
                    urlNavigate += '&domain_hint=' + encodeURIComponent("consumers");
                }
                else {
                    urlNavigate += '&domain_hint=' + encodeURIComponent("organizations");
                }
            }

            return urlNavigate;
        }

        private urlContainsQueryStringParameter(name: string, url: string): boolean {
            // regex to detect pattern of a ? or & followed by the name parameter and an equals character
            var regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }

        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void): void;
        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void, user: User): void;
        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void, user: User, extraQueryParameters: Array<string>): void;

        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void, user?: User, extraQueryParameters?: Array<string>): void {
            let userObject = user ? user : this.user;
            if (this._acquireTokenInProgress) {
                return;
            }

            this.validateInputScope(scopes);
            let scope: string = scopes.join(' ');
            if (!userObject) {
                callback('user login is required', null, null);
                return;
            }
            this._acquireTokenInProgress = true;
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            if (extraQueryParameters)
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            let urlNavigate: string = authenticationRequest.CreateNavigateUrl(scopes);
            urlNavigate = this.addHintParameters(urlNavigate, userObject);
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

        acquireTokenSilent(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void, user?: User): void {
            this.validateInputScope(scopes);
            let userObject = user ? user : this.user;
            var token = this.getCachedToken(scopes, userObject);
            let scope: string = scopes.join(' ');
            if (token) {
                this._requestContext.logger.info('Token is already in cache for scope:' + scope);
                callback(null, token, null);
                return;
            }

            if (!userObject) {
                callback('user login is required', null, null);
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
                    this._requestContext.logger.verbose('renewing idToken');
                    this.renewIdToken(scopes, callback, userObject);
                } else {
                    this._requestContext.logger.verbose('renewing accesstoken');
                    this.renewToken(scopes, callback, userObject);
                }

            }

        }

        private loadFrameTimeout(urlNavigate: string, frameName: string, scope: string): void {
            //set iframe session to pending
            this._requestContext.logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            var self = this;
            setTimeout(function () {
                if (self._cacheStorage.getItem(Constants.renewStatus + scope) === Constants.tokenRenewStatusInProgress) {
                    // fail the iframe session if it's in pending state
                    self._requestContext.logger.verbose('Loading frame has timed out after: ' + (Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    var expectedState = self._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState])
                        window.callBackMappedToRenewStates[expectedState]('Token renewal operation failed due to timeout', null);
                    self._cacheStorage.saveItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCancelled);
                }
            }, Constants.loadFrameTimeout);
        }

        private loadFrame(urlNavigate: string, frameName: string): void {
            // This trick overcomes iframe navigation in IE
            // IE does not load the page consistently in iframe
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

        private addAdalFrame(iframeId: string): HTMLIFrameElement {
            if (typeof iframeId === 'undefined') {
                return;
            }

            this._requestContext.logger.info('Add msal frame to document:' + iframeId);
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

        private renewToken(scopes: Array<string>, callback: Function, user: User): void {
            var scope = scopes.join(' ');
            this._requestContext.logger.verbose('renewToken is called for scope:' + scope);
            var frameHandle = this.addAdalFrame('adalRenewFrame' + scope);
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + scope;
            // renew happens in iframe, so it keeps javascript context
            this._renewStates.push(authenticationRequest.state);
            this._requestContext.logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            let urlNavigate: string = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this.registerCallback(authenticationRequest.state, scope, callback);
            this._requestContext.logger.verbose('Navigate to:' + urlNavigate);
            frameHandle.src = 'about:blank';
            this.loadFrameTimeout(urlNavigate, 'adalRenewFrame' + scope, scope);
        }

        private renewIdToken(scopes: Array<string>, callback: Function, user: User): void {
            this._requestContext.logger.info('renewidToken is called');
            let frameHandle = this.addAdalFrame('adalIdTokenFrame');
            let authenticationRequest: AuthenticationRequestParameters = new AuthenticationRequestParameters(this.authority, this.clientId, scopes, ResponseTypes[ResponseTypes.id_token], this.redirectUri);
            authenticationRequest.state = authenticationRequest.state + '|' + this.clientId;
            this._cacheStorage.saveItem(Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.CreateNavigateUrl(scopes) + '&prompt=none';
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, callback);
            this._requestContext.logger.verbose('Navigate to:' + urlNavigate);
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
            var rawIdToken = this._cacheStorage.getItem(Constants.idTokenKey);
            var rawClientInfo = this._cacheStorage.getItem(Constants.clientInfo);
            if (!Utils.isEmpty(rawIdToken)) {
                let idToken: IdToken = new IdToken(rawIdToken);
                let clientInfo: ClientInfo = new ClientInfo(rawClientInfo);
                this.user = User.createUser(idToken, clientInfo);
                return this.user;
            }

            return null;
        };

        handleAuthenticationResponse(hash: string): void {
            if (hash == null) {
                hash = window.location.hash;
            }
            if (this.isCallback(hash)) {
                let requestInfo: RequestInfo = this.getRequestInfo(hash);
                this._requestContext.logger.info('Returned from redirect url');
                this.saveTokenFromHash(requestInfo);
                let token: string = null, callback: Function = null;
                if ((requestInfo.requestType === Constants.renewToken) && window.parent) {
                    if (window.parent !== window)
                        this._requestContext.logger.verbose('Window is in iframe, acquiring token silently');
                    else
                        this._requestContext.logger.verbose('acquiring token interactive in progress');
                    if (window.parent.callBackMappedToRenewStates[requestInfo.stateResponse])
                        callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
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
                } catch (err) {
                    this._requestContext.logger.error('Error occurred in user defined callback function: ' + err)
                }

                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = '';
                    if (this.navigateToLoginRequestUrl && window.location.href.replace('#', '') !== this._cacheStorage.getItem(Constants.loginRequest))
                        window.location.href = this._cacheStorage.getItem(Constants.loginRequest);
                }

            }

        }

        private saveAccessToken(requestInfo: RequestInfo, user: User, clientInfo: string): void {
            let userObject = user ? user : this.user;
            if (requestInfo.parameters.hasOwnProperty('scope')) {
                let scopes = requestInfo.parameters['scope'];
                let consentedScopes = scopes.split(' ');
                let accessTokenCacheItems: Array<AccessTokenCacheItem> = this._cacheStorage.getAllAccessTokens(this.clientId, user.identityProvider);
                for (let i = 0; i < accessTokenCacheItems.length; i++) {
                    let accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
                        var cachedScopes = accessTokenCacheItem.key.Scopes.split(' ');
                        if (Utils.isIntersectingScopes(cachedScopes, consentedScopes))
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }

                }
                let accessTokenKey = new AccessTokenKey(user.identityProvider, this.clientId, scopes, user.uid, user.utid);
                let accessTokenValue = new AccessTokenValue(requestInfo.parameters[Constants.idToken], requestInfo.parameters[Constants.accessToken], Utils.expiresIn(requestInfo.parameters[Constants.expiresIn]).toString(), clientInfo);
                this._cacheStorage.saveItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }

        }

        private saveTokenFromHash(requestInfo: RequestInfo): void {
            this._requestContext.logger.info('State status:' + requestInfo.stateMatch + '; Request type:' + requestInfo.requestType);
            this._cacheStorage.saveItem(Constants.error, '');
            this._cacheStorage.saveItem(Constants.errorDescription, '');
            var scope = this.getScopeFromState(requestInfo.stateResponse);
            // Record error
            if (requestInfo.parameters.hasOwnProperty(Constants.errorDescription)) {
                this._requestContext.logger.info('Error :' + requestInfo.parameters[Constants.error] + '; Error description:' + requestInfo.parameters[Constants.errorDescription]);
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
                    this._requestContext.logger.info('State is right');
                    if (requestInfo.parameters.hasOwnProperty(Constants.sessionState))
                        this._cacheStorage.saveItem(Constants.sessionState, requestInfo.parameters[Constants.sessionState]);
                    var keys: string;
                    if (requestInfo.parameters.hasOwnProperty(Constants.accessToken) && requestInfo.parameters.hasOwnProperty(Constants.idToken) && requestInfo.requestType === Constants.renewToken) {
                        this._requestContext.logger.info('Fragment has access token and idtoken');
                        this._acquireTokenInProgress = false;
                        var idToken: IdToken = new IdToken(requestInfo.parameters[Constants.idToken]);
                        var clientInfo: string;
                        let user: User
                        if (requestInfo.parameters.hasOwnProperty(Constants.clientInfo)) {
                            clientInfo = requestInfo.parameters[Constants.clientInfo];
                            user = User.createUser(idToken, new ClientInfo(clientInfo));
                            this.saveAccessToken(requestInfo, user, clientInfo);
                        }
                        else {
                            user = this.getUser();
                            clientInfo = '';
                            this.saveAccessToken(requestInfo, user, '');
                        }

                    }

                    if (requestInfo.parameters.hasOwnProperty(Constants.idToken) && requestInfo.requestType === Constants.login) {
                        this._requestContext.logger.info('Fragment has id token');
                        this._loginInProgress = false;
                        var idToken: IdToken = new IdToken(requestInfo.parameters[Constants.idToken]);
                        var clientInfo: string;
                        if (requestInfo.parameters.hasOwnProperty(Constants.clientInfo)) {
                            clientInfo = requestInfo.parameters[Constants.clientInfo];
                        }
                        else {
                            clientInfo = '';
                        }

                        this.user = User.createUser(idToken, new ClientInfo(clientInfo));
                        if (idToken && idToken.nonce) {
                            if (idToken.nonce !== this._cacheStorage.getItem(Constants.nonceIdToken)) {
                                this.user = null;
                                this._cacheStorage.saveItem(Constants.loginError, 'Nonce Mismatch.Expected: ' + this._cacheStorage.getItem(Constants.nonceIdToken) + ',' + 'Actual: ' + idToken.nonce);
                            } else {
                                this._cacheStorage.saveItem(Constants.idTokenKey, requestInfo.parameters[Constants.idToken]);
                                this._cacheStorage.saveItem(Constants.clientInfo, requestInfo.parameters[Constants.clientInfo]);
                                // Save idToken as access token for app itself
                                scope = this.clientId;
                                if (!this.hasScope(scope)) {
                                    keys = this._cacheStorage.getItem(Constants.tokenKeys) || '';
                                    this._cacheStorage.saveItem(Constants.tokenKeys, keys + scope + Constants.resourceDelimeter);
                                }
                                this._cacheStorage.saveItem(Constants.accessTokenKey + scope, requestInfo.parameters[Constants.idToken]);
                                this._cacheStorage.saveItem(Constants.expirationKey + scope, idToken.expiration);
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
                    if (parameters.hasOwnProperty('state'))
                        stateResponse = parameters.state;
                    else
                        return requestInfo;
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

    }

}