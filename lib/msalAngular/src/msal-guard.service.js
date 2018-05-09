"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var msal_service_1 = require("./msal.service");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/pairwise");
var Constants_1 = require("../../msal-core/lib-commonjs/Constants");
var MsalGuard = /** @class */ (function () {
    function MsalGuard(config, authService, router, activatedRoute, location, platformLocation, broadcastService) {
        this.config = config;
        this.authService = authService;
        this.router = router;
        this.activatedRoute = activatedRoute;
        this.location = location;
        this.platformLocation = platformLocation;
        this.broadcastService = broadcastService;
    }
    /*
    canActivate( route: ActivatedRouteSnapshot ,state: RouterStateSnapshot)   {
        //msal.verbose ("location change event from old url to new url")
        if(!this.authService._oauthData.isAuthenticated)
      {
          if(state.url) {
          if(!this.authService._renewActive && !this.authService.loginInProgress()) {
                var tempBaseUrl = this.platformLocation.getBaseHrefFromDOM();
                // Resolve the base url as the full absolute url subtract the relative url.
                var currentAbsoluteUrl = window.location.href;
                var currentRelativeUrl = this.router.url;
                var index = currentAbsoluteUrl.indexOf(currentRelativeUrl);
                var baseUrl = currentAbsoluteUrl.substring(0, index);
                var toStateUrl = baseUrl + state.url;
                this.authService.loginHandler(toStateUrl );
            }
          }
      }
      else {
         return true;
      }
    }
  
  */
    //rohit's code
    /*
        canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
            //msal.verbose("location change event from old url to new url")
            if (!this.authService._oauthData.isAuthenticated) {
                if (state.url) {
                    if (!this.authService._renewActive && !this.authService.loginInProgress_()) {
                        var tempBaseUrl = this.platformLocation.getBaseHrefFromDOM();
                        // Resolve the base url as the full absolute url subtract the relative url.
                        var currentAbsoluteUrl = window.location.href;
                        var currentRelativeUrl = this.router.url;
                        var index = currentAbsoluteUrl.indexOf(currentRelativeUrl);
                        var baseUrl = currentAbsoluteUrl.substring(0, index);
                        var toStateUrl = baseUrl + state.url;
                        return new Promise((resolve, reject) => {
                            this.authService.loginHandler(toStateUrl).then(function (token) {
                                resolve(true);
                            }, function (error) {
                                reject(false);
                            })
                        });
                    }
                }
            }
            else {
                return true;
            }
        }
    */
    //my latest code
    MsalGuard.prototype.canActivate = function (route, state) {
        //  this.authService.getLogger().verbose("location change event from old url to new url");
        var _this = this;
        this.authService.updateDataFromCache([this.config.clientID]);
        if (!this.authService._oauthData.isAuthenticated && !this.authService._oauthData.userName) {
            if (state.url) {
                if (!this.authService._renewActive && !this.authService.loginInProgress_()) {
                    var loginStartPage = this.getBaseUrl() + state.url;
                    if (loginStartPage !== null) {
                        this.authService.getCacheStorage().setItem(Constants_1.Constants.angularLoginRequest, loginStartPage);
                    }
                    if (this.config.popUp) {
                        return new Promise(function (resolve, reject) {
                            _this.authService.loginPopups(_this.config.scopes, _this.config.extraQueryParameters).then(function (token) {
                                resolve(true);
                            }, function (error) {
                                reject(false);
                            });
                        });
                    }
                    else {
                        this.authService.loginRedirects(this.config.scopes, this.config.extraQueryParameters);
                    }
                }
            }
        }
        else if (!this.authService._oauthData.isAuthenticated && this.authService._oauthData.userName) {
            this.authService.acquireTokenSilent([this.config.clientID]).then(function (token) {
                if (token) {
                    _this.authService._oauthData.isAuthenticated = true;
                    _this.broadcastService.broadcast("msal:loginSuccess", token);
                }
            }, function (error) {
                var errorParts = error.split("|");
                _this.broadcastService.broadcast("msal:loginFailure", { errorParts: errorParts });
            });
        }
        else {
            return true;
        }
    };
    MsalGuard.prototype.getBaseUrl = function () {
        var tempBaseUrl = this.platformLocation.getBaseHrefFromDOM();
        // Resolve the base url as the full absolute url subtract the relative url.
        var currentAbsoluteUrl = window.location.href;
        var currentRelativeUrl = this.router.url;
        var index = currentAbsoluteUrl.indexOf(currentRelativeUrl);
        return currentAbsoluteUrl.substring(0, index);
    };
    MsalGuard = __decorate([
        core_1.Injectable(),
        __param(0, core_1.Inject(msal_service_1.MSAL_CONFIG))
    ], MsalGuard);
    return MsalGuard;
}());
exports.MsalGuard = MsalGuard;
