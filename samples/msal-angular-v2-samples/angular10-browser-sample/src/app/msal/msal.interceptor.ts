import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable, from, EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MsalService } from './msal.service';
import { Minimatch } from "minimatch";
import { AuthenticationResult, InteractionType } from "@azure/msal-browser";
import { Injectable, Inject } from '@angular/core';
import { MSAL_INTERCEPTOR_CONFIG } from './constants';
import { MsalInterceptorConfig } from './msal.interceptor.config';

@Injectable()
export class MsalInterceptor implements HttpInterceptor {
    constructor(
        @Inject(MSAL_INTERCEPTOR_CONFIG) private msalInterceptorConfig: MsalInterceptorConfig,
        private authService: MsalService
    ) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const scopes = this.getScopesForEndpoint(req.url);
        const account = this.authService.instance.getActiveAccount() || this.authService.instance.getAllAccounts()[0];

        if (!scopes || scopes.length === 0) {
            return next.handle(req);
        }

        // Note: For MSA accounts, include openid scope when calling acquireTokenSilent to return idToken
        return this.authService.acquireTokenSilent({scopes, account})
            .pipe(
                catchError(() => {
                    if (this.msalInterceptorConfig.interactionType === InteractionType.Popup) {
                        return this.authService.acquireTokenPopup({...this.msalInterceptorConfig.authRequest, scopes});
                    }
                    const redirectStartPage = window.location.href;
                    this.authService.acquireTokenRedirect({...this.msalInterceptorConfig.authRequest, scopes, redirectStartPage});
                    return EMPTY;
                }),
                switchMap((result: AuthenticationResult) => {
                    const headers = req.headers
                        .set('Authorization', `Bearer ${result.accessToken}`);

                    const requestClone = req.clone({headers});
                    return next.handle(requestClone);
                })
            );

    }

    private getScopesForEndpoint(endpoint: string): Array<string>|null {
        const protectedResourcesArray = Array.from(this.msalInterceptorConfig.protectedResourceMap.keys());
        const keyMatchesEndpointArray = protectedResourcesArray.filter(key => {
            const minimatch = new Minimatch(key);
            return minimatch.match(endpoint) || endpoint.indexOf(key) > -1;
        });

        // process all protected resources and send the first matched resource
        if (keyMatchesEndpointArray.length > 0) {
            const keyForEndpoint = keyMatchesEndpointArray[0];
            if (keyForEndpoint) {
                return this.msalInterceptorConfig.protectedResourceMap.get(keyForEndpoint);
            }
        }

        return null;
    }

}
