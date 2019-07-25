import {Inject, Injectable, InjectionToken} from "@angular/core";
import {MsalConfig} from "./msal-config";
import "rxjs/add/observable/of";
import "rxjs/add/operator/do";
import "rxjs/add/operator/delay";
import {
    UserAgentApplication,
    CacheResult,
    User, Constants, Logger
} from "msal";
import {
     Router
} from "@angular/router";
import {BroadcastService} from "./broadcast.service";
import {AuthenticationResult} from "./AuthenticationResult";
import {MSALError} from "./MSALError";

export const MSAL_CONFIG = new InjectionToken<string>("MSAL_CONFIG");

@Injectable()
export class MsalService extends UserAgentApplication {
    public user: any;
    _oauthData = {isAuthenticated: false, userName: "", loginError: "", idToken: {}};
    private loginScopes: string[];
    _renewActive: boolean;

    constructor(@Inject(MSAL_CONFIG) private config: MsalConfig, private router: Router, private broadcastService: BroadcastService) {
        super(config.clientID, config.authority, null,
            {
                validateAuthority: config.validateAuthority,
                cacheLocation: config.cacheLocation,
                storeAuthStateInCookie: config.storeAuthStateInCookie,
                redirectUri: config.redirectUri,
                postLogoutRedirectUri: config.postLogoutRedirectUri,
                logger: new Logger(config.logger, { correlationId: config.correlationId, level :config.level  ,piiLoggingEnabled: config.piiLoggingEnabled}),
                loadFrameTimeout: config.loadFrameTimeout,
                navigateToLoginRequestUrl: config.navigateToLoginRequestUrl,
                isAngular: true,
                unprotectedResources: config.unprotectedResources,
                protectedResourceMap: new Map(config.protectedResourceMap)
            });

        this.loginScopes = [this.clientId, "openid", "profile", "user.read"];
        this.updateDataFromCache(this.loginScopes);
        var urlHash = window.location.hash;
        this.processHash(urlHash);

        window.addEventListener("msal:popUpHashChanged", (e: CustomEvent) => {
            this._logger.verbose("popUpHashChanged ");
            this.processHash(e.detail);
        });

        window.addEventListener('msal:popUpClosed', (e: CustomEvent) => {
            var errorParts = e.detail.split('|');
            var msalError = new MSALError(errorParts[0], errorParts[1]);
            if (this.loginInProgress()) {
                broadcastService.broadcast('msal:loginFailure', msalError);
                this.setloginInProgress(false);
            }
            else if (this.getAcquireTokenInProgress()) {
                broadcastService.broadcast('msal:acquireTokenFailure', msalError);
                this.setAcquireTokenInProgress(false);
            }
        });

        this.router.events.subscribe(event => {
            for (var i = 0; i < router.config.length; i++) {
                if (!router.config[i].canActivate) {
                    if (this.config && this.config.unprotectedResources) {
                        if (!this.isUnprotectedResource(router.config[i].path) && !this.isEmpty(router.config[i].path)) {
                            this.config.unprotectedResources.push(router.config[i].path);
                        }
                    }
                }
            }
        })
    }

     updateDataFromCache(scopes: string[]) {
        // only cache lookup here to not interrupt with events
        var cacheResult: CacheResult;
        cacheResult = super.getCachedTokenInternal(scopes, this.getUser());
        this._oauthData.isAuthenticated = cacheResult != null && cacheResult.token !== null && cacheResult.token.length > 0;
        var user = this.getUser();
        if(user) {
            this._oauthData.userName = user.name;
            this._oauthData.idToken = user.idToken;
        }
        if (cacheResult && cacheResult.error) {
            this._oauthData.loginError = cacheResult == null ? "" : cacheResult.error;
        }
    }

