import {Inject, Injectable} from "@angular/core";
import {
    ActivatedRoute,
    ActivatedRouteSnapshot, CanActivate, Router,
    RouterStateSnapshot,
} from "@angular/router";
import {MSAL_CONFIG, MsalService} from "./msal.service";
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import {Location, PlatformLocation} from "@angular/common";
import {BroadcastService} from "./broadcast.service";
import { Configuration, AuthResponse, AuthError } from "msal";

@Injectable()
export class MsalGuard implements CanActivate {

    constructor(@Inject(MSAL_CONFIG) private msalConfig: Configuration, private authService: MsalService, private router: Router, private activatedRoute: ActivatedRoute, private location: Location, private platformLocation: PlatformLocation, private broadcastService: BroadcastService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        this.authService.getLogger().verbose("location change event from old url to new url");

        if (!this.authService.getAccount()) {
            if (this.msalConfig.framework.popUp) {
                return this.authService.loginPopup({
                    scopes: this.msalConfig.framework.consentScopes,
                    extraQueryParameters: this.msalConfig.framework.extraQueryParameters
                })
                    .then(() => true)
                    .catch(() => false);
            }

            this.authService.loginRedirect({
                scopes: this.msalConfig.framework.consentScopes,
                extraQueryParameters: this.msalConfig.framework.extraQueryParameters
            });
        } else {
            return this.authService.acquireTokenSilent({
                scopes: [this.msalConfig.auth.clientId]
            })
                .then((result: AuthResponse) => {
                    this.broadcastService.broadcast("msal:loginSuccess",  result);
                    return true;
                })
                .catch((error: AuthError) => {
                    this.broadcastService.broadcast("msal:loginFailure", error);
                    return false;
                });
        }

    }

}
