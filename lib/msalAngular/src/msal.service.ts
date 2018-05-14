import {Inject, Injectable, InjectionToken} from "@angular/core";
import {MsalConfig} from "./msal-config";
import "rxjs/add/observable/of";
import "rxjs/add/operator/do";
import "rxjs/add/operator/delay";
import {
    UserAgentApplication,
    CacheResult,
    User, Constants
} from "../../msal-core/lib-commonjs";
import {
    ActivatedRoute, Router
} from "@angular/router";
import {Location} from "@angular/common";
import {BroadcastService} from "./broadcast.service";

export const MSAL_CONFIG = new InjectionToken<string>("MSAL_CONFIG");

let ResponseTypes = {
    id_token: "id_token",
    token: "token",
    id_token_token: "id_token token"
};

@Injectable()
export class MsalService extends UserAgentApplication {
    public user: any;
    _oauthData = {isAuthenticated: false, userName: "", loginError: "", idToken: {}};
    loginScopes: string[];
    _renewActive: boolean;

    constructor(@Inject(MSAL_CONFIG) private config: MsalConfig, private location: Location, private router: Router, private activatedRoute: ActivatedRoute, private broadcastService: BroadcastService) {
        super(config.clientID, config.authority, null,
            {
                validateAuthority: config.validateAuthority,
                cacheLocation: config.cacheLocation,
                redirectUri: config.redirectUri,
                postLogoutRedirectUri: config.postLogoutRedirectUri,
                logger: config.logger,
                loadFrameTimeout: config.loadFrameTimeout,
                navigateToLoginRequestUrl: config.navigateToLoginRequestUrl,
                isAngular: true,
                anonymousEndpoints: config.anonymousEndpoints,
                endPoints: config.endpoints,
            });

        this.loginScopes = [this.clientId];
        this.updateDataFromCache(this.loginScopes);
        var urlHash = window.location.hash;
        this.processHash(urlHash);

        window.addEventListener("msal:popUpHashChanged", (e: CustomEvent) => {
            this._logger.verbose("popUpHashChanged ");
            this.processHash(e.detail);
        });

        window.addEventListener('msal:popUpClosed', (e: CustomEvent) => {
            var errorParts = e.detail.split('|');
            if (this.loginInProgress()) {
                broadcastService.broadcast('msal:loginFailure', {errorParts});
                this.setloginInProgress(false);
            }
            else if (this.getAcquireTokenInProgress()) {
                broadcastService.broadcast('msal:acquireTokenFailure', {errorParts});
                this.setAcquireTokenInProgress(false);
            }
        });

        this.router.events.subscribe(event => {
            for (var i = 0; i < router.config.length; i++) {
                if (!router.config[i].canActivate) {
                    if (this.config && this.config.anonymousEndpoints) {
                        if (!this.isAnonymousEndpoint(router.config[i].path)) {
                            this.config.anonymousEndpoints.push(router.config[i].path);
                        }
                    }
                }
            }
        })
    }

    updateDataFromCache(scopes: string[]) {
        // only cache lookup here to not interrupt with events
        var cacheResult: CacheResult;
        cacheResult = this.getCachedTokenInternal(scopes, this.getUser());
        this._oauthData.isAuthenticated = cacheResult != null && cacheResult.token !== null && cacheResult.token.length > 0;
        this.user = this.getUser() || {userName: ""};
        this._oauthData.userName = this.user.name;
        this._oauthData.idToken = this.user.idToken;
        this._oauthData.loginError = cacheResult == null ? "" : cacheResult.error;
    }

