import { Inject, Injectable, InjectionToken } from "@angular/core";
import { Router } from "@angular/router";
import "rxjs/add/observable/of";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/do";
import { MsalConfig } from "./msal-config";
export const MSAL_CONFIG = new InjectionToken("MSAL_CONFIG");
export class MsalRouter {
    constructor(config, router) {
        this.config = config;
        this.router = router;
        this._oauthData = { isAuthenticated: false, userName: "", loginError: "", idToken: {} };
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
    isEmpty(str) {
        return (typeof str === "undefined" || !str || 0 === str.length);
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
}
MsalRouter.decorators = [
    { type: Injectable },
];
/** @nocollapse */
MsalRouter.ctorParameters = () => [
    { type: MsalConfig, decorators: [{ type: Inject, args: [MSAL_CONFIG,] },] },
    { type: Router, },
];
//# sourceMappingURL=msal.router.js.map