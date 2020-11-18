/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { MsalService } from "./msal.service";
import { Injectable, Inject } from "@angular/core";
import { Location } from "@angular/common";
import { InteractionType, BrowserConfigurationAuthError } from "@azure/msal-browser";
import { MsalGuardConfiguration } from "./msal.guard.config";
import { MSAL_GUARD_CONFIG } from "./constants";
import { concatMap, catchError, map } from "rxjs/operators";
import { Observable, of } from "rxjs";

@Injectable()
export class MsalGuard implements CanActivate {
    constructor(
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        private authService: MsalService,
        private location: Location,
    ) { }

    /**
     * Builds the absolute url for the destination page
     * @param path Relative path of requested page
     * @returns Full destination url
     */
    getDestinationUrl(path: string): string {
        this.authService.logger.verbose("Guard - getting destination url");
        // Absolute base url for the application (default to origin if base element not present)
        const baseElements = document.getElementsByTagName("base");
        const baseUrl = this.location.normalize(baseElements.length ? baseElements[0].href : window.location.origin);

        // Path of page (including hash, if using hash routing)
        const pathUrl = this.location.prepareExternalUrl(path);

        // Hash location strategy
        if (pathUrl.startsWith("#")) {
            this.authService.logger.verbose("Guard - destination by hash routing");
            return `${baseUrl}/${pathUrl}`;
        }

        /*
         * If using path location strategy, pathUrl will include the relative portion of the base path (e.g. /base/page).
         * Since baseUrl also includes /base, can just concatentate baseUrl + path
         */
        return `${baseUrl}${path}`;
    }

    private loginInteractively(url: string): Observable<boolean> {
        if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            this.authService.logger.verbose("Guard - logging in by popup");
            return this.authService.loginPopup({ ...this.msalGuardConfig.authRequest })
                .pipe(
                    map(() => {
                        this.authService.logger.verbose("Guard - login by popup successful, can activate");
                        return true;
                    }),
                    catchError(() => of(false))
                );
        }

        this.authService.logger.verbose("Guard - logging in by redirect");
        const redirectStartPage = this.getDestinationUrl(url);
        this.authService.loginRedirect({
            redirectStartPage,
            ...this.msalGuardConfig.authRequest
        });
        return of(false);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        if (this.msalGuardConfig.interactionType !== InteractionType.Popup && this.msalGuardConfig.interactionType !== InteractionType.Redirect) {
            throw new BrowserConfigurationAuthError("invalid_interaction_type", "Invalid interaction type provided to MSAL Guard. InteractionType.Popup or InteractionType.Redirect must be provided in the MsalGuardConfiguration");
        }
        this.authService.logger.verbose("MSAL Guard activated");

        return this.authService.handleRedirectObservable()
            .pipe(
                concatMap(() => {
                    if (!this.authService.instance.getAllAccounts().length) {
                        this.authService.logger.verbose("Guard - no accounts retrieved, log in required to activate");
                        return this.loginInteractively(state.url);
                    }
                    this.authService.logger.verbose("Guard - account retrieved, can activate");
                    return of(true);
                }),
                catchError(() => {
                    this.authService.logger.verbose("Guard - error while logging in, unable to activate");
                    return of(false);
                })
            );
    }

}
