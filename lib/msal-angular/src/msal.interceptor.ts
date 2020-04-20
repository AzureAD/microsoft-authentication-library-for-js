import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';

import { Observable, from } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';

import {MsalService} from "./msal.service";
import { BroadcastService } from "./broadcast.service";
import { AuthResponse } from 'msal';

@Injectable()
export class MsalInterceptor implements HttpInterceptor {
    constructor(private auth: MsalService ,  private broadcastService: BroadcastService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const scopes = this.auth.getScopesForEndpoint(req.url);
        this.auth.getLogger().verbose('Url: ' + req.url + ' maps to scopes: ' + scopes);

        // If there are no scopes set for this request, do nothing.
        if (!scopes) {
            return next.handle(req);
        }

        let accessToken: string;

        // Acquire a token for this request, and attach as proper auth header.
        return from(
            this.auth.acquireTokenSilent({ scopes })
                .then((response: AuthResponse) => {
                    accessToken = response.accessToken;
                    const authHeader = `Bearer ${response.accessToken}`;
                    return req.clone({
                        setHeaders: {
                            Authorization: authHeader,
                        }
                    });
                })
        )
        .pipe(
            mergeMap(nextReq => next.handle(nextReq)),
            tap(
                event => {},
                err => {
                    if (err instanceof HttpErrorResponse && err.status === 401) {
                        this.auth.clearCacheForScope(accessToken);
                        this.broadcastService.broadcast('msal:notAuthorized', err.message);
                    }
                }
            )
        );
    }
}
