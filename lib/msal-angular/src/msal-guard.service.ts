import { Inject, Injectable } from "@angular/core";
import {
    ActivatedRoute,
    ActivatedRouteSnapshot, CanActivate, Router,
    RouterStateSnapshot,
} from "@angular/router";
import { MsalService } from "./msal.service";
import { Location, PlatformLocation } from "@angular/common";
import { BroadcastService } from "./broadcast.service";
import { Configuration, AuthError, InteractionRequiredAuthError, UrlUtils, WindowUtils } from "msal";
import { MsalAngularConfiguration } from "./msal-angular.configuration";
import { MSAL_CONFIG, MSAL_CONFIG_ANGULAR } from "./constants";

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

    /**
     * Builds the absolute url for the destination page
     * @param path Relative path of requested page
     * @returns Full destination url
     */
    getDestinationUrl(path: string): string {
        // Absolute base url for the application (default to origin if base element not present)
        const baseElements = document.getElementsByTagName("base");
        const baseUrl = this.location.normalize(baseElements.length ? baseElements[0].href : window.location.origin);

        // Path of page (including hash, if using hash routing)
        const pathUrl = this.location.prepareExternalUrl(path);

        // Hash location strategy
        if (pathUrl.startsWith("#")) {
            return `${baseUrl}/${pathUrl}`;
        }

        /*
         * If using path location strategy, pathUrl will include the relative portion of the base path (e.g. /base/page).
         * Since baseUrl also includes /base, can just concatentate baseUrl + path
         */
        return `${baseUrl}${path}`;
    }

    /**
     * Interactively prompt the user to login
     * @param url Path of the requested page
     */
    async loginInteractively(url: string) {
        if (this.msalAngularConfig.popUp) {
            return this.authService.loginPopup({
                scopes: this.msalAngularConfig.consentScopes,
                extraQueryParameters: this.msalAngularConfig.extraQueryParameters
            })
                .then(() => true)
                .catch(() => false);
        }

        const redirectStartPage = this.getDestinationUrl(url);

        this.authService.loginRedirect({
            redirectStartPage,
            scopes: this.msalAngularConfig.consentScopes,
            extraQueryParameters: this.msalAngularConfig.extraQueryParameters
        });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        this.authService.getLogger().verbose("location change event from old url to new url");

        /*
         * If a page with MSAL Guard is set as the redirect for acquireTokenSilent,
         * short-circuit to prevent redirecting or popups.
         */
        if (UrlUtils.urlContainsHash(window.location.hash) && WindowUtils.isInIframe()) {
            this.authService.getLogger().warning("redirectUri set to page with MSAL Guard. It is recommended to not set redirectUri to a page that requires authentication.");
            return false;
        }

        if (!this.authService.getAccount()) {
            return this.loginInteractively(state.url);
        }

        return this.authService.acquireTokenSilent({
            scopes: [this.msalConfig.auth.clientId]
        })
            .then(() => true)
            .catch((error: AuthError) => {
                if (InteractionRequiredAuthError.isInteractionRequiredError(error.errorCode)) {
                    this.authService.getLogger().info("Interaction required error in MSAL Guard, prompting for interaction.");
                    return this.loginInteractively(state.url);
                }

                this.authService.getLogger().error(`Non-interaction error in MSAL Guard: ${error.errorMessage}`);
                throw error;
            });
    }

}
