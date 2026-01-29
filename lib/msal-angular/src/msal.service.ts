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

  initialize(): Observable<void> {
    return from(this.instance.initialize());
  }
  acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult> {
    return from(this.instance.acquireTokenPopup(request));
  }
  acquireTokenRedirect(request: RedirectRequest): Observable<void> {
    return from(this.instance.acquireTokenRedirect(request));
  }
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

    return from(
      this.instance
        .initialize()
        .then(() =>
          this.instance.handleRedirectPromise({
            ...options,
            hash: options.hash || this.redirectHash,
          })
        )
        .finally(() => {
          // update inProgress state to none
          this.injector.get(MsalBroadcastService).resetInProgressEvent();
        })
    );
  }
  loginPopup(request?: PopupRequest): Observable<AuthenticationResult> {
    return from(this.instance.loginPopup(request));
  }
  loginRedirect(request?: RedirectRequest): Observable<void> {
    return from(this.instance.loginRedirect(request));
  }
  logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void> {
    return from(this.instance.logoutRedirect(logoutRequest));
  }
  logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void> {
    return from(this.instance.logoutPopup(logoutRequest));
  }
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
  // Create a logger instance for msal-angular with the same options as msal-browser
  setLogger(logger: Logger): void {
    this.logger = logger.clone(name, version);
    this.instance.setLogger(logger);
  }
}
