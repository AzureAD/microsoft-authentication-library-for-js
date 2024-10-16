/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Injectable, Inject } from "@angular/core";
import { Location } from "@angular/common";
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from "@angular/router";
import {
  InteractionType,
  BrowserConfigurationAuthError,
  BrowserUtils,
  UrlString,
  PopupRequest,
  RedirectRequest,
  AuthenticationResult,
  InteractionStatus,
} from "@azure/msal-browser";
import { Observable, of } from "rxjs";
import { concatMap, catchError, map, filter, take } from "rxjs/operators";
import { MsalService } from "./msal.service";
import { MsalGuardConfiguration } from "./msal.guard.config";
import { MsalBroadcastService } from "./msal.broadcast.service";
import { MSAL_GUARD_CONFIG } from "./constants";

@Injectable()
export class MsalGuard {
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
    const baseUrl = this.location.normalize(
      baseElements.length ? baseElements[0].href : window.location.origin
    );

    // Path of page (including hash, if using hash routing)
    const pathUrl = this.location.prepareExternalUrl(path);

    // Hash location strategy
    if (pathUrl.startsWith("#")) {
      this.authService
        .getLogger()
        .verbose("Guard - destination by hash routing");
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
    const authRequest =
      typeof this.msalGuardConfig.authRequest === "function"
        ? this.msalGuardConfig.authRequest(this.authService, state)
        : { ...this.msalGuardConfig.authRequest };
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.authService.getLogger().verbose("Guard - logging in by popup");
      return this.authService.loginPopup(authRequest as PopupRequest).pipe(
        map((response: AuthenticationResult) => {
          this.authService
            .getLogger()
            .verbose(
              "Guard - login by popup successful, can activate, setting active account"
            );
          this.authService.instance.setActiveAccount(response.account);
          return true;
        })
      );
    }

