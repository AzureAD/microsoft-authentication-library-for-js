import { Inject, Injectable, InjectionToken } from "@angular/core";
import { MsalConfig } from "./msal-config";
import "rxjs/add/observable/of";
import "rxjs/add/operator/do";
import "rxjs/add/operator/delay";
import { UserAgentApplication, Constants, Logger } from "msal";
import { Router } from "@angular/router";
import { BroadcastService } from "./broadcast.service";
import { AuthenticationResult } from "./AuthenticationResult";
import { MSALError } from "./MSALError";
export const MSAL_CONFIG = new InjectionToken("MSAL_CONFIG");
export class MsalService extends UserAgentApplication {
    constructor(config, router, broadcastService) {
        super(config.clientID, config.authority, null, {
            validateAuthority: config.validateAuthority,
            cacheLocation: config.cacheLocation,
            redirectUri: config.redirectUri,
            postLogoutRedirectUri: config.postLogoutRedirectUri,
            logger: new Logger(config.logger, { correlationId: config.correlationId, level: config.level, piiLoggingEnabled: config.piiLoggingEnabled }),
            loadFrameTimeout: config.loadFrameTimeout,
            navigateToLoginRequestUrl: config.navigateToLoginRequestUrl,
            isAngular: true,
            unprotectedResources: config.unprotectedResources,
            protectedResourceMap: new Map(config.protectedResourceMap),
        });
        this.config = config;
        this.router = router;
        this.broadcastService = broadcastService;
        this._oauthData = { isAuthenticated: false, userName: "", loginError: "", idToken: {} };
        this.loginScopes = [this.clientId];
        this.updateDataFromCache(this.loginScopes);
        var urlHash = window.location.hash;
        this.processHash(urlHash);
        window.addEventListener("msal:popUpHashChanged", (e) => {
            this._logger.verbose("popUpHashChanged ");
            this.processHash(e.detail);
        });
        window.addEventListener('msal:popUpClosed', (e) => {
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
        });
    }
    updateDataFromCache(scopes) {
        // only cache lookup here to not interrupt with events
        var cacheResult;
        cacheResult = super.getCachedTokenInternal(scopes, this.getUser());
        this._oauthData.isAuthenticated = cacheResult != null && cacheResult.token !== null && cacheResult.token.length > 0;
        var user = this.getUser();
        if (user) {
            this._oauthData.userName = user.name;
            this._oauthData.idToken = user.idToken;
        }
        if (cacheResult && cacheResult.error) {
            this._oauthData.loginError = cacheResult == null ? "" : cacheResult.error;
        }
    }
    processHash(hash) {
        if (this.isCallback(hash)) {
            var isPopup = false;
            var requestInfo = null;
            var callback = null;
            var msal;
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
                            this.broadcastService.broadcast("msal:acquireTokenFailure", msalError);
                        }
                    }
                }
                else if (requestInfo.requestType === "LOGIN") {
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
                    }
                    else {
                        this.broadcastService.broadcast("msal:loginFailure", msalError);
                    }
                }
                if (callback && typeof callback === "function") {
                    callback(errorDescription, token, error, tokenType);
                }
                // since this is a token renewal request in iFrame, we don't need to proceed with the location change.
                if (window.parent !== window) {
                    //in iframe
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
    }
    ;
    processRedirectCallBack(hash) {
        this._logger.info('Processing the callback from redirect response');
        const requestInfo = this.getRequestInfo(hash);
        const token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
        const errorDesc = requestInfo.parameters[Constants.errorDescription];
        const error = requestInfo.parameters[Constants.error];
        var tokenType;
        this._cacheStorage.removeItem(Constants.urlHash);
        var msalError = new MSALError(error, errorDesc);
        var authenticationResult = new AuthenticationResult(token);
        if (requestInfo.parameters[Constants.accessToken]) {
            tokenType = Constants.accessToken;
            if (token) {
                authenticationResult.tokenType = tokenType;
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
                authenticationResult.tokenType = tokenType;
                this.broadcastService.broadcast("msal:loginSuccess", authenticationResult);
            }
            else if (error && errorDesc) {
                this.broadcastService.broadcast("msal:loginFailure", msalError);
            }
        }
    }
    isUnprotectedResource(url) {
        if (this.config && this.config.unprotectedResources) {
            for (var i = 0; i < this.config.unprotectedResources.length; i++) {
                if (url.indexOf(this.config.unprotectedResources[i]) > -1) {
                    return true;
                }
            }
        }
        return false;
    }
    isEmpty(str) {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }
    //dummy method for future use
    authCallback(errorDesc, _token, error, _tokenType) {
    }
    clearCache() {
        super.clearCache();
    }
    /*This is a private api and not supposed to be use by customers */
    getLogger() {
        return super.getLogger();
    }
    getCacheStorage() {
        return this._cacheStorage;
    }
    isCallback(hash) {
        return super.isCallback(hash);
    }
    loginRedirect(consentScopes, extraQueryParameters) {
        this._logger.verbose("login redirect flow");
        super.loginRedirect(consentScopes, extraQueryParameters);
    }
    loginPopup(consentScopes, extraQueryParameters) {
        this._logger.verbose("login popup flow");
        return new Promise((resolve, reject) => {
            super.loginPopup(consentScopes, extraQueryParameters).then((idToken) => {
                var authenticationResult = new AuthenticationResult(idToken, "idToken");
                this.broadcastService.broadcast("msal:loginSuccess", authenticationResult);
                resolve(idToken);
            }, (error) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this._logger.error("Error during login:\n" + error);
                this.broadcastService.broadcast("msal:loginFailure", msalError);
                reject(error);
            });
        });
    }
    logout() {
        this.user = null;
        super.logout();
    }
    getCachedTokenInternal(scopes) {
        return super.getCachedTokenInternal(scopes, this.getUser());
    }
    acquireTokenSilent(scopes, authority, user, extraQueryParameters) {
        return new Promise((resolve, reject) => {
            super.acquireTokenSilent(scopes, authority, user, extraQueryParameters).then((token) => {
                this._renewActive = false;
                var authenticationResult = new AuthenticationResult(token);
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authenticationResult);
                resolve(token);
            }, (error) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenFailure', msalError);
                this._logger.error('Error when acquiring token for scopes: ' + scopes + " " + error);
                reject(error);
            });
        });
    }
    acquireTokenPopup(scopes, authority, user, extraQueryParameters) {
        return new Promise((resolve, reject) => {
            super.acquireTokenPopup(scopes, authority, user, extraQueryParameters).then((token) => {
                this._renewActive = false;
                var authenticationResult = new AuthenticationResult(token);
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authenticationResult);
                resolve(token);
            }, (error) => {
                var errorParts = error.split('|');
                var msalError = new MSALError(errorParts[0], errorParts[1]);
                this._renewActive = false;
                this.broadcastService.broadcast('msal:acquireTokenFailure', msalError);
                this._logger.error('Error when acquiring token for scopes : ' + scopes + " " + error);
                reject(error);
            });
        });
    }
    acquireTokenRedirect(scopes, authority, user, extraQueryParameters) {
        var acquireTokenStartPage = this._cacheStorage.getItem(Constants.loginRequest);
        if (window.location.href !== acquireTokenStartPage)
            this._cacheStorage.setItem(Constants.loginRequest, window.location.href);
        super.acquireTokenRedirect(scopes, authority, user, extraQueryParameters);
    }
    loginInProgress() {
        return super.loginInProgress();
    }
    getUser() {
        return super.getUser();
    }
    getScopesForEndpoint(endpoint) {
        return super.getScopesForEndpoint(endpoint);
    }
    clearCacheForScope(accessToken) {
        super.clearCacheForScope(accessToken);
    }
    info(message) {
        this._logger.info(message);
    }
    verbose(message) {
        this._logger.verbose(message);
    }
    removeItem(key) {
        this._cacheStorage.removeItem(key);
    }
}
MsalService.decorators = [
    { type: Injectable },
];
/** @nocollapse */
MsalService.ctorParameters = () => [
    { type: MsalConfig, decorators: [{ type: Inject, args: [MSAL_CONFIG,] },] },
    { type: Router, },
    { type: BroadcastService, },
];
//# sourceMappingURL=msal.service.js.map