    private processHash(hash: string) {
        if (this.isCallback(hash)) {
            var isPopup = false;
            var requestInfo = null;
            var callback = null;
            var msal: any;
            // callback can come from popupWindow, iframe or mainWindow
            if (window.openedWindows.length > 0 && window.openedWindows[window.openedWindows.length - 1].opener
                && window.openedWindows[window.openedWindows.length - 1].opener.msal) {
                var mainWindow = window.openedWindows[window.openedWindows.length - 1].opener;
                msal = mainWindow.msal;
                isPopup = true;
                requestInfo = msal.getRequestInfo(hash);
                if (mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                    callback = mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse];
                }
            }
            //redirect flow
            else if (window.parent && window.parent.msal) {
                msal = window.parent.msal;
                requestInfo = msal.getRequestInfo(hash);
                if (window.parent !== window && window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                    callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                }
                else {
                    callback = msal._tokenReceivedCallback;
                }
            }


            this.getLogger().verbose("Processing the hash: " + hash);
            this.saveTokenFromHash(requestInfo);
            // Return to callback if it is sent from iframe
            var token = requestInfo.parameters["access_token"] || requestInfo.parameters["id_token"];
            var error = requestInfo.parameters["error"];
            var errorDescription = requestInfo.parameters["error_description"];
            var tokenType = null;
            var msalError = new MSALError(error, errorDescription);
            var authenticationResult = new AuthenticationResult(token);

            if (requestInfo.stateMatch) {
                if (requestInfo.requestType === "RENEW_TOKEN") {
                    tokenType = Constants.accessToken;
                    authenticationResult.tokenType = tokenType;
                    this._renewActive = false;
                    // Call within the same context without full page redirect keeps the callback
                    // id_token or access_token can be renewed
                    if (window.parent === window && !window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                        if (token) {
                            this.broadcastService.broadcast("msal:acquireTokenSuccess", authenticationResult);
                        }
                        else if (error && errorDescription) {
                            this.broadcastService.broadcast("msal:acquireTokenFailure",   msalError);
                        }
                    }

                } else if (requestInfo.requestType === "LOGIN") {
                    tokenType = Constants.idToken;
                    authenticationResult.tokenType = tokenType;
                    this.updateDataFromCache(this.loginScopes);
                    if (this._oauthData.userName) {
                        setTimeout(() => {
                            // id_token is added as token for the app
                            this.updateDataFromCache(this.loginScopes);
                            //todo temp commented
                            //  this.userInfo = this._oauthData;
                        }, 1);
                        this.broadcastService.broadcast("msal:loginSuccess", authenticationResult);
                    } else {
                        this.broadcastService.broadcast("msal:loginFailure", msalError);
                    }
                }

                if (callback && typeof callback === "function") {
                    callback(errorDescription, token, error, tokenType);
                }

                // since this is a token renewal request in iFrame, we don't need to proceed with the location change.
                if (window.parent !== window) {//in iframe
                    if (event && event.preventDefault) {

                        event.preventDefault();
                    }
                    return;
                }

                // redirect to login start page
                if (window.parent === window && !isPopup) {
                    if (this._navigateToLoginRequestUrl) {
                        var loginStartPage = this._cacheStorage.getItem(Constants.loginRequest);
                        this._cacheStorage.setItem(Constants.urlHash, hash);
                        if (typeof loginStartPage !== "undefined" && loginStartPage && loginStartPage.length !== 0) {
                            // prevent the current location change and redirect the user back to the login start page
                            this._logger.verbose("Redirecting to start page: " + loginStartPage);
                            window.location.href = loginStartPage;
                        }
                    }
                    //redirect to redirect uri. No page reload here since we are only removing the url after the hash
                    else {
                        window.location.hash = '';
                    }
                }
            }
            else {
                // state did not match, broadcast an error
                this.broadcastService.broadcast("msal:stateMismatch", msalError);
            }
        }
        else {
            var pendingCallback = this._cacheStorage.getItem(Constants.urlHash);
            if (pendingCallback) {
               this.processRedirectCallBack(pendingCallback);
            }
        }
    };


    private processRedirectCallBack(hash: string): void {
        this._logger.info('Processing the callback from redirect response');
        const requestInfo = this.getRequestInfo(hash);
        const token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
        const errorDesc = requestInfo.parameters[Constants.errorDescription];
        const error = requestInfo.parameters[Constants.error];
        var tokenType: string;
        this._cacheStorage.removeItem(Constants.urlHash);
        var msalError = new MSALError(error, errorDesc);
        var authenticationResult = new AuthenticationResult(token);
        if (requestInfo.parameters[Constants.accessToken]) {
            tokenType = Constants.accessToken;
            if (token) {
                authenticationResult.tokenType= tokenType;
                this.broadcastService.broadcast("msal:acquireTokenSuccess", authenticationResult);
            }
            else if (error && errorDesc) {
                //TODO this should also send back the scopes
                this.broadcastService.broadcast("msal:acquireTokenFailure", msalError);
            }
        }
        else {
            tokenType = Constants.idToken;
            if (token) {
                authenticationResult.tokenType= tokenType;
                this.broadcastService.broadcast("msal:loginSuccess", authenticationResult);
            }
            else if (error && errorDesc) {
                this.broadcastService.broadcast("msal:loginFailure", msalError);
            }
        }
    }


    private isUnprotectedResource(url: string) {
        if (this.config && this.config.unprotectedResources) {
            for (var i = 0; i < this.config.unprotectedResources.length; i++) {
                if (url.indexOf(this.config.unprotectedResources[i]) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    private isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    //dummy method for future use
    private authCallback(errorDesc: any, _token: any, error: any, _tokenType: any) {

    }

    protected clearCache() {
        super.clearCache();
    }


    /*This is a private api and not supposed to be use by customers */
    getLogger()
    {
        return super.getLogger();
    }

    getCacheStorage(): any {
        return this._cacheStorage;

    }

    public isCallback(hash: string): boolean
    {
        return super.isCallback(hash);
    }

    public loginRedirect(consentScopes?: string[], extraQueryParameters?: string) {

        this._logger.verbose("login redirect flow");
        super.loginRedirect(consentScopes, extraQueryParameters)
    }

    public loginPopup(consentScopes?: string[], extraQueryParameters?: string): Promise<any> {
        this._logger.verbose("login popup flow");
        return super.loginPopup(consentScopes, extraQueryParameters)
            .then((idToken) => {
                var authenticationResult = new AuthenticationResult(idToken, "idToken");
                this.broadcastService.broadcast("msal:loginSuccess", authenticationResult);
                return idToken;
            }, (error: any) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this._logger.error("Error during login:\n" + error);
                this.broadcastService.broadcast("msal:loginFailure", msalError);
                throw error;
            });

    }

    public logout(): void {
        this.user = null;
        super.logout();
    }

    getCachedTokenInternal(scopes: any): CacheResult {
        return super.getCachedTokenInternal(scopes, this.getUser());
    }

    public acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<any> {
        return super.acquireTokenSilent(scopes, authority, user, extraQueryParameters).then((token: any) => {
                this._renewActive = false;
                var authenticationResult = new AuthenticationResult(token);
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authenticationResult);
                return token;
            }, (error: any) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenFailure', msalError);
                this._logger.error('Error when acquiring token for scopes: ' + scopes + " " + error);

                throw error;
            });

    }

    public acquireTokenPopup(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<any> {
        return super.acquireTokenPopup(scopes, authority, user, extraQueryParameters).then((token: any) => {
                this._renewActive = false;
                var authenticationResult = new AuthenticationResult(token);
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authenticationResult);
                return token;
            }, (error: any) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenFailure', msalError);
                this._logger.error('Error when acquiring token for scopes : ' + scopes +" "+  error);
                throw error;
            });
    }

    public acquireTokenRedirect(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string) {
        var acquireTokenStartPage = this._cacheStorage.getItem(Constants.loginRequest);
        if (window.location.href !== acquireTokenStartPage)
            this._cacheStorage.setItem(Constants.loginRequest, window.location.href);
        super.acquireTokenRedirect(scopes, authority, user, extraQueryParameters);
    }

    public loginInProgress(): boolean {
        return super.loginInProgress();
    }

    public getUser(): User {
        return super.getUser();
    }

    getScopesForEndpoint(endpoint: string) {
        return super.getScopesForEndpoint(endpoint);
    }

    clearCacheForScope(accessToken: string) {
        super.clearCacheForScope(accessToken);
    }

    info(message: string) {
        this._logger.info(message);
    }

    verbose(message: string) {
        this._logger.verbose(message);
    }

    removeItem(key: string) {
        this._cacheStorage.removeItem(key);
    }


}