    this.authService.getLogger().verbose("Guard - logging in by redirect");
    const redirectStartPage = this.getDestinationUrl(state.url);
    return this.authService
      .loginRedirect({
        redirectStartPage,
        ...authRequest,
      } as RedirectRequest)
      .pipe(map(() => false));
  }

  /**
   * Helper which checks for the correct interaction type, prevents page with Guard to be set as redirect, and calls handleRedirectObservable
   * @param state
   */
  private activateHelper(
    state?: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    if (
      this.msalGuardConfig.interactionType !== InteractionType.Popup &&
      this.msalGuardConfig.interactionType !== InteractionType.Redirect
    ) {
      throw new BrowserConfigurationAuthError(
        "invalid_interaction_type",
        "Invalid interaction type provided to MSAL Guard. InteractionType.Popup or InteractionType.Redirect must be provided in the MsalGuardConfiguration"
      );
    }
    this.authService.getLogger().verbose("MSAL Guard activated");

    /*
     * If a page with MSAL Guard is set as the redirect for acquireTokenSilent,
     * short-circuit to prevent redirecting or popups.
     */
    if (typeof window !== "undefined") {
      if (
        UrlString.hashContainsKnownProperties(window.location.hash) &&
        BrowserUtils.isInIframe() &&
        !this.authService.instance.getConfiguration().system
          .allowRedirectInIframe
      ) {
        this.authService
          .getLogger()
          .warning(
            "Guard - redirectUri set to page with MSAL Guard. It is recommended to not set redirectUri to a page that requires authentication."
          );
        return of(false);
      }
    } else {
      this.authService
        .getLogger()
        .info(
          "Guard - window is undefined, MSAL does not support server-side token acquisition"
        );
      return of(true);
    }

    /**
     * If a loginFailedRoute is set in the config, set this as the loginFailedRoute
     */
    if (this.msalGuardConfig.loginFailedRoute) {
      this.loginFailedRoute = this.parseUrl(
        this.msalGuardConfig.loginFailedRoute
      );
    }

    // Capture current path before it gets changed by handleRedirectObservable
    const currentPath = this.location.path(true);

    return this.authService.initialize().pipe(
      concatMap(() => {
        return this.authService.handleRedirectObservable();
      }),
      concatMap(() => {
        if (!this.msalGuardConfig.enableCheckForExpiredToken) {
          return of(!this.authService.instance.getAllAccounts().length);
        } else {
          return this.isTokenStillValidForActiveAccountRefreshIfPossible(
            state
          ).pipe(map((validToken) => !validToken));
        }
      }),
      concatMap((requireLogin) => {
        if (requireLogin) {
          if (state) {
            this.authService
              .getLogger()
              .verbose(
                "Guard - no accounts retrieved, log in required to activate"
              );
            return this.loginInteractively(state);
          }
          this.authService
            .getLogger()
            .verbose("Guard - no accounts retrieved, no state, cannot load");
          return of(false);
        }

        if (!this.msalGuardConfig.enableCheckForExpiredToken) {
          this.authService
            .getLogger()
            .verbose("Guard - at least 1 account exists, can activate or load");
        }

        if (!!this.msalGuardConfig.enableCheckForExpiredToken) {
          this.authService
            .getLogger()
            .verbose(
              "Guard - active account has a valid token, can activate or load"
            );
        }

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
          const fragmentContainsCode: boolean =
            !!state.root &&
            !!state.root.fragment &&
            this.includesCode(`#${state.root.fragment}`);
          const hashRouting: boolean =
            this.location.prepareExternalUrl(state.url).indexOf("#") === 0;

          // Ensure code parameter is in fragment (and not in query parameter), or that hash hash routing is used
          if (urlContainsCode && (fragmentContainsCode || hashRouting)) {
            this.authService
              .getLogger()
              .info(
                "Guard - Hash contains known code response, stopping navigation."
              );

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
        this.authService
          .getLogger()
          .error("Guard - error while logging in, unable to activate");
        this.authService
          .getLogger()
          .errorPii(`Guard - error: ${error.message}`);
        /**
         * If a loginFailedRoute is set, checks to see if state is passed before returning route
         */
        if (this.loginFailedRoute && state) {
          this.authService
            .getLogger()
            .verbose("Guard - loginFailedRoute set, redirecting");
          return of(this.loginFailedRoute);
        }
        return of(false);
      })
    );
  }

  includesCode(path: string): boolean {
    return (
      (path.lastIndexOf("/code") > -1 &&
        path.lastIndexOf("/code") === path.length - "/code".length) || // path.endsWith("/code")
      path.indexOf("#code=") > -1 ||
      path.indexOf("&code=") > -1
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    this.authService.getLogger().verbose("Guard - canActivate");
    return this.activateHelper(state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    this.authService.getLogger().verbose("Guard - canActivateChild");
    return this.activateHelper(state);
  }

  canMatch(): Observable<boolean | UrlTree> {
    this.authService.getLogger().verbose("Guard - canLoad");
    return this.activateHelper();
  }

  /*
   * will return false if no active account or token expired and silent refresh failed
   * will return true if we have a non expired token
   */
  isTokenStillValidForActiveAccountRefreshIfPossible(
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const activeAccount = this.authService.instance.getActiveAccount();

    if (!activeAccount) {
      return of(false);
    }

    const now = Math.round(Date.now() / 1000);
    const expiration = <number>activeAccount.idTokenClaims?.["exp"];

    const expired =
      now + (this.msalGuardConfig.minimumSecondsBeforeTokenExpiration ?? 0) >
      expiration;

    if (!expired) {
      return of(true);
    } else {
      if (!this.msalGuardConfig.silentAuthRequest) {
        return of(false);
      }
      this.authService
        .getLogger()
        .info(
          "Guard - token for active account is expired. Initiating silent refresh"
        );
      const silentRequest =
        typeof this.msalGuardConfig.silentAuthRequest === "function"
          ? this.msalGuardConfig.silentAuthRequest(this.authService, state)
          : { ...this.msalGuardConfig.silentAuthRequest };

      return this.msalBroadcastService.inProgress$.pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        take(1),
        concatMap(() => {
          return this.authService.acquireTokenSilent(silentRequest);
        }),
        map((authResult) => {
          if (!!authResult.accessToken) {
            this.authService
              .getLogger()
              .info("Guard - silent refresh succeeded");
            return true;
          } else {
            this.authService
              .getLogger()
              .warning("Guard - silent refresh did not return a token");
            return false;
          }
        }),
        catchError((err) => {
          this.authService
            .getLogger()
            .warning(
              `Guard - silent refresh failed. Reporting no valid token. error: ${JSON.stringify(
                err
              )}`
            );
          return of(false);
        })
      );
    }
  }
}
