
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
import {MsalConfig} from "./msal-config";
import {BroadcastService} from "./broadcast.service";
import {Constants} from "../../msal-core/lib-commonjs/Constants";

@Injectable()
export class MsalGuard implements CanActivate  {

    private activatedRoute1: ActivatedRoute;
  constructor( @Inject(MSAL_CONFIG) private config:MsalConfig , private authService : MsalService, private router: Router , private activatedRoute: ActivatedRoute, private location : Location , private platformLocation: PlatformLocation, private broadcastService : BroadcastService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
      this.authService.get_logger().verbose("location change event from old url to new url");

        this.authService.updateDataFromCache([this.config.clientID]);
        if (!this.authService._oauthData.isAuthenticated && !this.authService._oauthData.userName) {
            if (state.url) {

                if (!this.authService._renewActive && !this.authService.login_in_progress()) {

                    var loginStartPage = this.getBaseUrl() + state.url;
                    if (loginStartPage !== null) {
                        this.authService.getCacheStorage().setItem(Constants.angularLoginRequest, loginStartPage);
                    }
                    if(this.config.popUp) {
                        return new Promise((resolve, reject) => {
                            this.authService.login_popup(this.config.scopes , this.config.extraQueryParameters).then(function (token) {
                                resolve(true);
                            }, function (error) {
                                reject(false);
                            })
                        });
                    }
                    else {
                        this.authService.login_redirect(this.config.scopes, this.config.extraQueryParameters);
                    }
                }
            }
        }
        //token is expired/deleted but userdata still exists in _oauthData object
        else if (!this.authService._oauthData.isAuthenticated && this.authService._oauthData.userName) {
            this.authService.acquireTokenSilent([this.config.clientID]).then( (token: any) => {
                if (token) {
                    this.authService._oauthData.isAuthenticated = true;
                    this.broadcastService.broadcast("msal:loginSuccess", token);
                }
            },  (error: any) => {
                var errorParts = error.split("|");
                this.broadcastService.broadcast("msal:loginFailure", {errorParts});
            });
        }
        else {
            return true;
        }
    }

    private getBaseUrl(): String {
        var tempBaseUrl = this.platformLocation.getBaseHrefFromDOM();
        var currentAbsoluteUrl = window.location.href;
        var currentRelativeUrl = this.router.url;
        var index = currentAbsoluteUrl.indexOf(currentRelativeUrl);
        return currentAbsoluteUrl.substring(0, index);
    }

}
