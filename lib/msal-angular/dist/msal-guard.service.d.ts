import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { MsalService } from "./msal.service";
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/pairwise';
import { Location, PlatformLocation } from "@angular/common";
import { MsalConfig } from "./msal-config";
import { BroadcastService } from "./broadcast.service";
export declare class MsalGuard implements CanActivate {
    private config;
    private authService;
    private router;
    private activatedRoute;
    private location;
    private platformLocation;
    private broadcastService;
    constructor(config: MsalConfig, authService: MsalService, router: Router, activatedRoute: ActivatedRoute, location: Location, platformLocation: PlatformLocation, broadcastService: BroadcastService);
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean>;
    private getBaseUrl;
    isEmpty: (str: any) => boolean;
}
