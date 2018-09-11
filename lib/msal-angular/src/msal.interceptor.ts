import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/mergeMap'
import {MsalService} from "./msal.service";
import {BroadcastService} from "./broadcast.service";
import {MSALError} from "./MSALError";

@Injectable()
export class MsalInterceptor implements HttpInterceptor {

    constructor(private auth: MsalService ,  private broadcastService: BroadcastService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        var scopes = this.auth.getScopesForEndpoint(req.url);
        this.auth.verbose('Url: ' + req.url + ' maps to scopes: ' + scopes);
        if (scopes === null) {
            return next.handle(req);
        }
        var tokenStored = this.auth.getCachedTokenInternal(scopes);
        if (tokenStored && tokenStored.token) {
          req = req.clone({
              setHeaders: {
                    Authorization: `Bearer ${tokenStored.token}`,
                }
            });
            return next.handle(req).do(event => {}, err => {
                if (err instanceof HttpErrorResponse && err.status == 401) {
                    var scopes = this.auth.getScopesForEndpoint(req.url);
                    var tokenStored = this.auth.getCachedTokenInternal(scopes);
                    if (tokenStored && tokenStored.token) {
                        this.auth.clearCacheForScope(tokenStored.token);
                    }
                    var msalError = new MSALError(JSON.stringify(err), "", JSON.stringify(scopes));
                    this.broadcastService.broadcast('msal:notAuthorized', msalError);
                }
            });
        }
        else {
            return Observable.fromPromise(this.auth.acquireTokenSilent(scopes).then(token => {
                const JWT = `Bearer ${token}`;
                return req.clone({
                    setHeaders: {
                        Authorization: JWT,
                    },
                });
            })).mergeMap(req => next.handle(req).do(event => {}, err => {
                if (err instanceof HttpErrorResponse && err.status == 401) {
                    var scopes = this.auth.getScopesForEndpoint(req.url);
                    var tokenStored = this.auth.getCachedTokenInternal(scopes);
                    if (tokenStored && tokenStored.token) {
                        this.auth.clearCacheForScope(tokenStored.token);
                    }
                    var msalError = new MSALError(JSON.stringify(err), "", JSON.stringify(scopes));
                    this.broadcastService.broadcast('msal:notAuthorized', msalError);
                }
            })); //calling next.handle means we are passing control to next interceptor in chain
        }
    }
}
