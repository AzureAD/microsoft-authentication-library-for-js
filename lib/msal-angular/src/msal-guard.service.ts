import { Inject, Injectable } from "@angular/core";
import {
    ActivatedRoute,
    ActivatedRouteSnapshot, CanActivate, Router,
    RouterStateSnapshot,
} from "@angular/router";
import { MSAL_CONFIG, MsalService, MSAL_CONFIG_ANGULAR } from "./msal.service";
import { Location, PlatformLocation } from "@angular/common";
import { BroadcastService } from "./broadcast.service";
import { Configuration, AuthResponse, AuthError } from "msal";
import { MsalAngularConfiguration } from "./msal-angular.configuration";

@Injectable()
export class MsalGuard implements CanActivate {

    constructor(
        @Inject(MSAL_CONFIG) private msalConfig: Configuration,
        @Inject(MSAL_CONFIG_ANGULAR) private msalAngularConfig: MsalAngularConfiguration,
        private authService: MsalService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private location: Location,
        private platformLocation: PlatformLocation,
        private broadcastService: BroadcastService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        this.authService.getLogger().verbose("location change event from old url to new url");

        if (!this.authService.getAccount()) {
            if (this.msalAngularConfig.popUp) {
                return this.authService.loginPopup({
                    scopes: this.msalAngularConfig.consentScopes,
                    extraQueryParameters: this.msalAngularConfig.extraQueryParameters
                })
                    .then(() => true)
                    .catch(() => false);
            }

            this.authService.loginRedirect({
                scopes: this.msalAngularConfig.consentScopes,
                extraQueryParameters: this.msalAngularConfig.extraQueryParameters
            });
        } else {
            return this.authService.acquireTokenSilent({
                scopes: [this.msalConfig.auth.clientId]
            })
                .then((result: AuthResponse) => {
                    this.broadcastService.broadcast("msal:loginSuccess",  result);
                    return true;
                })
                .catch((error: AuthError) => {
                    this.broadcastService.broadcast("msal:loginFailure", error);
                    return false;
                });
        }

    }

}
