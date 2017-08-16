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

    /**
    * A type alias of for a tokenReceivedCallback function.
    * @param tokenReceivedCallback.errorDesc error description returned from the STS if API call fails.
    * @param tokenReceivedCallback.token token returned from STS if token request is successful.
    * @param tokenReceivedCallback.error error code returned from the STS if API call fails.
    * @param tokenReceivedCallback.tokenType tokenType returned from the STS if API call is successful. Possible values are: id_token OR access_token.
    */
    export type tokenReceivedCallback = (errorDesc: string, token: string, error: string, tokenType: string) => void;
    const resolveTokenOnlyIfOutOfIframe = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const tokenAcquisitionMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            return this.isInIframe()
                ? new Promise(() => {})
                : tokenAcquisitionMethod.apply(this, args);
        }
        return descriptor
    };
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
        private _cacheLocation: string;

        /**
        * Used to get the cache location
        */
        get cacheLocation(): string {
            return this._cacheLocation;
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
        private _tokenReceivedCallback: tokenReceivedCallback = null;

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

        /**
        * Used to set the authority.
        * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
        * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
        * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
        * - Default value is: "https://login.microsoftonline.com/common"
        */
        public set authority(val) {
            this.authorityInstance = Authority.CreateInstance(val, this.validateAuthority);
        }

        /**
        * Used to get the authority.
        */
        public get authority(): string {
            return this.authorityInstance.CanonicalAuthority;
        }

        /**
        * Used to turn authority validation on/off.
        * When set to true (default), MSAL will compare the application's authority against well-known URLs templates representing well-formed authorities. It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
        */
        validateAuthority: boolean;

        /**
        * The redirect URI of the application, this should be same as the value in the application registration portal.
        * Defaults to `window.location.href`.
        */
        private _redirectUri: string;

        /**
        * Used to redirect the user to this location after logout.
        * Defaults to `window.location.href`.
        */
        private _postLogoutredirectUri: string;

        /**
        * Used to redirect the user back to the redirectUri after login.
        * True = redirects user to redirectUri
        */
        private _navigateToLoginRequestUrl: boolean = true;

        /**
        * Initialize a UserAgentApplication with a given clientId and authority.
        * @constructor
        * @param {string} clientId - The clientID of your application, you should get this from the application registration portal.
        * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
        * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;,\ where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
        * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
        * - Default value is: "https://login.microsoftonline.com/common"
        * @param _tokenReceivedCallback -  The function that will get the call back once this API is completed (either successfully or with a failure).
        * @param {boolean} validateAuthority -  boolean to turn authority validation on/off.
        */
        constructor(clientId: string, authority: string, tokenReceivedCallback: tokenReceivedCallback,
            {
                validateAuthority = true,
                cacheLocation = 'sessionStorage',
                redirectUri = window.location.href.split("?")[0].split("#")[0],
                postLogoutRedirectUri = redirectUri,
                navigateToLoginRequestUrl = true
            }:
                {
                    validateAuthority?: boolean,
                    cacheLocation?: string,
                    redirectUri?: string,
                    postLogoutRedirectUri?: string,
                    navigateToLoginRequestUrl?: boolean,
                } = {}) {

            this.clientId = clientId;
            this.validateAuthority = validateAuthority;
            this.authority = authority || "https://login.microsoftonline.com/common";
            this._tokenReceivedCallback = tokenReceivedCallback;
            this._redirectUri = redirectUri;
            this._postLogoutredirectUri = postLogoutRedirectUri;
            this._navigateToLoginRequestUrl = navigateToLoginRequestUrl;
            this._loginInProgress = false;
            this._acquireTokenInProgress = false;
            this._renewStates = [];
            this._activeRenewals = {};
            this._cacheLocation = cacheLocation;
            if (!this._cacheLocations[cacheLocation]) {
                throw new Error('Cache Location is not valid. Provided value:' + this._cacheLocation + '.Possible values are: ' + this._cacheLocations.localStorage + ', ' + this._cacheLocations.sessionStorage);
            }

            this._cacheStorage = new Storage(this._cacheLocation); //cache keys msal
            this._requestContext = new RequestContext("");
            window.msal = this;
            window.callBackMappedToRenewStates = {};
            window.callBacksMappedToRenewStates = {};
            if (!window.opener) {
                var isCallback = this.isCallback(window.location.hash);
                if (isCallback) {
                    var self = this;
                    setTimeout(function () { self.handleAuthenticationResponse(window.location.hash); }, 0);
                }
            }

        }

        /**
        * Initiate the login process by redirecting the user to the STS authorization endpoint.
        * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
        * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
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
                scopes = this.filterScopes(scopes);
            }

            this.authorityInstance.ResolveEndpointsAsync()
                .then(() => {
                    const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this._redirectUri);
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }

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

                    const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                    this._loginInProgress = true;
                    this.promptUser(urlNavigate);
                });
        }

        /**
        * Initiate the login process by opening a popup window.
        * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token returned.
        * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the interactive authentication flow.
        * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
        */
        loginPopup(scopes: Array<string>, extraQueryParameters?: string): Promise<string> {
            /*
            1. Create navigate url
            2. saves value in cache
            3. redirect user to AAD
            */
            return new Promise<string>((resolve, reject) => {
                this._interactionMode = this._interactionModes.popUp;
                if (this._loginInProgress) {
                    reject(Msal.ErrorCodes.loginProgressError + ':' + Msal.ErrorDescription.loginProgressError);
                    return;
                }

                if (scopes) {
                    const isValidScope = this.validateInputScope(scopes);
                    if (isValidScope && !Utils.isEmpty(isValidScope)) {
                        reject(Msal.ErrorCodes.inputScopesError + ':' + Msal.ErrorDescription.inputScopesError);
                        return;
                    }

                    scopes = this.filterScopes(scopes);
                }

                var popUpWindow = this.openWindow('about:blank', '_blank', 1, this, resolve, reject);
                if (!popUpWindow) {
                    return;
                }

                this.authorityInstance.ResolveEndpointsAsync().then(() => {
                    const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this._redirectUri);
                    if (extraQueryParameters) {
                        authenticationRequest.extraQueryParameters = extraQueryParameters;
                    }

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

                    const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                    this._loginInProgress = true;
                    if (popUpWindow) {
                        popUpWindow.location.href = urlNavigate;
                    }

                }, () => {
                    this._requestContext.logger.info(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    this._cacheStorage.setItem(Constants.error, Msal.ErrorCodes.endpointResolutionError);
                    this._cacheStorage.setItem(Constants.errorDescription, Msal.ErrorDescription.endpointResolutionError);
                    if (reject) {
                        reject(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    }

                    if (popUpWindow) {
                        popUpWindow.close();
                    }
                });
            });
        }

        /**
         * Used to redirect the browser to the STS authorization endpoint
         * @param {string} urlNavigate - URL of the authorization endpoint
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
        * Used to send the user to the redirect_uri after authentication is complete. The user's bearer token is attached to the URI fragment as an id_token/access_token field.
        * This function also closes the popup window after redirection.
        * @hidden
        * @ignore
        */
        private openWindow(urlNavigate: string, title: string, interval: number, instance: this, resolve?: Function, reject?: Function): Window {
            var popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);
            if (popupWindow == null) {
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
                this._requestContext.logger.info(Msal.ErrorCodes.popUpWindowError + ':' + Msal.ErrorDescription.popUpWindowError);
                this._cacheStorage.setItem(Constants.error, Msal.ErrorCodes.popUpWindowError);
                this._cacheStorage.setItem(Constants.errorDescription, Msal.ErrorDescription.popUpWindowError);
                if (reject) {
                    reject(Msal.ErrorCodes.popUpWindowError + ':' + Msal.ErrorDescription.popUpWindowError);
                }
                return null;
            }

            var pollTimer = window.setInterval(() => {
                if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
                    instance._loginInProgress = false;
                    instance._acquireTokenInProgress = false;
                    window.clearInterval(pollTimer);
                }

                try {
                    if (popupWindow.location.href.indexOf(this._redirectUri) !== -1) {
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

            return popupWindow;
        }

        /**
        * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
        * Defaults behaviour is to redirect the user to `window.location.href`.
        */
        logout(): void {
            this.clearCache();
            this._user = null;
            let logout = "";
            if (this._postLogoutredirectUri) {
                logout = 'post_logout_redirect_uri=' + encodeURIComponent(this._postLogoutredirectUri);
            }

            const urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
            this.promptUser(urlNavigate);
        }

        /**
        * Used to configure the popup window for login.
        * @ignore
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
        * Used to validate the scopes input parameter requested  by the developer.
        * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
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
         * Used to remove openid and profile from the list of scopes passed by the developer.These scopes are added by default
         * @hidden
         */
        private filterScopes(scopes: Array<string>): Array<string> {
            scopes = scopes.filter(function (element) {
                return element !== "openid";
            });

            scopes = scopes.filter(function (element) {
                return element !== "profile";
            });

            return scopes;
        }
        /**
        * Used to add the developer requested callback to the array of callbacks for the specified scopes. The updated array is stored on the window object
        * @param {string} scope - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
        * @param {string} expectedState - Unique state identifier (guid).
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
        * Used to get token for the specified set of scopes from the cache
        * @param {AuthenticationRequestParameters} authenticationRequest - Request sent to the STS to obtain an id_token/access_token
        * @param {User} user - User for which the scopes were requested
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
        * Used to filter all cached items and return a list of unique users based on userIdentifier.
        * @param {Array<User>} Users - users saved in the cache.
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
        * Used to filter users based on userIdentifier
        * @param {Array<User>}  Users - users saved in the cache
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
       * Used to get a unique list of authoritues from the cache 
       * @param {Array<AccessTokenCacheItem>}  accessTokenCacheItems - accessTokenCacheItems saved in the cache
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
        * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
        * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user
        * domain_req utid received as part of the clientInfo
        * login_req uid received as part of clientInfo
        * @param {string} urlNavigate - Authentication request url
        * @param {User} user - User for which the token is requested
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
        * Used to obtain an access_token by redirecting the user to the authorization endpoint.
        * To renew idToken, clientId should be passed as the only scope in the scopes array.
        * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like 'openid' and 'profile' are sent with every request.
        * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
        * - In Azure AD, it is of the form https://{instance}/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
        * - In Azure B2C, it is of the form https://{instance}/tfp/&lt;tenant&gt;/<policyName>
        * - Default value is: "https://login.microsoftonline.com/common"
        * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
        * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
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

            if (scopes) {
                scopes = this.filterScopes(scopes);
            }

            const userObject = user ? user : this._user;
            if (this._acquireTokenInProgress) {
                return;
            }

            const scope = scopes.join(" ").toLowerCase();
            if (!userObject) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback(Msal.ErrorDescription.userLoginError, null, Msal.ErrorCodes.userLoginError, Constants.accessToken);
                    return;
                }
            }

            this._acquireTokenInProgress = true;
            let authenticationRequest: AuthenticationRequestParameters;
            let acquireTokenAuthority = authority ? Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;

            acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
                if (Utils.compareObjects(userObject, this._user)) {
                    authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this._redirectUri);
                } else {
                    authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this._redirectUri);
                }

                this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
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

                let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                urlNavigate = this.addHintParameters(urlNavigate, userObject);
                if (urlNavigate) {
                    this._cacheStorage.setItem(Constants.stateAcquireToken, authenticationRequest.state);
                    window.location.replace(urlNavigate);
                }
            });
        }

        /**
        * Used to acquire an access token for a new user using interactive authentication via a popup Window.
        * To request an id_token, pass the clientId as the only scope in the scopes array.
        * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like 'openid' and 'profile' are sent with every request.
        * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
        * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
        * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
        * - Default value is: "https://login.microsoftonline.com/common".
        * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
        * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
        * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
        */
        acquireTokenPopup(scopes: Array<string>): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                this._interactionMode = this._interactionModes.popUp;
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Utils.isEmpty(isValidScope)) {
                    reject(Msal.ErrorCodes.inputScopesError + ':' + isValidScope);
                }

                if (scopes) {
                    scopes = this.filterScopes(scopes);
                }

                const userObject = user ? user : this._user;
                if (this._acquireTokenInProgress) {
                    reject(Msal.ErrorCodes.acquireTokenProgressError + ':' + Msal.ErrorDescription.acquireTokenProgressError);
                    return;
                }

                const scope = scopes.join(" ").toLowerCase();
                if (!userObject) {
                    reject(Msal.ErrorCodes.userLoginError + ':' + Msal.ErrorDescription.userLoginError);
                    return;
                }

                this._acquireTokenInProgress = true;
                let authenticationRequest: AuthenticationRequestParameters;
                let acquireTokenAuthority = authority ? Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
                var popUpWindow = this.openWindow('about:blank', '_blank', 1, this, resolve, reject);
                if (!popUpWindow) {
                    return;
                }

                acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
                    if (Utils.compareObjects(userObject, this._user)) {
                        authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this._redirectUri);
                    } else {
                        authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this._redirectUri);
                    }

                    this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
                    authenticationRequest.state = authenticationRequest.state;
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

                    let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + "&prompt=select_account" + "&response_mode=fragment";
                    urlNavigate = this.addHintParameters(urlNavigate, userObject);
                    this._renewStates.push(authenticationRequest.state);
                    this.registerCallback(authenticationRequest.state, scope, resolve, reject);
                    if (popUpWindow) {
                        popUpWindow.location.href = urlNavigate;
                    }

                }, () => {
                    this._requestContext.logger.info(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    this._cacheStorage.setItem(Constants.error, Msal.ErrorCodes.endpointResolutionError);
                    this._cacheStorage.setItem(Constants.errorDescription, Msal.ErrorDescription.endpointResolutionError);
                    if (reject) {
                        reject(Msal.ErrorCodes.endpointResolutionError + ':' + Msal.ErrorDescription.endpointResolutionError);
                    }
                    if (popUpWindow)
                        popUpWindow.close();
                });
            });
        }

        /**
        * Used to get the token from cache.
        * MSAL will return the cached token if it is not expired.
        * Or it will send a request to the STS to obtain an access_token using a hidden iframe. To renew idToken, clientId should be passed as the only scope in the scopes array.
        * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like 'openid' and 'profile' are sent with every request.
        * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
        * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
        * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
        * - Default value is: "https://login.microsoftonline.com/common"
        * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
        * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
        * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Resolved with token or rejected with error.
        */
        @resolveTokenOnlyIfOutOfIframe
        acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                const isValidScope = this.validateInputScope(scopes);
                if (isValidScope && !Utils.isEmpty(isValidScope)) {
                    reject(Msal.ErrorCodes.inputScopesError + ':' + isValidScope);
                } else {
                    if (scopes) {
                        scopes = this.filterScopes(scopes);
                    }

                    const scope = scopes.join(" ").toLowerCase();
                    const userObject = user ? user : this._user;
                    if (!userObject) {
                        reject(Msal.ErrorCodes.userLoginError + ':' + Msal.ErrorDescription.userLoginError);
                        return;
                    }

                    let authenticationRequest: AuthenticationRequestParameters;
                    let newAuthority = authority ? Authority.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
                    if (Utils.compareObjects(userObject, this._user)) {
                        if (scopes.indexOf(this.clientId) > -1) {
                            authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token, this._redirectUri);
                        }
                        else {
                            authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.token, this._redirectUri);
                        }
                    } else {
                        authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this._redirectUri);
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
                    // refresh attept with iframe
                    //Already renewing for this scope, callback when we get the token.
                    if (this._activeRenewals[scope]) {
                        //Active renewals contains the state for each renewal.
                        this.registerCallback(this._activeRenewals[scope], scope, resolve, reject);
                    }
                    // cache miss
                    return this.authorityInstance.ResolveEndpointsAsync()
                        .then(() => {
                            if (scopes && scopes.indexOf(this.clientId) > -1 && scopes.length === 1) {
                                // App uses idToken to send to api endpoints
                                // Default scope is tracked as clientId to store this token
                                this._requestContext.logger.verbose("renewing idToken");
                                this.renewIdToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
                            } else {
                                this._requestContext.logger.verbose("renewing accesstoken");
                                this.renewToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
                            }
                        });
                }
            });
        }

        /**
        * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left.
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
                    document.body.insertAdjacentHTML('beforeend', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
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
            this.loadFrameTimeout(urlNavigate, "msalIdTokenFrame", this.clientId);
        }

        /**
         * Returns the signed in user (received from a user object created at the time of login) or null.
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
        * This method must be called for processing the response received from the STS. It extracts the hash, processes the token or error information and saves it in the cache. It then
        * calls the registered callbacks in case of redirect or resolves the promises with the result.
        * @param {string} [hash=window.location.hash] - Hash fragment of Url.
        * @param {Function} resolve - The resolve function of the promise object.
        * @param {Function} reject - The reject function of the promise object.
        * @hidden
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
                    if (this.isInIframe())
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
                    var errorDesc = requestInfo.parameters[Constants.errorDescription];
                    var error = requestInfo.parameters[Constants.error];
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

                } catch (err) {
                    this._requestContext.logger.error('Error occurred in token received callback function: ' + err);
                }

                if (this._interactionMode !== this._interactionModes.popUp) {
                    window.location.hash = "";
                    if (this._navigateToLoginRequestUrl && window.location.href.replace("#", "") !== this._cacheStorage.getItem(Constants.loginRequest))
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
            var scope: string = '';
            if (tokenResponse.parameters.hasOwnProperty("scope")) {
                scope = tokenResponse.parameters["scope"];
            }
            else {
                scope = this.clientId;
            }

            // Record error
            if (tokenResponse.parameters.hasOwnProperty(Constants.errorDescription) || tokenResponse.parameters.hasOwnProperty(Constants.error)) {
                this._requestContext.logger.info('Error :' + tokenResponse.parameters[Constants.error] + '; Error description:' + tokenResponse.parameters[Constants.errorDescription]);
                this._cacheStorage.setItem(Constants.error, tokenResponse.parameters["error"]);
                this._cacheStorage.setItem(Constants.errorDescription, tokenResponse.parameters[Constants.errorDescription]);
                if (tokenResponse.requestType === Constants.login) {
                    this._loginInProgress = false;
                    this._cacheStorage.setItem(Constants.loginError, tokenResponse.parameters[Constants.errorDescription] + ':' + tokenResponse.parameters[Constants.error]);
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
        * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
        * @param {string} hash - Hash passed from redirect page.
        * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
        * @hidden
        */
        isCallback(hash: string): boolean {
            hash = this.getHash(hash);
            const parameters = Utils.deserialize(hash);
            return (
                parameters.hasOwnProperty(Constants.errorDescription) ||
                parameters.hasOwnProperty(Constants.error) ||
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
                    parameters.hasOwnProperty(Constants.error) ||
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

        /**
         * Returns whether current window is in ifram for token renewal
         * @ignore
         * @hidden
         */
        private isInIframe() {
            return window.parent !== window
        }
    }
}
