import { Injectable } from "@angular/core";
import {
    ActivatedRoute,
    ActivatedRouteSnapshot, CanActivate, Router,
    RouterStateSnapshot,
} from "@angular/router";
import { MsalService } from "./msal.service";
import { Location, PlatformLocation } from "@angular/common";
import { BroadcastService } from "./broadcast.service";
import { AuthError, InteractionRequiredAuthError, UrlUtils, WindowUtils } from "msal";
import { Observable } from "rxjs";
import { skipWhile, mergeMap, tap, catchError, map } from "rxjs/operators";

@Injectable()
export class MsalGuard implements CanActivate {

    constructor(
        private authService: MsalService,
        private location: Location
    ) { }

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

        // If using path location strategy, pathUrl will include the relative portion of the base path (e.g. /base/page).
        // Since baseUrl also includes /base, can just concatentate baseUrl + path
        return `${baseUrl}${path}`;
    }

    /**
     * Interactively prompt the user to login
     * @param url Path of the requested page
     */
    async loginInteractively(url: string) {
        if (this.authService.getMsalAngularConfig().popUp) {
            return this.authService.loginPopup({
                scopes: this.authService.getMsalAngularConfig().consentScopes,
                extraQueryParameters: this.authService.getMsalAngularConfig().extraQueryParameters
            })
                .then(() => true)
                .catch(() => false);
        }

        const redirectStartPage = this.getDestinationUrl(url);

        this.authService.loginRedirect({
            redirectStartPage,
            scopes: this.authService.getMsalAngularConfig().consentScopes,
            extraQueryParameters: this.authService.getMsalAngularConfig().extraQueryParameters
        });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> | Observable<boolean> {
        this.authService.getLogger().verbose("location change event from old url to new url");

        // If a page with MSAL Guard is set as the redirect for acquireTokenSilent,
        // short-circuit to prevent redirecting or popups.
        if (UrlUtils.urlContainsHash(window.location.hash) && WindowUtils.isInIframe()) {
            this.authService.getLogger().warning("redirectUri set to page with MSAL Guard. It is recommended to not set redirectUri to a page that requires authentication.");
            return false;
        }

        if (!this.authService.getAccount()) {
            return this.loginInteractively(state.url);
        }

        return this.authService.isModuleConfigured.pipe(
            skipWhile(active => !active),
            map(() => {

                return this.authService.acquireTokenSilent({
                    scopes: [this.authService.getMsalConfig().auth.clientId]
                });
            }),
            map(() => true),
            catchError((error: AuthError) => {
                if (InteractionRequiredAuthError.isInteractionRequiredError(error.errorCode)) {
                    this.authService.getLogger().info(`Interaction required error in MSAL Guard, prompting for interaction.`);
                    return this.loginInteractively(state.url);
                }

                this.authService.getLogger().error(`Non-interaction error in MSAL Guard: ${error.errorMessage}`);
                throw error;
            })
        );
    }

}
