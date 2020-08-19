import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MsalService } from './msal.service';
import { Injectable } from '@angular/core';

@Injectable()
export class MsalGuard implements CanActivate {
    constructor( private authService: MsalService) {}

    private loginInteractively(): Promise<boolean> {
        return this.authService.loginPopup()
            .then(() => true)
            .catch(() => false);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        if (!this.authService.getAllAccounts().length) {
            return this.loginInteractively();
        }

        const loginHint = this.authService.getAllAccounts()[0].username;

        return this.authService.ssoSilent({loginHint, scopes: []})
            .then(() => true)
            .catch(() => this.loginInteractively());
    }

}
