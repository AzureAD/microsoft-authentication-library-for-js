import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MsalService } from './msal.service';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class MsalGuard implements CanActivate {
    constructor( private authService: MsalService) {}

    private loginInteractively():  Observable<boolean> {
        return this.authService.loginPopup()
            .pipe(
                map(() => true),
                catchError(() => from([false]))
            )
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
        if (!this.authService.getAllAccounts().length) {
            return this.loginInteractively();
        }

        const loginHint = this.authService.getAllAccounts()[0].username;

        return this.authService.ssoSilent({loginHint, scopes: []})
            .pipe(
                map(() => true),
                catchError(() => this.loginInteractively())
            )
    }

}
