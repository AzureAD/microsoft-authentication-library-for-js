import { InjectionToken } from "@angular/core";
import { Router } from "@angular/router";
import "rxjs/add/observable/of";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/do";
import { MsalConfig } from "./msal-config";
export declare const MSAL_CONFIG: InjectionToken<string>;
export declare class MsalRouter {
    private config;
    private router;
    user: any;
    _oauthData: {
        isAuthenticated: boolean;
        userName: string;
        loginError: string;
        idToken: {};
    };
    private loginScopes;
    _renewActive: boolean;
    constructor(config: MsalConfig, router: Router);
    private isEmpty;
    private isUnprotectedResource;
}
