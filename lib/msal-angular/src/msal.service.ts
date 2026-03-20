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
  AccountInfo,
} from "@azure/msal-browser";
import { EMPTY, Observable, from, of } from "rxjs";
import { IMsalService } from "./IMsalService";
import { name, version } from "./packageMetadata";
import { MSAL_INSTANCE } from "./constants";
import { MsalBroadcastService } from "./msal.broadcast.service";

@Injectable()
export class MsalService implements IMsalService {
  private redirectHash: string;
  private logger: Logger;
  public initialized: boolean = false;
  private initializePromise: Promise<void> = null;

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

  private _initialize(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }
    this.initializePromise = this.instance.initialize().then(() => {
      this.initialized = true;
      this.initializePromise = null;
    });
    return this.initializePromise;
  }

  initialize(): Observable<void> {
    if (this.initialized) {
      return EMPTY;
    }
    if (!this.initializePromise) {
      this._initialize();
    }
    return from(this.initializePromise);
  }
  acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.acquireTokenPopup(request)));
    }
    return from(this.instance.acquireTokenPopup(request));
  }
  acquireTokenRedirect(request: RedirectRequest): Observable<void> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.acquireTokenRedirect(request)));
    }
    return from(this.instance.acquireTokenRedirect(request));
  }
  acquireTokenSilent(
    silentRequest: SilentRequest
  ): Observable<AuthenticationResult> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.acquireTokenSilent(silentRequest)));
    }
    return from(this.instance.acquireTokenSilent(silentRequest));
  }
  handleRedirectObservable(hash?: string): Observable<AuthenticationResult> {
    return from(
      this._initialize()
        .then(() =>
          this.instance.handleRedirectPromise(hash || this.redirectHash)
        )
        .finally(() => {
          // update inProgress state to none
          this.injector.get(MsalBroadcastService).resetInProgressEvent();
        })
    );
  }
  loginPopup(request?: PopupRequest): Observable<AuthenticationResult> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.loginPopup(request)));
    }
    return from(this.instance.loginPopup(request));
  }
  loginRedirect(request?: RedirectRequest): Observable<void> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.loginRedirect(request)));
    }
    return from(this.instance.loginRedirect(request));
  }
  // @deprecated: Use logoutRedirect or logoutPopup
  logout(logoutRequest?: EndSessionRequest): Observable<void> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.logout(logoutRequest)));
    }
    return from(this.instance.logout(logoutRequest));
  }
  logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.logoutRedirect(logoutRequest)));
    }
    return from(this.instance.logoutRedirect(logoutRequest));
  }
  logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.logoutPopup(logoutRequest)));
    }
    return from(this.instance.logoutPopup(logoutRequest));
  }
  ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.ssoSilent(request)));
    }
    return from(this.instance.ssoSilent(request));
  }
  getActiveAccount(): Observable<AccountInfo> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.getActiveAccount()));
    }
    return of(this.instance.getActiveAccount());
  }
  getAllAccounts(): Observable<AccountInfo[]> {
    if (!this.initialized) {
      return from(this._initialize().then(() => this.instance.getAllAccounts()));
    }
    return of(this.instance.getAllAccounts());
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
