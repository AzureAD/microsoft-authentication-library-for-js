"use strict";

namespace Msal {

    /**
    * @hidden
    */
    let ResponseTypes = {
        id_token: "id_token",
        token: "token",
        id_token_token: "id_token token"
    };

    /**
    * @hidden
    */
    interface cacheResult {
        errorDesc: string;
        token: string;
        error: string;
    }

    export class UserAgentApplication {

        /**
        * @hidden
        */
        private _cacheLocations = {
            localStorage: "localStorage",
            sessionStorage: "sessionStorage"
        };

        /**
        * @hidden
        */
        private _cacheLocation = "sessionStorage";

        get cacheLocation(): string {
            return this._cacheLocation;
        }

        set cacheLocation(cache: string) {
            this._cacheLocation = cache;
            if (this._cacheLocations[cache]) {
                this._cacheStorage = new Storage(this._cacheLocations[cache]);
            } else {
                throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
            }
        }

        /**
        * @hidden
        */
        private _interactionModes = {
            popUp: "popUp",
            redirect: "redirect"
        };

        /**
        * @hidden
        */
        private _interactionMode = "redirect";

        get interactionMode(): string {
            return this._interactionMode;
        }

        set interactionMode(mode: string) {
            if (this._interactionModes[mode]) {
                this._interactionMode = this._interactionModes[mode];
            } else {
                throw new Error('Interantion mode is not valid. Provided value:' + this._interactionMode + '.Possible values are: ' + this._interactionModes.redirect + ',' + this._interactionModes.popUp);
            }
        }

        /**
        * @hidden
        */
        private _requestContext: RequestContext;

        /**
        * @hidden
        */
        private _loginInProgress: boolean;

        /**
        * @hidden
        */
        private _acquireTokenInProgress: boolean;

        /**
        * @hidden
        */
        private _renewStates: Array<string>;

        /**
        * @hidden
        */
        private _activeRenewals: Object;

        /***
        * @hidden
        */
        private _clockSkew = 300;

        /**
        * @hidden
        */
        private _cacheStorage: Storage;

        /**
        * @hidden
        */
        private _tokenReceivedCallback: (errorDesc: string, token: string, error: string, tokenType: string) => void = null;

        /**
        * @hidden
        */
        private _user: User;

        /**
        * Client ID assigned to your app by Azure Active Directory.
        */
        clientId: string;

        /***
        * @hidden
        */
        private authorityInstance: Authority;

        public set authority(val) {
            this.authorityInstance = Authority.CreateInstance(val, this.validateAuthority);
        }

        public get authority(): string {
            return this.authorityInstance.CanonicalAuthority;
        }

        /**
        * Flag to turn authority validation on/off.
        */
        validateAuthority: boolean;

        /**
        * Endpoint at which you expect to receive tokens. Defaults to `window.location.href`. Should match the value in the application registration portal.
        */
        redirectUri: string;

        /**
        * Redirects the user to postLogoutRedirectUri after logout. Defaults to `window.location.href`.
        */
        postLogoutredirectUri: string;

        /**
        * If true, redirects the user back to the redirectUri after login.
        */
        navigateToLoginRequestUrl = true;

         /**
        * @callback tokenReceivedCallback This callback will be called when you call loginRedirect or acquireTokenRedirect api's with either an id_token or an access_token.
        * @param {string} error_description error description returned from AAD if token request fails.
        * @param {string} token token returned from AAD if token request is successful.
        * @param {string} error error message returned from AAD if token request fails.
        * @param {string} tokenType tokenType returned from AAD. Is either id_token or access_token.
        */

        /**
        * Represents a userAgentApplication.
        * @constructor
        * @param {string} clientId - Client ID assigned to your app by Azure Active Directory.
        * @param {string} [authority] - "https://login.microsoftonline.com/common".
        * @param {tokenReceivedCallback} callback -  The callback provided by the caller. It will be called with token or error and tokenType.
        * @param {boolean} validateAuthority -  Turns authority validation on/off.
        */
        constructor(clientId: string, authority: string, tokenReceivedCallback: (errorDesc: string, token: string, error: string, tokenType: string) => void, validateAuthority?: boolean) {
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
            this._cacheStorage = new Storage(this._cacheLocation); //cache keys msal
            this._requestContext = new RequestContext("");
            window.msal = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
        }

        /**
        * Initiates the login process by redirecting the user to Azure AD authorization endpoint.
        * @param {Array.<string>} scopes - The scopes for which consent is requested.
        * @param {string} extraQueryParameters - extraQueryParameters to add to the authentication request.
        */
        loginRedirect(scopes?: Array<string>, extraQueryParameters?: string): void {
            /*
            1. Create navigate url
            2. saves value in cache
            3. redirect user to AAD
            */
            if (this._loginInProgress) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback("Login is in progress", null, null, Constants.idToken);
                    return;
                }
            }

