import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MsalService } from './msal.service';
import { Minimatch } from "minimatch";
import { AuthenticationResult, AccountInfo } from "@azure/msal-browser";
import { Injectable } from '@angular/core';

@Injectable()
export class MsalInterceptor implements HttpInterceptor {
    constructor(private authService: MsalService) {
        this.protectedResourceMap = new Map<string, Array<string>>()
        this.protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read'])
    }

    protectedResourceMap: Map<string, Array<string>>;

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const scopes = this.getScopesForEndpoint(req.url);
        const account = this.authService.getAllAccounts()[0];

        if (!scopes || scopes.length === 0) {
            return next.handle(req);
        }

        return from(this.acquireToken(scopes, account))
            .pipe(
                switchMap((result: AuthenticationResult) => {
                    const headers = req.headers
                        .set('Authorization', `Bearer ${result.accessToken}`)

                    const requestClone = req.clone({headers});
                    return next.handle(requestClone);
                })
            )

    }

    private getScopesForEndpoint(endpoint: string): Array<string>|null {
        const protectedResourcesArray = Array.from(this.protectedResourceMap.keys());
        const keyMatchesEndpointArray = protectedResourcesArray.filter(key => {
            const minimatch = new Minimatch(key);
            return minimatch.match(endpoint) || endpoint.indexOf(key) > -1;
        });
        
        // process all protected resources and send the first matched resource
        if (keyMatchesEndpointArray.length > 0) {
            const keyForEndpoint = keyMatchesEndpointArray[0];
            if (keyForEndpoint) {
                return this.protectedResourceMap.get(keyForEndpoint);
            }
        } 

        return null;
    }

    acquireToken(scopes: Array<string>, account: AccountInfo): Promise<AuthenticationResult> {
        return this.authService.acquireTokenSilent({scopes: scopes.concat(['openid']), account})
            .catch(() => {
                return this.authService.acquireTokenPopup({scopes});
            });
    }
    
}
