import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/mergeMap'
import {MsalService} from "./msal.service";
import {BroadcastService} from "./broadcast.service";

@Injectable()
export class MsalInterceptor implements HttpInterceptor {

    constructor(private auth: MsalService ,  private broadcastService: BroadcastService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        var scopes = this.auth.get_scopes_for_endpoint(req.url);
        this.auth.verbose('Url: ' + req.url + ' maps to scopes: ' + scopes);
        if (scopes === null) {
            return next.handle(req);
        }
        var tokenStored = this.auth.getCached_token(scopes);
        if (tokenStored && tokenStored.token) {

          req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${tokenStored.token}`,
                }
            });
            return next.handle(req);

        }
        else {
            return Observable.fromPromise(this.auth.acquireTokenSilent(scopes).then(token => {
                const JWT = `Bearer ${token}`;
                return req.clone({
                    setHeaders: {
                        Authorization: JWT,
                    },
                });
            })).mergeMap(req => next.handle(req)); //calling next.handle means we are passing control to next interceptor in chain
        }
    }
}
