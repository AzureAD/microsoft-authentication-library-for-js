"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var Observable_1 = require("rxjs/Observable");
require("rxjs/add/observable/fromPromise");
require("rxjs/add/operator/mergeMap");
var MsalInterceptor = /** @class */ (function () {
    function MsalInterceptor(auth, broadcastService) {
        this.auth = auth;
        this.broadcastService = broadcastService;
    }
    MsalInterceptor.prototype.intercept = function (req, next) {
        var scopes = this.auth.getScopeForEndpoint_(req.url);
        // this.auth.verbose('Url: ' + config.url + ' maps to resource: ' + resource);
        if (scopes === null) {
            return next.handle(req);
        }
        var tokenStored = this.auth.getCachedToken_(scopes);
        if (tokenStored && tokenStored.token) {
            req = req.clone({
                setHeaders: {
                    Authorization: "Bearer " + tokenStored.token,
                }
            });
            return next.handle(req);
        }
        else {
            return Observable_1.Observable.fromPromise(this.auth.acquireTokenSilent(scopes).then(function (token) {
                var JWT = "Bearer " + token;
                return req.clone({
                    setHeaders: {
                        Authorization: JWT,
                    },
                });
            })).mergeMap(function (req) { return next.handle(req); }); //calling next.handle means we are passing control to next interceptor in chain
        }
    };
    MsalInterceptor = __decorate([
        core_1.Injectable()
    ], MsalInterceptor);
    return MsalInterceptor;
}());
exports.MsalInterceptor = MsalInterceptor;
