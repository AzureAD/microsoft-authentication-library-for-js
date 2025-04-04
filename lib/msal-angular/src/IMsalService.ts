/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
  AuthenticationResult,
  PopupRequest,
  RedirectRequest,
  SilentRequest,
  Logger,
  SsoSilentRequest,
  EndSessionRequest,
  EndSessionPopupRequest,
} from "@azure/msal-browser";
import { Observable } from "rxjs";

export interface IMsalService {
  initialize(): Observable<void>;
  acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult>;
  acquireTokenRedirect(request: RedirectRequest): Observable<void>;
  acquireTokenSilent(
    silentRequest: SilentRequest
  ): Observable<AuthenticationResult>;
  handleRedirectObservable(): Observable<AuthenticationResult | null>;
  loginPopup(request?: PopupRequest): Observable<AuthenticationResult>;
  loginRedirect(request?: RedirectRequest): Observable<void>;
  logoutRedirect(logoutRequest?: EndSessionRequest): Observable<void>;
  logoutPopup(logoutRequest?: EndSessionPopupRequest): Observable<void>;
  ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult>;
  getLogger(): Logger;
  setLogger(logger: Logger): void;
}