    processHash(hash: string) {
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

            if (requestInfo.stateMatch) {
                if (requestInfo.requestType === "RENEW_TOKEN") {
                    tokenType = Constants.accessToken;
                    this._renewActive = false;
                    // Call within the same context without full page redirect keeps the callback
                    // id_token or access_token can be renewed
                    if (window.parent === window && !window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                        if (token) {
                            this.broadcastService.broadcast("msal:acquireTokenSuccess", token);
                        }
                        else if (error && errorDescription) {
                            this.broadcastService.broadcast("msal:acquireTokenFailure", {errorDescription, error});
                        }
                    }

                } else if (requestInfo.requestType === "LOGIN") {
                    tokenType = Constants.idToken;
                    this.updateDataFromCache(this.loginScopes);
                    if (this._oauthData.userName) {
                        setTimeout(() => {
                            // id_token is added as token for the app
                            this.updateDataFromCache(this.loginScopes);
                            //todo temp commented
                            //  this.userInfo = this._oauthData;
                        }, 1);
                        this.broadcastService.broadcast("msal:loginSuccess", token);
                    } else {
                        this.broadcastService.broadcast("msal:loginFailure", {errorDescription, error});
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
                        if (typeof loginStartPage !== "undefined" && loginStartPage && loginStartPage.length !== 0) {
                            // prevent the current location change and redirect the user back to the login start page
                            this._logger.verbose("Redirecting to start page: " + loginStartPage);
                            window.location.href = loginStartPage;
                        }
                    }
                    else {
                        //todo hashbang doesn't work currently
                        /*
                        // resetting the hash to null
                        if ($location.$$html5) {
                            $location.hash('');
                        }
                        else {
                            $location.path('');
                        }*/
                    }
                }
            }
            else {
                // state did not match, broadcast an error
                this.broadcastService.broadcast("msal:stateMismatch", {errorDescription, error});
            }
        }
    };


    isAnonymousEndpoint(url: string) {
        if (this.config && this.config.anonymousEndpoints) {
            for (var i = 0; i < this.config.anonymousEndpoints.length; i++) {
                if (url.indexOf(this.config.anonymousEndpoints[i]) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    getCacheStorage(): any {
        return this._cacheStorage;

    }

    login_redirect(scopes: string[], extraQueryParameters: string) {

        this._logger.verbose("login redirect flow");
        this.loginRedirect(scopes, extraQueryParameters)
    }

    login_popup(scopes: string[], extraQueryParameters: string): Promise<any> {
        this._logger.verbose("login popup flow");
        return new Promise((resolve, reject) => {
            this.loginPopup(scopes, extraQueryParameters).then((idToken) => {
                this.broadcastService.broadcast("msal:loginSuccess", {idToken});
                resolve(idToken);
            }, (error: any) => {
                this._logger.error("Error during login:\n" + error);
                this.broadcastService.broadcast("msal:loginFailure", {error});
                reject("error " + "|" + error);
            });
        });
    }

    log_out(): void {
        this.user = null;
        this.logout();
    }

    getCached_token(scopes: any): CacheResult {
        return this.getCachedTokenInternal(scopes, this.getUser());
    }

    acquire_token_silent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.acquireTokenSilent(scopes, authority, user, extraQueryParameters).then((token: any) => {
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenSuccess', token);
                resolve(token);
            }, (error: any) => {
                var errorParts = error.split('|');
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenFailure', errorParts);
                this._logger.error('Error when acquiring token for scopes: ' + scopes + " " + error);
                reject(error);
            })
        });

    }

    acquire_token_popup(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.acquireTokenPopup(scopes, authority, user, extraQueryParameters).then((token: any) => {
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenSuccess', token);
                resolve(token);
            }, (error: any) => {
                var errorParts = error.split('|');
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenFailure', errorParts);
                this._logger.error('Error when acquiring token for scopes : ' + scopes + error);
                reject(error);
            })
        });
    }


    acquire_token_redirect(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string) {
        var acquireTokenStartPage = this._cacheStorage.getItem(Constants.loginRequest);
        if (window.location.href !== acquireTokenStartPage)
            this._cacheStorage.setItem(Constants.loginRequest, window.location.href);
        this.acquireTokenRedirect(scopes, authority, user, extraQueryParameters);
    }


    public login_in_progress() {
        return this.loginInProgress();
    }

    public get_user() {
        return this.getUser();
    }

    get_scopes_for_endpoint(endpoint: string) {
        return this.getScopesForEndpoint(endpoint);
    }


    private authCallback(errorDesc: any, _token: any, error: any, _tokenType: any) {

    }

    get_request_info(hash: string): any {
        return this.getRequestInfo(hash);
    }

    clear_cache() {
        this.clearCache();
    }

    clear_cache_for_scope(accessToken: string) {
        this.clearCacheForScope(accessToken);
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

