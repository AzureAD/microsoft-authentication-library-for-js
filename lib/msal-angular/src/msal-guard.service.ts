import { Inject, Injectable } from "@angular/core";
import {
    ActivatedRoute,
    ActivatedRouteSnapshot, CanActivate, Router,
    RouterStateSnapshot,
} from "@angular/router";
import { MsalService } from "./msal.service";
import { Location, PlatformLocation } from "@angular/common";
import { BroadcastService } from "./broadcast.service";
import { Configuration, AuthResponse, AuthError } from "msal";
import { MsalAngularConfiguration } from "./msal-angular.configuration";
import { MSAL_CONFIG, MSAL_CONFIG_ANGULAR } from "./constants";
import { UrlUtils } from "msal/lib-commonjs/utils/UrlUtils";
import { WindowUtils } from "msal/lib-commonjs/utils/WindowUtils";

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

        // If a page with MSAL Guard is set as the redirect for acquireTokenSilent,
        // short-circuit to prevent redirecting or popups.
        if (UrlUtils.urlContainsHash(window.location.hash) && WindowUtils.isInIframe()) {
            this.authService.getLogger().warning("redirectUri set to page with MSAL Guard. It is recommended to not set redirectUri to a page that requires authentication.");
            return false;
        }

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
                scopes: [this.msalConfig.auth.clientId],
                forceRefresh: true
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
