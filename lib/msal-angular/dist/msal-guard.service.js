import { Inject, Injectable } from "@angular/core";
import { ActivatedRoute, Router, } from "@angular/router";
import { MSAL_CONFIG, MsalService } from "./msal.service";
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import { Location, PlatformLocation } from "@angular/common";
import { MsalConfig } from "./msal-config";
import { BroadcastService } from "./broadcast.service";
import { Constants } from "msal";
export class MsalGuard {
    constructor(config, authService, router, activatedRoute, location, platformLocation, broadcastService) {
        this.config = config;
        this.authService = authService;
        this.router = router;
        this.activatedRoute = activatedRoute;
        this.location = location;
        this.platformLocation = platformLocation;
        this.broadcastService = broadcastService;
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
            this.authService.acquireTokenSilent([this.config.clientID]).then((token) => {
                if (token) {
                    this.authService._oauthData.isAuthenticated = true;
                    this.broadcastService.broadcast("msal:loginSuccess", token);
                }
            }, (error) => {
                this.broadcastService.broadcast("msal:loginFailure", { error });
            });
        }
        else {
            return true;
        }
    }
    getBaseUrl() {
        var tempBaseUrl = this.platformLocation.getBaseHrefFromDOM();
        var currentAbsoluteUrl = window.location.href;
        var currentRelativeUrl = this.router.url;
        var index = currentAbsoluteUrl.indexOf(currentRelativeUrl);
        return currentAbsoluteUrl.substring(0, index);
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