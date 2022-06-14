/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild, CanLoad, UrlTree, Router } from "@angular/router";
import { MsalService } from "./msal.service";
import { Injectable, Inject, VERSION } from "@angular/core";
import { Location } from "@angular/common";
import { InteractionType, BrowserConfigurationAuthError, BrowserUtils, UrlString, PopupRequest, RedirectRequest, AuthenticationResult } from "@azure/msal-browser";
import { MsalGuardConfiguration } from "./msal.guard.config";
import { MSAL_GUARD_CONFIG } from "./constants";
import { concatMap, catchError, map } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { MsalBroadcastService } from "./msal.broadcast.service";

@Injectable()
export class MsalGuard implements CanActivate, CanActivateChild, CanLoad {
    private loginFailedRoute?: UrlTree;

    constructor(
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        private msalBroadcastService: MsalBroadcastService,
        private authService: MsalService,
        private location: Location,
        private router: Router
    ) { 
        // Subscribing so events in MsalGuard will set inProgress$ observable
        this.msalBroadcastService.inProgress$.subscribe();
    }

    /**
     * Parses url string to UrlTree
     * @param url 
     */
    parseUrl(url: string): UrlTree {
        return this.router.parseUrl(url);
    }

    /**
     * Builds the absolute url for the destination page
     * @param path Relative path of requested page
     * @returns Full destination url
     */
    getDestinationUrl(path: string): string {
        this.authService.getLogger().verbose("Guard - getting destination url");
        // Absolute base url for the application (default to origin if base element not present)
        const baseElements = document.getElementsByTagName("base");
        const baseUrl = this.location.normalize(baseElements.length ? baseElements[0].href : window.location.origin);

        // Path of page (including hash, if using hash routing)
        const pathUrl = this.location.prepareExternalUrl(path);

        // Hash location strategy
        if (pathUrl.startsWith("#")) {
            this.authService.getLogger().verbose("Guard - destination by hash routing");
            return `${baseUrl}/${pathUrl}`;
        }

        /*
         * If using path location strategy, pathUrl will include the relative portion of the base path (e.g. /base/page).
         * Since baseUrl also includes /base, can just concatentate baseUrl + path
         */
        return `${baseUrl}${path}`;
    }

    /**
     * Interactively prompt the user to login
     * @param url Path of the requested page
     */
    private loginInteractively(state: RouterStateSnapshot): Observable<boolean> {
        const authRequest = typeof this.msalGuardConfig.authRequest === "function"
            ? this.msalGuardConfig.authRequest(this.authService, state)
            : { ...this.msalGuardConfig.authRequest };
        if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            this.authService.getLogger().verbose("Guard - logging in by popup");
            return this.authService.loginPopup(authRequest as PopupRequest)
                .pipe(
                    map((response: AuthenticationResult) => {
                        this.authService.getLogger().verbose("Guard - login by popup successful, can activate, setting active account");
                        this.authService.instance.setActiveAccount(response.account);
                        return true;
                    })
                );
        }

