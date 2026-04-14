/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable, Injector } from "@angular/core";
import { Location } from "@angular/common";
import {
  IPublicClientApplication,
  EndSessionRequest,
  EndSessionPopupRequest,
  AuthenticationResult,
  RedirectRequest,
  SilentRequest,
  PopupRequest,
  SsoSilentRequest,
  Logger,
  WrapperSKU,
  HandleRedirectPromiseOptions,
} from "@azure/msal-browser";
import { Observable, from } from "rxjs";
import { IMsalService } from "./IMsalService";
import { name, version } from "./packageMetadata";
import { MSAL_INSTANCE } from "./constants";
import { MsalBroadcastService } from "./msal.broadcast.service";

@Injectable()
export class MsalService implements IMsalService {
  private redirectHash: string;
  private logger: Logger;

  constructor(
    @Inject(MSAL_INSTANCE) public instance: IPublicClientApplication,
    private location: Location,
    private injector: Injector
  ) {
    const hash = this.location.path(true).split("#").pop();
    if (hash) {
      this.redirectHash = `#${hash}`;
    }
    this.instance.initializeWrapperLibrary(WrapperSKU.Angular, version);
  }

  /**
   * Initializes the underlying MSAL browser instance.
   */
  initialize(): Observable<void> {
    return from(this.instance.initialize());
  }

  /**
   * Acquires an access token interactively using a popup.
   *
   * @param request - Popup token request parameters.
   */
  acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult> {
    return from(this.instance.acquireTokenPopup(request));
  }

  /**
   * Acquires an access token interactively using a full-page redirect.
   *
   * @param request - Redirect token request parameters.
   */
  acquireTokenRedirect(request: RedirectRequest): Observable<void> {
    return from(this.instance.acquireTokenRedirect(request));
  }

  /**
   * Acquires an access token silently from cache or by using a refresh token.
   *
   * @param silentRequest - Silent token request parameters.
   */
  acquireTokenSilent(
    silentRequest: SilentRequest
  ): Observable<AuthenticationResult> {
    return from(this.instance.acquireTokenSilent(silentRequest));
  }
  /**
   * @deprecated Pass options object instead of hash string. Use handleRedirectObservable({ hash: "#..." }) instead.
   */
  handleRedirectObservable(
    hash: string
  ): Observable<AuthenticationResult | null>;
  /**
   * Handles the redirect response from authentication. Call this on every page load after a redirect-based login.
   * If no options are provided, the service will attempt to use the cached redirect hash captured during construction.
   *
   * @param options - Optional configuration for redirect handling, such as an explicit hash value to process.
   * @returns Observable that emits the AuthenticationResult when a redirect is successfully handled.
   */
  handleRedirectObservable(
    options?: HandleRedirectPromiseOptions
  ): Observable<AuthenticationResult | null>;
  handleRedirectObservable(
    hashOrOptions?: string | HandleRedirectPromiseOptions
  ): Observable<AuthenticationResult | null> {
    // Support both legacy string parameter (hash) and new options object
    const options: HandleRedirectPromiseOptions =
      typeof hashOrOptions === "string"
        ? { hash: hashOrOptions }
        : hashOrOptions || {};

    // Only include hash in the final options if there's a value
    const hash = options.hash || this.redirectHash;
    const finalOptions: HandleRedirectPromiseOptions = {
      ...options,
      ...(hash ? { hash } : {}),
    };

    return from(
      this.instance
        .initialize()
        .then(() => this.instance.handleRedirectPromise(finalOptions))
        .finally(() => {
          // update inProgress state to none
          this.injector.get(MsalBroadcastService).resetInProgressEvent();
        })
    );
  }

  /**
   * Signs in a user interactively using a popup.
   *
   * @param request - Optional popup login request parameters.
   */
  loginPopup(request?: PopupRequest): Observable<AuthenticationResult> {
    return from(this.instance.loginPopup(request));
  }

  /**
   * Signs in a user interactively using a full-page redirect.
   *
   * @param request - Optional redirect login request parameters.
   */
  loginRedirect(request?: RedirectRequest): Observable<void> {
    return from(this.instance.loginRedirect(request));
  }

  /**
   * Signs out a user by navigating to the identity provider logout endpoint.
   *
   * @param logoutRequest - Optional redirect logout request parameters.
   */
  logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void> {
    return from(this.instance.logoutRedirect(logoutRequest));
  }

  /**
   * Signs out a user using a popup window.
   *
   * @param logoutRequest - Optional popup logout request parameters.
   */
  logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void> {
    return from(this.instance.logoutPopup(logoutRequest));
  }

  /**
   * Performs a silent sign-in attempt using existing session information.
   *
   * @param request - Silent SSO request parameters.
   */
  ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult> {
    return from(this.instance.ssoSilent(request));
  }
  /**
   * Gets logger for msal-angular.
   * If no logger set, returns logger instance created with same options as msal-browser
   */
  getLogger(): Logger {
    if (!this.logger) {
      this.logger = this.instance.getLogger().clone(name, version);
    }
    return this.logger;
  }

  /**
   * Sets the logger for msal-angular and applies the same logger to msal-browser.
   *
   * @param logger - Logger instance to use.
   */
  setLogger(logger: Logger): void {
    this.logger = logger.clone(name, version);
    this.instance.setLogger(logger);
  }
}
