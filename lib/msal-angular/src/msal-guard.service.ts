import { Location } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    CanLoad,
    Route,
    Router,
    RouterStateSnapshot,
    UrlSegment,
    UrlTree,
} from "@angular/router";
import {
    AuthError,
    Configuration,
    InteractionRequiredAuthError,
    UrlUtils,
    WindowUtils,
} from "msal";
import { MSAL_CONFIG, MSAL_CONFIG_ANGULAR } from "./constants";
import { MsalAngularConfiguration } from "./msal-angular.configuration";
import { MsalService } from "./msal.service";

@Injectable({
    providedIn: "root",
})
export class MsalGuard implements CanActivate, CanActivateChild, CanLoad {
    private readonly loginDeniedRoute?: UrlTree;
    private readonly loginFailedRoute?: UrlTree;

    public constructor(
        @Inject(MSAL_CONFIG) private readonly msalConfig: Configuration,
        @Inject(MSAL_CONFIG_ANGULAR)
        private readonly msalAngularConfig: MsalAngularConfiguration,
        private readonly router: Router,
        private readonly authService: MsalService,
        private readonly location: Location
    ) {
        if (msalAngularConfig.loginDeniedRoute) {
            this.loginDeniedRoute = this.router.parseUrl(
                msalAngularConfig.loginDeniedRoute
            );
        }
        if (msalAngularConfig.loginFailedRoute) {
            this.loginFailedRoute = this.router.parseUrl(
                msalAngularConfig.loginFailedRoute
            );
        }
    }

    public async canLoad(
        route: Route,
        _segments: UrlSegment[]
    ): Promise<boolean> {
        if (!route.path) {
            // TODO not sure when the path would be undefined so just deny
            return false;
        }

        return this.isAuthenticated(route.path);
    }

    public async canActivate(
        _next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean | UrlTree> {
        this.authService
            .getLogger()
            .verbose("location change event from old url to new url");

        return this.handleLogin(state.url);
    }

    private async handleLogin(url: string): Promise<boolean | UrlTree> {
        // If a page with MSAL Guard is set as the redirect for acquireTokenSilent,
        // short-circuit to prevent redirecting or popups.
        if (
            UrlUtils.urlContainsHash(window.location.hash) &&
            WindowUtils.isInIframe()
        ) {
            this.authService
                .getLogger()
                .warning(
                    "redirectUri set to page with MSAL Guard. It is recommended to not set redirectUri to a page that requires authentication."
                );
            return false;
        }

        return this.isAuthenticated(url).then(
            (isAuthenticated) =>
                isAuthenticated ? true : this.loginDeniedRoute ?? false,
            () => this.loginFailedRoute ?? false
        );
    }

    private async isAuthenticated(url: string): Promise<boolean> {
        const isAuthenticated = !!this.authService.getAccount();

        return isAuthenticated
            ? this.loginSilently(url)
            : this.loginInteractively(url);
    }

    /**
     * Interactively prompt the user to login
     * @param url Path of the requested page
     */
    private async loginInteractively(url: string): Promise<boolean> {
        if (this.msalAngularConfig.popUp) {
            return this.authService
                .loginPopup({
                    extraQueryParameters: this.msalAngularConfig
                        .extraQueryParameters,
                    scopes: this.msalAngularConfig.consentScopes,
                })
                .then(() => true)
                .catch(() => false);
        }

        const redirectStartPage = this.getDestinationUrl(url);

        this.authService.loginRedirect({
            extraQueryParameters: this.msalAngularConfig.extraQueryParameters,
            redirectStartPage,
            scopes: this.msalAngularConfig.consentScopes,
        });

        // reject access, for now
        // when the user returns after the redirect they'll be authenticated
        // and thous not reach this
        return false;
    }

    private async loginSilently(url: string): Promise<boolean> {
        return this.authService
            .acquireTokenSilent({
                // TODO msal released a ssoSilent API - relevant here?
                scopes: [this.msalConfig.auth.clientId],
            })
            .then(() => true)
            .catch((error: AuthError) => {
                if (
                    InteractionRequiredAuthError.isInteractionRequiredError(
                        error.errorCode
                    )
                ) {
                    this.authService
                        .getLogger()
                        .info(
                            `Interaction required error in AuthGuard, prompting for interaction.`
                        );

                    return this.loginInteractively(url);
                }

                this.authService
                    .getLogger()
                    .error(
                        `Non-interaction error in AuthGuard: ${error.errorMessage}`
                    );

                return false;
            });
    }

    /**
     * Builds the absolute url for the destination page
     * @param path Relative path of requested page
     * @returns Full destination url
     */
    private getDestinationUrl(path: string): string {
        // Absolute base url for the application (default to origin if base element not present)
        const baseElements = document.getElementsByTagName("base");
        const baseUrl = this.location.normalize(
            baseElements.length ? baseElements[0].href : window.location.origin
        );

        // Path of page (including hash, if using hash routing)
        const pathUrl = this.location.prepareExternalUrl(path);

        // Hash location strategy
        if (pathUrl.startsWith("#")) {
            return `${baseUrl}/${pathUrl}`;
        }

        // If using path location strategy, pathUrl will include the relative portion of the base path (e.g. /base/page).
        // Since baseUrl also includes /base, can just concatenate baseUrl + path
        return `${baseUrl}${path}`;
    }
}