        this.authService.getLogger().verbose("Guard - logging in by redirect");
        const redirectStartPage = this.getDestinationUrl(state.url);
        return this.authService.loginRedirect({
            redirectStartPage,
            ...authRequest
        } as RedirectRequest)
            .pipe(
                map(() => false)
            );
    }

    /**
     * Helper which checks for the correct interaction type, prevents page with Guard to be set as reidrect, and calls handleRedirectObservable
     * @param state 
     */
    private activateHelper(state?: RouterStateSnapshot): Observable<boolean|UrlTree> {
        if (this.msalGuardConfig.interactionType !== InteractionType.Popup && this.msalGuardConfig.interactionType !== InteractionType.Redirect) {
            throw new BrowserConfigurationAuthError("invalid_interaction_type", "Invalid interaction type provided to MSAL Guard. InteractionType.Popup or InteractionType.Redirect must be provided in the MsalGuardConfiguration");
        }
        this.authService.getLogger().verbose("MSAL Guard activated");

        /*
         * If a page with MSAL Guard is set as the redirect for acquireTokenSilent,
         * short-circuit to prevent redirecting or popups.
         */
        if (typeof window !== "undefined") {
            if (UrlString.hashContainsKnownProperties(window.location.hash) && BrowserUtils.isInIframe() && !this.authService.instance.getConfiguration().system.allowRedirectInIframe) {
                this.authService.getLogger().warning("Guard - redirectUri set to page with MSAL Guard. It is recommended to not set redirectUri to a page that requires authentication.");
                return of(false);
            }
        } else {
            this.authService.getLogger().info("Guard - window is undefined, MSAL does not support server-side token acquisition");
            return of(true);
        }

        /**
         * If a loginFailedRoute is set in the config, set this as the loginFailedRoute
         */
        if (this.msalGuardConfig.loginFailedRoute) {
            this.loginFailedRoute = this.parseUrl(this.msalGuardConfig.loginFailedRoute);
        }

        // Capture current path before it gets changed by handleRedirectObservable
        const currentPath = this.location.path(true);

        return this.authService.handleRedirectObservable()
            .pipe(
                concatMap(() => {
                    if (!this.authService.instance.getAllAccounts().length) {
                        if (state) {
                            this.authService.getLogger().verbose("Guard - no accounts retrieved, log in required to activate");
                            return this.loginInteractively(state);
                        } 
                        this.authService.getLogger().verbose("Guard - no accounts retrieved, no state, cannot load");
                        return of(false);
                    }

                    this.authService.getLogger().verbose("Guard - at least 1 account exists, can activate or load");

                    // Prevent navigating the app to /#code= or /code=
                    if (state) {
                        /*
                         * Path routing:
                         * state.url: /#code=...
                         * state.root.fragment: code=...
                         */

                        /*
                         * Hash routing:
                         * state.url: /code
                         * state.root.fragment: null
                         */
                        const urlContainsCode: boolean = this.includesCode(state.url);
                        const fragmentContainsCode: boolean = !!state.root && !!state.root.fragment && this.includesCode(`#${state.root.fragment}`);
                        const hashRouting: boolean = this.location.prepareExternalUrl(state.url).indexOf("#") === 0;

                        // Ensure code parameter is in fragment (and not in query parameter), or that hash hash routing is used
                        if (urlContainsCode && (fragmentContainsCode || hashRouting)) {
                            this.authService.getLogger().info("Guard - Hash contains known code response, stopping navigation.");
                            
                            // Path routing (navigate to current path without hash)
                            if (currentPath.indexOf("#") > -1) {
                                return of(this.parseUrl(this.location.path()));
                            }
                            
                            // Hash routing (navigate to root path)
                            return of(this.parseUrl(""));
                        }
                    }

                    return of(true);

                }),
                catchError((error: Error) => {
                    this.authService.getLogger().error("Guard - error while logging in, unable to activate");
                    this.authService.getLogger().errorPii(`Guard - error: ${error.message}`);
                    /**
                     * If a loginFailedRoute is set, checks to see if Angular 10+ is used and state is passed in before returning route
                     * Apps using Angular 9 will receive of(false) in canLoad interface, as it does not support UrlTree return types
                     */
                    if (this.loginFailedRoute && parseInt(VERSION.major, 10) > 9 && state) {
                        this.authService.getLogger().verbose("Guard - loginFailedRoute set, redirecting");
                        return of(this.loginFailedRoute);
                    }
                    return of(false);
                })
            );
    }

    includesCode(path: string): boolean {
        return (path.lastIndexOf("/code") > -1 &&
            path.lastIndexOf("/code") === path.length - "/code".length) || // path.endsWith("/code")
            path.indexOf("#code=") > -1 || 
            path.indexOf("&code=") > -1;
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean|UrlTree> {
        this.authService.getLogger().verbose("Guard - canActivate");
        return this.activateHelper(state);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean|UrlTree> {
        this.authService.getLogger().verbose("Guard - canActivateChild");
        return this.activateHelper(state);
    }

    canLoad(): Observable<boolean> {
        this.authService.getLogger().verbose("Guard - canLoad");
        // @ts-ignore
        return this.activateHelper();
    }
}
