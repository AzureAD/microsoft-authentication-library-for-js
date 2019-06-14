import { Inject, Injectable, InjectionToken } from "@angular/core";
import { Router } from "@angular/router";
import "rxjs/add/observable/of";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/do";
import { MsalConfig } from "./msal-config";

export const MSAL_CONFIG = new InjectionToken<string>("MSAL_CONFIG");

@Injectable()
export class MsalRouter  {
    public user: any;
    _oauthData = {isAuthenticated: false, userName: "", loginError: "", idToken: {}};
    private loginScopes: string[];
    _renewActive: boolean;

    constructor(@Inject(MSAL_CONFIG) private config: MsalConfig, private router: Router) {
      
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

    private isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
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
}

