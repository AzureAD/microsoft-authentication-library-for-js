import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MsalService } from './msal.service';
import { Injectable, Inject } from '@angular/core';
import { Location } from "@angular/common";
import { MsalGuardConfiguration } from './msal.guard.config';
import { InteractionType, MSAL_GUARD_CONFIG, MSAL_INSTANCE } from './constants';
import { IPublicClientApplication } from '@azure/msal-browser';

@Injectable()
export class MsalGuard implements CanActivate {
    constructor(
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
        private authService: MsalService,
        private location: Location,
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

        // If using path location strategy, pathUrl will include the relative portion of the base path (e.g. /base/page).
        // Since baseUrl also includes /base, can just concatentate baseUrl + path
        return `${baseUrl}${path}`;
    }

    private async loginInteractively(url: string): Promise<boolean> {
        if (this.msalGuardConfig.interactionType === InteractionType.POPUP) {
            return this.msalInstance.loginPopup()
                .then(() => true)
                .catch(() => false)
        }

        const redirectStartPage = this.getDestinationUrl(url);
        this.msalInstance.loginRedirect({
            redirectStartPage,
            scopes: [],
        });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        return this.msalInstance.handleRedirectPromise()
            .then(() => {
                if (!this.authService.getAllAccounts().length) {
                    return this.loginInteractively(state.url);
                }
                return true;
            })
    }
}
