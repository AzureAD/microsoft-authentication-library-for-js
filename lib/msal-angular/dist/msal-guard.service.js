import { Inject, Injectable } from "@angular/core";
import { ActivatedRoute, Router, } from "@angular/router";
import { MSAL_CONFIG, MsalService } from "./msal.service";
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import { Location, PlatformLocation } from "@angular/common";
import { MsalConfig } from "./msal-config";
import { BroadcastService } from "./broadcast.service";
import { Constants } from "msal";
import { MSALError } from "./MSALError";
import { AuthenticationResult } from "./AuthenticationResult";
export class MsalGuard {
    constructor(config, authService, router, activatedRoute, location, platformLocation, broadcastService) {
        this.config = config;
        this.authService = authService;
        this.router = router;
        this.activatedRoute = activatedRoute;
        this.location = location;
        this.platformLocation = platformLocation;
        this.broadcastService = broadcastService;
        this.isEmpty = function (str) {
            return (typeof str === "undefined" || !str || 0 === str.length);
        };
    }
    canActivate(route, state) {
        this.authService.getLogger().verbose("location change event from old url to new url");
        this.authService.updateDataFromCache([this.config.clientID]);
        if (!this.authService._oauthData.isAuthenticated && !this.authService._oauthData.userName) {
            if (state.url) {
                if (!this.authService._renewActive && !this.authService.loginInProgress()) {
                    var loginStartPage = this.getBaseUrl() + state.url;
                    if (loginStartPage !== null) {
                        this.authService.getCacheStorage().setItem(Constants.angularLoginRequest, loginStartPage);
                    }
                    if (this.config.popUp) {
                        return new Promise((resolve, reject) => {
                            this.authService.loginPopup(this.config.consentScopes, this.config.extraQueryParameters).then(function (token) {
                                resolve(true);
                            }, function (error) {
                                reject(false);
                            });
                        });
                    }
                    else {
                        this.authService.loginRedirect(this.config.consentScopes, this.config.extraQueryParameters);
                    }
                }
            }
        }
        else if (!this.authService._oauthData.isAuthenticated && this.authService._oauthData.userName) {
            return new Promise((resolve, reject) => {
                this.authService.acquireTokenSilent([this.config.clientID]).then((token) => {
                    if (token) {
                        this.authService._oauthData.isAuthenticated = true;
                        var authenticationResult = new AuthenticationResult(token);
                        this.broadcastService.broadcast("msal:loginSuccess", authenticationResult);
                        resolve(true);
                    }
                }, (error) => {
                    var errorParts = error.split('|');
                    var msalError = new MSALError(errorParts[0], errorParts[1], "");
                    this.broadcastService.broadcast("msal:loginFailure", msalError);
                    resolve(false);
                });
            });
        }
        else {
            return true;
        }
    }
    getBaseUrl() {
        var currentAbsoluteUrl = window.location.href;
        var currentRelativeUrl = this.location.path();
        if (this.isEmpty(currentRelativeUrl)) {
            if (currentAbsoluteUrl.endsWith("/")) {
                currentAbsoluteUrl = currentAbsoluteUrl.replace(/\/$/, '');
            }
            return currentAbsoluteUrl;
        }
        else {
            var index = currentAbsoluteUrl.indexOf(currentRelativeUrl);
            return currentAbsoluteUrl.substring(0, index);
        }
    }
}
MsalGuard.decorators = [
    { type: Injectable },
];
/** @nocollapse */
MsalGuard.ctorParameters = () => [
    { type: MsalConfig, decorators: [{ type: Inject, args: [MSAL_CONFIG,] },] },
    { type: MsalService, },
    { type: Router, },
    { type: ActivatedRoute, },
    { type: Location, },
    { type: PlatformLocation, },
    { type: BroadcastService, },
];
//# sourceMappingURL=msal-guard.service.js.map