            if (scopes) {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Utils.isEmpty(isValidScope)) {
                    if (this._tokenReceivedCallback) {
                        this._tokenReceivedCallback(isValidScope, null, null, Constants.idToken);
                        return;
                    }
                }
            }

            this.authorityInstance.ResolveEndpointsAsync()
                .then(() => {
                    const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.redirectUri);
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }

                    authenticationRequest.state = authenticationRequest.state + "|" + this.clientId;
                    this._cacheStorage.setItem(Constants.loginRequest, window.location.href);
                    this._cacheStorage.setItem(Constants.loginError, "");
                    this._cacheStorage.setItem(Constants.stateLogin, authenticationRequest.state);
                    this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
                    this._cacheStorage.setItem(Constants.error, "");
                    this._cacheStorage.setItem(Constants.errorDescription, "");
                    const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
                    if (Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                        this._cacheStorage.setItem(authorityKey, this.authority);
                    }

                    const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                    this._loginInProgress = true;
                    this.promptUser(urlNavigate);
                });
        }

        /**
        * Initiates the login process by opening a popUp window.
        * @param {Array.<string>} scopes - The scopes for which consent is requested.
        * @param {string} extraQueryParameters - extraQueryParameters to add to the authentication request.
        * @returns {Promise.<string>} Returns the token or error
        */
        loginPopup(scopes: Array<string>, extraQueryParameters?: string): Promise<string> {
            /*
            1. Create navigate url
            2. saves value in cache
            3. redirect user to AAD
            */
            return new Promise<string>((resolve, reject) => {
                if (this._loginInProgress) {
                    reject("Login is in progress");
                    return;
                }

                if (scopes) {
                    const isValidScope = this.validateInputScope(scopes);
                    if (isValidScope && !Utils.isEmpty(isValidScope)) {
                        reject(isValidScope);
                        return;
                    }
                }

                this.authorityInstance.ResolveEndpointsAsync().then(() => {
                    const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.redirectUri);
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }

                    authenticationRequest.state = authenticationRequest.state + "|" + this.clientId;
                    this._cacheStorage.setItem(Constants.loginRequest, window.location.href);
                    this._cacheStorage.setItem(Constants.loginError, "");
                    this._cacheStorage.setItem(Constants.stateLogin, authenticationRequest.state);
                    this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
                    this._cacheStorage.setItem(Constants.error, "");
                    this._cacheStorage.setItem(Constants.errorDescription, "");
                    const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
                    if (Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                        this._cacheStorage.setItem(authorityKey, this.authority);
                    }

                    const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                    this._loginInProgress = true;
                    this.openWindow(urlNavigate, "login", 20, this, resolve, reject);
                });
            });
        }

        /**
        * Redirects the browser to Azure AD authorization endpoint.
        * @param {string}   urlNavigate  Url of the authorization endpoint.
        * @hidden
        */
        private promptUser(urlNavigate: string) {
            if (urlNavigate && !Utils.isEmpty(urlNavigate)) {
                this._requestContext.logger.info('Navigate to:' + urlNavigate);
                window.location.replace(urlNavigate);
            } else {
                this._requestContext.logger.info('Navigate url is empty');
            }
        };

        /**
        * After authorization, the user will be sent to your specified redirect_uri with the user's bearer token
        * attached to the URI fragment as an id_token/access_token field. It closes popup window after redirection.
        * @hidden
        * @ignore
        */
        private openWindow(urlNavigate: string, title: string, interval: number, instance: this, resolve?: Function, reject?: Function): void {
            const popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
                this._requestContext.logger.info("Popup Window is null. This can happen if you are using IE");
                this._cacheStorage.setItem(Constants.error, "Error opening popup");
                this._cacheStorage.setItem(Constants.errorDescription,
                    "Popup Window is null. This can happen if you are using IE");
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
                } catch (e) {
                    //Cross Domain url check error. Will be thrown until AAD redirects the user back to the app's root page with the token. No need to log or throw this error as it will create unnecessary traffic.
                }
            },
                interval);
        }

        /**
        * Redirects user to logout endpoint.
        * After logout, it will redirect to postLogoutRedirectUri. The default value is window.location.href.
        */
        logout(): void {
            this.clearCache();
            this._user = null;
            let logout = "";
            if (this.postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this.postLogoutredirectUri);
            }

            const urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
            this.promptUser(urlNavigate);
        }

        /**
        * Clears cache items.
        * @hidden
        */
        private clearCache(): void {
            this._renewStates = [];
            const accessTokenItems = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.authority);
            for (let i = 0; i < accessTokenItems.length; i++) {
                this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
            }

            this._cacheStorage.removeAcquireTokenEntries(Constants.acquireTokenUser, Constants.renewStatus);
            this._cacheStorage.removeAcquireTokenEntries(Constants.authority + Constants.resourceDelimeter, Constants.renewStatus);
            this._cacheStorage.resetCacheItems();
        }

        /**
        * Configures popup window for login.
        * @ignore
        * @hidden
        */
        private openPopup(urlNavigate: string, title: string, popUpWidth: number, popUpHeight: number) {
            try {
                /**
                * adding winLeft and winTop to account for dual monitor
                * using screenLeft and screenTop for IE8 and earlier
                */
                const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
                const winTop = window.screenTop ? window.screenTop : window.screenY;
                /**
                * window.innerWidth displays browser window's height and width excluding toolbars
                * using document.documentElement.clientWidth for IE8 and earlier
                */
                const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
                const top = ((height / 2) - (popUpHeight / 2)) + winTop;

                const popupWindow = window.open(urlNavigate, title, 'width=' + popUpWidth + ', height=' + popUpHeight + ', top=' + top + ', left=' + left);
                if (popupWindow.focus) {
                    popupWindow.focus();
                }

                return popupWindow;
            } catch (e) {
                this._requestContext.logger.error('error opening popup ' + e.message);
                this._loginInProgress = false;
                this._acquireTokenInProgress = false;
                return null;
            }
        }

        /**
        * Validates the scopes passed by the user.
        * @param {Array<string>}   scopes User requested scopes.
        * @ignore
        * @hidden
        */
        private validateInputScope(scopes: Array<string>): string {
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

        /**
        * Adds the passed callback to the array of callbacks for the specified resource and puts the array on the window object.
        * @param {string}   scope User requested scopes.
        * @param {string}   expectedState A unique identifier (guid).
        * @param {Function} resolve - The resolve function of the promise object.
        * @param {Function} reject - The reject function of the promise object.
        * @ignore
        * @hidden
        */
        private registerCallback(expectedState: string, scope: string, resolve: Function, reject: Function): void {
            this._activeRenewals[scope] = expectedState;
            if (!window.callBacksMappedToRenewStates[expectedState]) {
                window.callBacksMappedToRenewStates[expectedState] = [];
            }
            window.callBacksMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });
            if (!window.callBackMappedToRenewStates[expectedState]) {
                window.callBackMappedToRenewStates[expectedState] =
                    (errorDesc: string, token: string, error: string, tokenType: string) => {
                        this._activeRenewals[scope] = null;
                        for (let i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                            try {
                                if (errorDesc || error) {
                                    window.callBacksMappedToRenewStates[expectedState][i].reject(errorDesc + ": " + error);;
                                }
                                else if (token) {
                                    window.callBacksMappedToRenewStates[expectedState][i].resolve(token);
                                }
                            } catch (e) {
                                this._requestContext.logger.warning(e);
                            }
                        }
                        window.callBacksMappedToRenewStates[expectedState] = null;
                        window.callBackMappedToRenewStates[expectedState] = null;
                    };
            }
        }

        /**
        * Gets token for the specified resource from the cache.
        * @param {AuthenticationRequestParameters}   authenticationRequest Request sent to AAD to obtain an id_token/access_token.
        * @param {User}  user User for which the scopes were requested.
        * @hidden
        */
        private getCachedToken(authenticationRequest: AuthenticationRequestParameters, user: User): cacheResult {
            let accessTokenCacheItem: AccessTokenCacheItem = null;
            const scopes = authenticationRequest.scopes;
            const tokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user.userIdentifier); //filter by clientId and user
            if (tokenCacheItems.length === 0) { // No match found after initial filtering
                return null;
            }

            const filteredItems: Array<AccessTokenCacheItem> = [];
            //if no authority passed
            if (!authenticationRequest.authority) {
                //filter by scope
                for (let i = 0; i < tokenCacheItems.length; i++) {
                    const cacheItem = tokenCacheItems[i];
                    const cachedScopes = cacheItem.key.scopes.split(" ");
                    if (Utils.containsScope(cachedScopes, scopes)) {
                        filteredItems.push(cacheItem);
                    }
                }

                //if only one cached token found
                if (filteredItems.length === 1) {
                    accessTokenCacheItem = filteredItems[0];

                    authenticationRequest.authorityInstance = Authority.CreateInstance(accessTokenCacheItem.key.authority, this.validateAuthority);
                }
                else if (filteredItems.length > 1) {
                    return {
                        errorDesc: "The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements like authority",
                        token: null,
                        error: "multiple_matching_tokens_detected"
                    };
                }
                else {
                    //no match found. check if there was a single authority used
                    const authorityList = this.getUniqueAuthority(tokenCacheItems, 'authority');
                    if (authorityList.length > 1) {
                        return {
                            errorDesc: "Multiple authorities found in the cache. Pass authority in the API overload.",
                            token: null,
                            error: "multiple_matching_tokens_detected"
                        };
                    }

                    authenticationRequest.authorityInstance = Authority.CreateInstance(authorityList[0], this.validateAuthority);
                }
            }
            else {
                //authority was passed in the API, filter by authority and scope
                for (let i = 0; i < tokenCacheItems.length; i++) {
                    const cacheItem = tokenCacheItems[i];
                    const cachedScopes = cacheItem.key.scopes.split(" ");
                    if (Utils.containsScope(cachedScopes, scopes) && cacheItem.key.authority === authenticationRequest.authority) {
                        filteredItems.push(cacheItem);
                    }
                }

                //no match
                if (filteredItems.length === 0) {
                    return null;
                }
                //only one cachedToken Found
                else if (filteredItems.length === 1) {
                    accessTokenCacheItem = filteredItems[0];
                }
                else {
                    //more than one match found.
                    return {
                        errorDesc: "The cache contains multiple tokens satisfying the requirements.Call AcquireToken again providing more requirements like authority",
                        token: null,
                        error: "multiple_matching_tokens_detected"
                    };
                }
            }

            if (accessTokenCacheItem != null) {
                const expired = Number(accessTokenCacheItem.value.expiresIn);
                // If expiration is within offset, it will force renew
                const offset = this._clockSkew || 300;
                if (expired && (expired > Utils.now() + offset)) {
                    return {
                        errorDesc: null,
                        token: accessTokenCacheItem.value.accessToken,
                        error: null
                    };
                } else {
                    this._cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
                    return null;
                }
            } else {
                return null;
            }
        }

        /**
        * Gets unique users based on userIdentifier saved in the cache for whom access token has been issued.
        * @param {Array<User>}  Users saved in the cache
        */
        getAllUsers(): Array<User> {
            const users: Array<User> = [];
            const accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.authority);
            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                const idToken = new IdToken(accessTokenCacheItems[i].value.idToken);
                const clientInfo = new ClientInfo(accessTokenCacheItems[i].value.clientInfo);
                const user = User.createUser(idToken, clientInfo, this.authority);
                users.push(user);
            }

            return this.getUniqueUsers(users);
        }

        /**
        * Filters users based on userIdentifier.
        * @param {Array<User>}  Users saved in the cache
        * @ignore
        * @hidden
        */
        private getUniqueUsers(users: Array<User>): Array<User> {
            if (!users || users.length <= 1) {
                return users;
            }

            const flags: Array<string> = [];
            const uniqueUsers: Array<User> = [];
            for (let index = 0; index < users.length; ++index) {
                if (users[index].userIdentifier && flags.indexOf(users[index].userIdentifier) === -1) {
                    flags.push(users[index].userIdentifier);
                    uniqueUsers.push(users[index]);
                }
            }

            return uniqueUsers;
        }

        /**
       * Gets cache items with a distinct authority value.
       * @param {Array<AccessTokenCacheItem>}  accessTokenCacheItems accessTokenCacheItems saved in the cache
       * @ignore
       * @hidden
       */
        private getUniqueAuthority(accessTokenCacheItems: Array<AccessTokenCacheItem>, property: string): Array<string> {
            const authorityList: Array<string> = [];
            const flags: Array<string> = [];
            accessTokenCacheItems.forEach(element => {
                if (element.key.hasOwnProperty(property) && (flags.indexOf(element.key[property]) === -1)) {
                    flags.push(element.key[property]);
                    authorityList.push(element.key[property]);
                }
            });
            return authorityList;
        }

        /**
        * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time.
        * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user.
        * domain_req utid received as part of the clientInfo.
        * login_req uid received as part of clientInfo.
        * @param {string}   urlNavigate Authentication request url.
        * @param {User}   user User for which the token is requested.
        * @ignore
        * @hidden
        */
        private addHintParameters(urlNavigate: string, user: User): string {
            const userObject = user ? user : this._user;
            const decodedClientInfo = userObject.userIdentifier.split('.');
            const uid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
            const utid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);
            if (userObject.displayableId && !Utils.isEmpty(userObject.displayableId)) {
                urlNavigate += '&login_hint=' + encodeURIComponent(user.displayableId);
            }

            if (!Utils.isEmpty(uid) && !Utils.isEmpty(utid)) {
                if (!this.urlContainsQueryStringParameter("domain_req", urlNavigate) && !Utils.isEmpty(utid)) {
                    urlNavigate += '&domain_req=' + encodeURIComponent(utid);
                }

                if (!this.urlContainsQueryStringParameter("login_req", urlNavigate) && !Utils.isEmpty(uid)) {
                    urlNavigate += '&login_req=' + encodeURIComponent(uid);
                }

                if (!this.urlContainsQueryStringParameter("domain_hint", urlNavigate) && !Utils.isEmpty(utid)) {
                    if (utid === "9188040d-6c67-4c5b-b112-36a304b66dad") {
                        urlNavigate += '&domain_hint=' + encodeURIComponent("consumers");
                    } else {
                        urlNavigate += '&domain_hint=' + encodeURIComponent("organizations");
                    }
                }
            }

            return urlNavigate;
        }

        /**
        * Checks if the authorization endpoint URL contains query string parameters
        * @ignore
        * @hidden
        */
        private urlContainsQueryStringParameter(name: string, url: string): boolean {
            // regex to detect pattern of a ? or & followed by the name parameter and an equals character
            const regex = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }

        /**
        * Sends interactive request to AAD to obtain an access_token by redirecting the user to the authorization endpoint. To renew idToken, clientId should be passed as the only scope in the scopes array.
        * @param {Array<string>} scopes   -  Scopes requested by the user. Scopes like 'openid' and 'profile' are sent with every request.
        * @param {string} [authority] - "https://login.microsoftonline.com/common".
        * @param {User} user -  The user for which the scopes are requested.The default user is the logged in user.
        * @param {string} extraQueryParameters -  ExtraQueryParameters to add to the authentication request.
        */
        acquireTokenRedirect(scopes: Array<string>): void;
        acquireTokenRedirect(scopes: Array<string>, authority: string): void;
        acquireTokenRedirect(scopes: Array<string>, authority: string, user: User): void;
        acquireTokenRedirect(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): void;
        acquireTokenRedirect(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): void {
            const isValidScope = this.validateInputScope(scopes);
            if (isValidScope && !Utils.isEmpty(isValidScope)) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback(isValidScope, null, null, Constants.accessToken);
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
                    this._tokenReceivedCallback("user login is required", null, null, Constants.accessToken);
                    return;
                }
            }

            this._acquireTokenInProgress = true;
            let authenticationRequest: AuthenticationRequestParameters;
            let acquireTokenAuthority = authority ? Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;

            acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
                if (Utils.compareObjects(userObject, this._user)) {
                    authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
                } else {
                    authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
                }

                this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
                authenticationRequest.state = authenticationRequest.state + "|" + scope;
                const acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userObject.userIdentifier + Constants.resourceDelimeter + authenticationRequest.state;
                if (Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                    this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                }

                const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
                if (Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                    this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);
                }

                if (extraQueryParameters) {
                    authenticationRequest.extraQueryParameters = extraQueryParameters;
                }

                let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account";
                urlNavigate = this.addHintParameters(urlNavigate, userObject);
                if (urlNavigate) {
                    this._cacheStorage.setItem(Constants.stateAcquireToken, authenticationRequest.state);
                    window.location.replace(urlNavigate);
                }
            });
        }

        /**
        * Sends interactive request to AAD to obtain an access_token using a popUpWindow. To renew idToken, clientId should be passed as the only scope in the scopes array.
        * @param {Array<string>} scopes   -  Scopes requested by the user. Scopes like 'openid' and 'profile' are sent with every request.
        * @param {string} [authority] - "https://login.microsoftonline.com/common".
        * @param {User} user -  The user for which the scopes are requested.The default user is the logged in user.
        * @param {string} extraQueryParameters -  ExtraQueryParameters to add to the authentication request.
        * @returns {Promise.<string>} Resolved with token or rejected with error.
        */
        acquireTokenPopup(scopes: Array<string>): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Utils.isEmpty(isValidScope)) {
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
                let authenticationRequest: AuthenticationRequestParameters;
                let acquireTokenAuthority = authority ? Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;

                acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
                    if (Utils.compareObjects(userObject, this._user)) {
                        authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
                    } else {
                        authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
                    }

                    this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
                    authenticationRequest.state = authenticationRequest.state + "|" + scope;
                    const acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userObject.userIdentifier + Constants.resourceDelimeter + authenticationRequest.state;
                    if (Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                        this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                    }

                    const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
                    if (Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
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

        /**
        * Gets token from the cache if it is not expired. Otherwise sends request to AAD to obtain an access_token using a hidden iframe. To renew idToken, clientId should be passed as the only scope in the scopes array.
        * @param {Array<string>} scopes   -  Scopes requested by the user.  Scopes like 'openid' and 'profile' are sent with every request.
        * @param {string} authority -  Authority
        * @param {User} user -  The user for which the scopes are requested.The default user is the logged in user.
        * @param {string} extraQueryParameters -  ExtraQueryParameters to add to the authentication request.
        * @returns {Promise.<string>} Resolved with token or rejected with error.
        */
        acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Utils.isEmpty(isValidScope)) {
                    reject(isValidScope);
                } else {
                    const scope = scopes.join(" ").toLowerCase();
                    const userObject = user ? user : this._user;
                    if (!userObject) {
                        reject("user login is required");
                        return;
                    }

                    let authenticationRequest: AuthenticationRequestParameters;
                    let newAuthority = authority ? Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
                    if (Utils.compareObjects(userObject, this._user)) {
                        authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.token, this.redirectUri);
                    } else {
                        authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.redirectUri);
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

                    // cache miss
                    return this.authorityInstance.ResolveEndpointsAsync()
                        .then(() => {
                            // refresh attept with iframe
                            //Already renewing for this scope, callback when we get the token.
                            if (this._activeRenewals[scope]) {
                                //Active renewals contains the state for each renewal.
                                this.registerCallback(this._activeRenewals[scope], scope, resolve, reject);
                            } else {
                                if (scopes && scopes.indexOf(this.clientId) > -1 && scopes.length === 1) {
                                    // App uses idToken to send to api endpoints
                                    // Default scope is tracked as clientId to store this token
                                    this._requestContext.logger.verbose("renewing idToken");
                                    this.renewIdToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
                                } else {
                                    this._requestContext.logger.verbose("renewing accesstoken");
                                    this.renewToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
                                }
                            }
                        });
                }
            });
        }

        /**
        * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left
        * registered when network errors occur and subsequent token requests for same resource are registered to the pending request.
        * @ignore
        * @hidden
        */
        private loadFrameTimeout(urlNavigate: string, frameName: string, scope: string): void {
            //set iframe session to pending
            this._requestContext.logger.verbose('Set loading state to pending for: ' + scope);
            this._cacheStorage.setItem(Constants.renewStatus + scope, Constants.tokenRenewStatusInProgress);
            this.loadFrame(urlNavigate, frameName);
            setTimeout(() => {
                if (this._cacheStorage.getItem(Constants.renewStatus + scope) === Constants.tokenRenewStatusInProgress) {
                    // fail the iframe session if it's in pending state
                    this._requestContext.logger.verbose('Loading frame has timed out after: ' + (Constants.loadFrameTimeout / 1000) + ' seconds for scope ' + scope);
                    const expectedState = this._activeRenewals[scope];
                    if (expectedState && window.callBackMappedToRenewStates[expectedState])
                        window.callBackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, null, Constants.accessToken);
                    this._cacheStorage.setItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCancelled);
                }
            }, Constants.loadFrameTimeout);
        }

        /**
        * Loads iframe with authorization endpoint URL
        * @ignore
        * @hidden
        */
        private loadFrame(urlNavigate: string, frameName: string): void {
            // This trick overcomes iframe navigation in IE
            // IE does not load the page consistently in iframe
            this._requestContext.logger.info('LoadFrame: ' + frameName);
            var frameCheck = frameName;
            setTimeout(() => {
                var frameHandle = this.addAdalFrame(frameCheck);
                if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                    frameHandle.src = urlNavigate;
                }
            },
                500);
        }

        /**
        * Adds the hidden iframe for silent token renewal.
        * @ignore
        * @hidden
        */
        private addAdalFrame(iframeId: string): HTMLIFrameElement {
            if (typeof iframeId === "undefined") {
                return null;
            }

            this._requestContext.logger.info('Add msal frame to document:' + iframeId);
            let adalFrame = document.getElementById(iframeId) as HTMLIFrameElement;
            if (!adalFrame) {
                if (document.createElement &&
                    document.documentElement &&
                    (window.navigator.userAgent.indexOf("MSIE 5.0") === -1)) {
                    const ifr = document.createElement("iframe");
                    ifr.setAttribute("id", iframeId);
                    ifr.style.visibility = "hidden";
                    ifr.style.position = "absolute";
                    ifr.style.width = ifr.style.height = "0";
                    adalFrame = (document.getElementsByTagName("body")[0].appendChild(ifr) as HTMLIFrameElement);
                } else if (document.body && document.body.insertAdjacentHTML) {
                    document.body.insertAdjacentHTML('beforeEnd', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
                }

                if (window.frames && window.frames[iframeId]) {
                    adalFrame = window.frames[iframeId];
                }
            }

            return adalFrame;
        }

        /**
        * Acquires access token using a hidden iframe.
        * @ignore
        * @hidden
        */
        private renewToken(scopes: Array<string>, resolve: Function, reject: Function, user: User, authenticationRequest: AuthenticationRequestParameters, extraQueryParameters?: string): void {
            const scope = scopes.join(" ").toLowerCase();
            this._requestContext.logger.verbose('renewToken is called for scope:' + scope);
            const frameHandle = this.addAdalFrame('msalRenewFrame' + scope);
            authenticationRequest.state = authenticationRequest.state + "|" + scope;
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }

            const acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + user.userIdentifier + Constants.resourceDelimeter + authenticationRequest.state;
            if (Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
            }

            const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
            if (Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
            }

            // renew happens in iframe, so it keeps javascript context
            this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew token Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=none";
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, scope, resolve, reject);
            this._requestContext.logger.infoPii('Navigate to:' + urlNavigate);
            frameHandle.src = "about:blank";
            this.loadFrameTimeout(urlNavigate, 'msalRenewFrame' + scope, scope);
        }

        /**
        * Renews idtoken for app's own backend when clientId is passed as a single scope in the scopes array.
        * @ignore
        * @hidden
        */
        private renewIdToken(scopes: Array<string>, resolve: Function, reject: Function, user: User, authenticationRequest: AuthenticationRequestParameters, extraQueryParameters?: string): void {
            const scope = scopes.join(" ").toLowerCase();
            this._requestContext.logger.info('renewidToken is called');
            const frameHandle = this.addAdalFrame("msalIdTokenFrame");
            authenticationRequest.state = authenticationRequest.state + "|" + this.clientId;
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }

            const acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + user.userIdentifier + Constants.resourceDelimeter + authenticationRequest.state;
            if (Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
            }

            const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
            if (Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
            }

            this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
            this._requestContext.logger.verbose('Renew Idtoken Expected state: ' + authenticationRequest.state);
            let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=none";
            urlNavigate = this.addHintParameters(urlNavigate, user);
            this._renewStates.push(authenticationRequest.state);
            this.registerCallback(authenticationRequest.state, this.clientId, resolve, reject);
            this._requestContext.logger.infoPii('Navigate to:' + urlNavigate);
            frameHandle.src = "about:blank";
            this.loadFrameTimeout(urlNavigate, "adalIdTokenFrame", this.clientId);
        }

        /**
         * Returns the signed in user if any, else returns null.
         */
        getUser(): User {
            // idToken is first call
            if (this._user) {
                return this._user;
            }

            // frame is used to get idToken
            const rawIdToken = this._cacheStorage.getItem(Constants.idTokenKey);
            const rawClientInfo = this._cacheStorage.getItem(Constants.clientInfo);
            if (!Utils.isEmpty(rawIdToken) && !Utils.isEmpty(rawClientInfo)) {
                const idToken = new IdToken(rawIdToken);
                const clientInfo = new ClientInfo(rawClientInfo);
                this._user = User.createUser(idToken, clientInfo, this.authority);
                return this._user;
            }

            return null;
        };

       /**
        * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error and saves it in the cache. It then
        * calls the registered callbacks in case of redirect or resolves the promises with the result.
        * @param {string} [hash=window.location.hash] - Hash fragment of Url.
        * @param {Function} resolve - The resolve function of the promise object.
        * @param {Function} reject - The reject function of the promise object.
        */
        handleAuthenticationResponse(hash: string, resolve?: Function, reject?: Function): void {
            if (hash == null) {
                hash = window.location.hash;
            }
            if (this.isCallback(hash)) {
                const requestInfo = this.getRequestInfo(hash);
                this._requestContext.logger.info("Returned from redirect url");
                this.saveTokenFromHash(requestInfo);
                let token: string = null, tokenReceivedCallback: (errorDesc: string, token: string, error: string, tokenType: string) => void = null, tokenType: string;
                if ((requestInfo.requestType === Constants.renewToken) && window.parent) {
                    if (window.parent !== window)
                        this._requestContext.logger.verbose("Window is in iframe, acquiring token silently");
                    else
                        this._requestContext.logger.verbose("acquiring token interactive in progress");

                    if (window.parent.callBackMappedToRenewStates[requestInfo.stateResponse])
                        tokenReceivedCallback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                    else
                        tokenReceivedCallback = this._tokenReceivedCallback;

                    token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
                    tokenType = Constants.accessToken;
                } else if (requestInfo.requestType === Constants.login) {
                    tokenReceivedCallback = this._tokenReceivedCallback;
                    token = requestInfo.parameters[Constants.idToken];
                    tokenType = Constants.idToken;
                }

                try {
                    var errorDesc = this._cacheStorage.getItem(Constants.errorDescription);
                    var error = this._cacheStorage.getItem(Constants.error);
                    if (error || errorDesc) {
                        if (reject) {
                            reject(errorDesc + ": " + error);
                        }
                    }
                    if (resolve) {
                        resolve(token);
                    }
                    else if (tokenReceivedCallback) {
                        tokenReceivedCallback(this._cacheStorage.getItem(Constants.errorDescription), token, this._cacheStorage.getItem(Constants.error), tokenType);
                    }
                } catch (err) {
                    this._requestContext.logger.error('Error occurred in token received callback function: ' + err);
                }

                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = "";
                    if (this.navigateToLoginRequestUrl && window.location.href.replace("#", "") !== this._cacheStorage.getItem(Constants.loginRequest))
                        window.location.href = this._cacheStorage.getItem(Constants.loginRequest);
                }
            }
        }

         /**
         * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
         * @param {string} authority authority received in the redirect response from AAD.
         * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
         * @param {User} user user object for which scopes are consented for. The default user is the logged in user.
         * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
         * @param {IdToken} idToken idToken received as part of the response.
         * @ignore
         * @private
         * @hidden
         */
        private saveAccessToken(authority: string, tokenResponse: TokenResponse, user: User, clientInfo: string, idToken: IdToken): void {
            let scope: string;
            let clientObj: ClientInfo = new ClientInfo(clientInfo);
            if (tokenResponse.parameters.hasOwnProperty("scope")) {
                scope = tokenResponse.parameters["scope"];
                const consentedScopes = scope.split(" ");
                const accessTokenCacheItems =
                    this._cacheStorage.getAllAccessTokens(this.clientId, authority);
                for (let i = 0; i < accessTokenCacheItems.length; i++) {
                    const accessTokenCacheItem = accessTokenCacheItems[i];
                    if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
                        const cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
                        if (Utils.isIntersectingScopes(cachedScopes, consentedScopes))
                            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
                const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
                const accessTokenValue = new AccessTokenValue(tokenResponse.parameters[Constants.accessToken], idToken.rawIdToken, Utils.expiresIn(tokenResponse.parameters[Constants.expiresIn]).toString(), clientInfo);
                this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            } else {
                scope = this.clientId;
                const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
                const accessTokenValue = new AccessTokenValue(tokenResponse.parameters[Constants.idToken], tokenResponse.parameters[Constants.idToken], idToken.expiration, clientInfo);
                this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            }
        }

        /**
        * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
        * @ignore
        * @hidden
        */
        private saveTokenFromHash(tokenResponse: TokenResponse): void {
            this._requestContext.logger.info('State status:' + tokenResponse.stateMatch + '; Request type:' + tokenResponse.requestType);
            this._cacheStorage.setItem(Constants.error, "");
            this._cacheStorage.setItem(Constants.errorDescription, "");
            var scope = this.getScopeFromState(tokenResponse.stateResponse);
            // Record error
            if (tokenResponse.parameters.hasOwnProperty(Constants.errorDescription)) {
                this._requestContext.logger.info('Error :' + tokenResponse.parameters[Constants.error] + '; Error description:' + tokenResponse.parameters[Constants.errorDescription]);
                this._cacheStorage.setItem(Constants.error, tokenResponse.parameters["error"]);
                this._cacheStorage.setItem(Constants.errorDescription,
                    tokenResponse.parameters[Constants.errorDescription]);
                if (tokenResponse.requestType === Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.setItem(Constants.loginError, tokenResponse.parameters["errorDescription"]);
                }

                if (tokenResponse.requestType === Constants.renewToken) {
                    this._acquireTokenInProgress = false;
                }
            } else {
                // It must verify the state from redirect
                if (tokenResponse.stateMatch) {
                    // record tokens to storage if exists
                    this._requestContext.logger.info("State is right");
                    if (tokenResponse.parameters.hasOwnProperty(Constants.sessionState))
                        this._cacheStorage.setItem(Constants.sessionState,
                            tokenResponse.parameters[Constants.sessionState]);
                    var idToken: IdToken;
                    var clientInfo: string = '';
                    if (tokenResponse.parameters.hasOwnProperty(Constants.accessToken)) {
                        this._requestContext.logger.info("Fragment has access token");
                        this._acquireTokenInProgress = false;
                        let user: User;
                        if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
                            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
                        } else {
                            idToken = new IdToken(this._cacheStorage.getItem(Constants.idTokenKey));
                        }

                        let authorityKey = Constants.authority + Constants.resourceDelimeter + tokenResponse.stateResponse;
                        let authority: string;
                        if (!Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                            authority = this._cacheStorage.getItem(authorityKey);
                            authority = Utils.replaceFirstPath(authority, idToken.tenantId);
                        }

                        if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
                            clientInfo = tokenResponse.parameters[Constants.clientInfo];
                            user = User.createUser(idToken, new ClientInfo(clientInfo), authority);
                        } else {
                            this._requestContext.logger.warning("ClientInfo not received in the response from AAD");
                            user = User.createUser(idToken, new ClientInfo(clientInfo), authority);
                        }

                        let acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + user.userIdentifier + Constants.resourceDelimeter + tokenResponse.stateResponse;
                        let acquireTokenUser: User;
                        if (!Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey))) {
                            acquireTokenUser = JSON.parse(this._cacheStorage.getItem(acquireTokenUserKey));
                            if (user && acquireTokenUser && Utils.compareObjects(user, acquireTokenUser)) {
                                this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
                                this._requestContext.logger.info(
                                    "The user object received in the response is the same as the one passed in the acquireToken request");
                            } else {
                                this._requestContext.logger.warning(
                                    "The user object created from the response is not the same as the one passed in the acquireToken request");
                            }
                        }
                    }

                    if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
                        if (scope.indexOf(this.clientId) > -1) {
                            this._requestContext.logger.info("Fragment has id token");
                            this._loginInProgress = false;
                            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
                            if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
                                clientInfo = tokenResponse.parameters[Constants.clientInfo];
                            } else {
                                this._requestContext.logger.warning("ClientInfo not received in the response from AAD");
                            }

                            let authorityKey = Constants.authority + Constants.resourceDelimeter + tokenResponse.stateResponse;
                            let authority: string;
                            if (!Utils.isEmpty(this._cacheStorage.getItem(authorityKey))) {
                                authority = this._cacheStorage.getItem(authorityKey);
                                authority = Utils.replaceFirstPath(authority, idToken.tenantId);
                            }

                            this._user = User.createUser(idToken, new ClientInfo(clientInfo), authority);
                            if (idToken && idToken.nonce) {
                                if (idToken.nonce !== this._cacheStorage.getItem(Constants.nonceIdToken)) {
                                    this._user = null;
                                    this._cacheStorage.setItem(Constants.loginError, 'Nonce Mismatch.Expected: ' + this._cacheStorage.getItem(Constants.nonceIdToken) + ',' + 'Actual: ' + idToken.nonce);
                                } else {
                                    this._cacheStorage.setItem(Constants.idTokenKey, tokenResponse.parameters[Constants.idToken]);
                                    this._cacheStorage.setItem(Constants.clientInfo, clientInfo);

                                    // Save idToken as access token for app itself
                                    this.saveAccessToken(authority, tokenResponse, this._user, clientInfo, idToken);
                                }
                            } else {
                                this._cacheStorage.setItem(Constants.error, 'invalid idToken');
                                this._cacheStorage.setItem(Constants.errorDescription, 'Invalid idToken. idToken: ' + tokenResponse.parameters[Constants.idToken]);
                            }
                        }
                    }
                } else {
                    this._cacheStorage.setItem(Constants.error, 'Invalid_state');
                    this._cacheStorage.setItem(Constants.errorDescription, 'Invalid_state. state: ' + tokenResponse.stateResponse);
                }
            }
            this._cacheStorage.setItem(Constants.renewStatus + scope, Constants.tokenRenewStatusCompleted);
            this._cacheStorage.removeAcquireTokenEntries(Constants.acquireTokenUser, Constants.renewStatus);
            this._cacheStorage.removeAcquireTokenEntries(Constants.authority + Constants.resourceDelimeter, Constants.renewStatus);
        };

        /**
        * Checks if the redirect response is received from AAD. In case of redirect, the url fragment has either id_token, access_token or error.
        * @param {string} hash  -  Hash passed from redirect page
        * @returns {Boolean} true if response contains id_token, access_token or error, false otherwise.
        */
        isCallback(hash: string): boolean {
            hash = this.getHash(hash);
            const parameters = Utils.deserialize(hash);
            return (
                parameters.hasOwnProperty(Constants.errorDescription) ||
                parameters.hasOwnProperty(Constants.accessToken) ||
                parameters.hasOwnProperty(Constants.idToken)
            );
        }

        /**
        * Returns the anchor part(#) of the URL
        * @ignore
        * @hidden
        */
        private getHash(hash: string): string {
            if (hash.indexOf("#/") > -1) {
                hash = hash.substring(hash.indexOf("#/") + 2);
            } else if (hash.indexOf("#") > -1) {
                hash = hash.substring(1);
            }

            return hash;
        };

        /**
         * Creates a requestInfo object from the URL fragment and returns it.
         * @param {string} hash  -  Hash passed from redirect page
         * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
         * @ignore
         * @hidden
         */
        private getRequestInfo(hash: string): TokenResponse {
            hash = this.getHash(hash);
            const parameters = Utils.deserialize(hash);
            const tokenResponse = new TokenResponse();
            if (parameters) {
                tokenResponse.parameters = parameters;
                if (parameters.hasOwnProperty(Constants.errorDescription) ||
                    parameters.hasOwnProperty(Constants.accessToken) ||
                    parameters.hasOwnProperty(Constants.idToken)) {
                    tokenResponse.valid = true;
                    // which call
                    let stateResponse: string;
                    if (parameters.hasOwnProperty("state"))
                        stateResponse = parameters.state;
                    else
                        return tokenResponse;
                    tokenResponse.stateResponse = stateResponse;
                    // async calls can fire iframe and login request at the same time if developer does not use the API as expected
                    // incoming callback needs to be looked up to find the request type
                    if (stateResponse === this._cacheStorage.getItem(Constants.stateLogin)) {
                        tokenResponse.requestType = Constants.login;
                        tokenResponse.stateMatch = true;
                        return tokenResponse;
                    } else if (stateResponse === this._cacheStorage.getItem(Constants.stateAcquireToken)) {
                        tokenResponse.requestType = Constants.renewToken;
                        tokenResponse.stateMatch = true;
                        return tokenResponse;
                    }

                    // external api requests may have many renewtoken requests for different resource
                    if (!tokenResponse.stateMatch && window.parent && window.parent.msal) {
                        const clientApplication = window.parent.msal as UserAgentApplication;
                        const statesInParentContext = clientApplication._renewStates;
                        for (let i = 0; i < statesInParentContext.length; i++) {
                            if (statesInParentContext[i] === tokenResponse.stateResponse) {
                                tokenResponse.requestType = Constants.renewToken;
                                tokenResponse.stateMatch = true;
                                break;
                            }
                        }
                    }
                }
            }
            return tokenResponse;
        };

        /**
         * Extracts scope value from the state sent with the authentication request.
         * @returns {string} scope.
         * @ignore
         * @hidden
         */
        private getScopeFromState(state: string): string {
            if (state) {
                const splitIndex = state.indexOf("|");
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return "";
        };
    }
}