import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MsalService } from './msal.service';
import { Injectable, Inject } from '@angular/core';
import { Location } from "@angular/common";
import { AuthenticationResult, InteractionType} from "@azure/msal-browser";
import { MsalGuardConfiguration } from './msal.guard.config';
import { MSAL_GUARD_CONFIG } from './constants';
import { concatMap, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable()
export class MsalGuard implements CanActivate {
    constructor(
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
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

    private loginInteractively(url: string): Observable<boolean> {
        if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            return this.authService.loginPopup({...this.msalGuardConfig.authRequest})
                .pipe(
                    map((response: AuthenticationResult) => {
                        this.authService.instance.setActiveAccount(response.account);
                        return true;
                    }),
                    catchError(() => of(false))
                );
        }

        const redirectStartPage = this.getDestinationUrl(url);
        this.authService.loginRedirect({
            redirectStartPage,
            scopes: [],
            ...this.msalGuardConfig.authRequest,
        });
        return of(false);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
        return this.authService.handleRedirectObservable()
            .pipe(
                concatMap(() => {
                    if (!this.authService.instance.getAllAccounts().length) {
                        return this.loginInteractively(state.url);
                    }
                    return of(true);
                }),
                catchError(() => console.log)
            );
    }

}
