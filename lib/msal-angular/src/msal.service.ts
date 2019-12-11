import {Inject, Injectable, InjectionToken} from "@angular/core";
import "rxjs/add/observable/of";
import "rxjs/add/operator/do";
import "rxjs/add/operator/delay";
import {
    UserAgentApplication,
    Configuration,
    AuthenticationParameters,
    AuthResponse,
    AuthError
} from "msal";
import {
     Router
} from "@angular/router";
import {BroadcastService} from "./broadcast.service";
import {MSALError} from "./MSALError";
import { AuthCache } from "msal/lib-commonjs/cache/AuthCache";

export const MSAL_CONFIG = new InjectionToken<string>("MSAL_CONFIG");

const buildMsalConfig = (config: Configuration) : Configuration => {
    return {
        ...config,
        framework: {
            ...config.framework,
            isAngular: true
        }
    }
}

@Injectable()
export class MsalService extends UserAgentApplication {

    constructor(@Inject(MSAL_CONFIG) private msalConfig: Configuration, private router: Router, private broadcastService: BroadcastService) {
        super(buildMsalConfig(msalConfig));

        window.addEventListener("msal:popUpHashChanged", (e: CustomEvent) => {
            this.getLogger().verbose("popUpHashChanged ");
        });

        window.addEventListener('msal:popUpClosed', (e: CustomEvent) => {
            var errorParts = e.detail.split('|');
            var msalError = new MSALError(errorParts[0], errorParts[1]);
            if (this.getLoginInProgress()) {
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
                    if (this.msalConfig.framework.unprotectedResources) {
                        if (!this.isUnprotectedResource(router.config[i].path) && !this.isEmpty(router.config[i].path)) {
                            this.msalConfig.framework.unprotectedResources.push(router.config[i].path);
                        }
                    }
                }
            }
        })

    }
/*
    private processHash(hash: string) {
        if (this.isCallback(hash)) {
            var isPopup = false;
            var requestInfo = null;
            var callback = null;
            var msal: UserAgentApplication;
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
                    callback = msal.tokenReceivedCallback;
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
            //    this.processRedirectCallBack(pendingCallback);
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
    */

    private isUnprotectedResource(url: string) {
        if (this.msalConfig && this.msalConfig.framework.unprotectedResources) {
            for (var i = 0; i < this.msalConfig.framework.unprotectedResources.length; i++) {
                if (url.indexOf(this.msalConfig.framework.unprotectedResources[i]) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    private isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    public getCacheStorage(): AuthCache {
        return this.cacheStorage;
    }

    public loginPopup(request?: AuthenticationParameters): Promise<any> {
        return super.loginPopup(request)
            .then((authResponse: AuthResponse) => {
                this.broadcastService.broadcast("msal:loginSuccess", authResponse);
                return authResponse;
            })
            .catch((error: any) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this.getLogger().error("Error during login:\n" + error);
                this.broadcastService.broadcast("msal:loginFailure", msalError);
                throw error;
            });
    }

    public acquireTokenSilent(request: AuthenticationParameters): Promise<AuthResponse> {
        return super.acquireTokenSilent(request)
            .then((authResponse: AuthResponse) => {
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authResponse);
                return authResponse;
            })
            .catch((error: AuthError) => {
                this.broadcastService.broadcast('msal:acquireTokenFailure', error.errorMessage);
                this.getLogger().error('Error when acquiring token for scopes: ' + request.scopes + " " + error);
                throw error;
            });

    }

    public acquireTokenPopup(request: AuthenticationParameters): Promise<AuthResponse> {
        return super.acquireTokenPopup(request)
            .then((authResponse: AuthResponse) => {
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authResponse);
                return authResponse;
            })
            .catch((error: AuthError) => {
                this.broadcastService.broadcast('msal:acquireTokenFailure', error);
                this.getLogger().error('Error when acquiring token for scopes : ' + request.scopes +" "+  error);
                throw error;
            });
    }

    public getScopesForEndpoint(endpoint: string): string[] {
        return super.getScopesForEndpoint(endpoint);
    }

    public clearCacheForScope(accessToken: string) {
        return super.clearCacheForScope(accessToken);
    }
}

