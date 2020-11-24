/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable } from "@angular/core";
import { Location } from "@angular/common";
import {
    IPublicClientApplication,
    EndSessionRequest,
    AuthenticationResult,
    RedirectRequest,
    SilentRequest,
    PopupRequest,
    SsoSilentRequest,
    Logger
} from "@azure/msal-browser";
import { MSAL_INSTANCE, MSAL_LOGGER_CONFIG } from "./constants";
import { Observable, from } from "rxjs";
import { IMsalService } from "./IMsalService";
import { MsalLoggerConfiguration } from "./msal.logger.config";
import { name, version } from "./../package.json";

@Injectable()
export class MsalService implements IMsalService {
    private redirectHash: string;
    public logger: Logger;

    constructor(
        @Inject(MSAL_INSTANCE) public instance: IPublicClientApplication,
        @Inject(MSAL_LOGGER_CONFIG) private msalLoggerConfig: MsalLoggerConfiguration,
        private location: Location
    ) {
        const hash = this.location.path(true).split("#").pop();
        if (hash) {
            this.redirectHash = `#${hash}`;
        }
        this.logger = new Logger(this.msalLoggerConfig, name, version);
    }

    acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult> {
        return from(this.instance.acquireTokenPopup(request));
    }
    acquireTokenRedirect(request: RedirectRequest): Observable<void> {
        return from(this.instance.acquireTokenRedirect(request));
    }
    acquireTokenSilent(silentRequest: SilentRequest): Observable<AuthenticationResult> {
        return from(this.instance.acquireTokenSilent(silentRequest));
    }
    handleRedirectObservable(): Observable<AuthenticationResult> {
        const handleRedirect = from(this.instance.handleRedirectPromise(this.redirectHash));
        this.redirectHash = "";
        return handleRedirect;
    }
    loginPopup(request?: PopupRequest): Observable<AuthenticationResult> {
        return from(this.instance.loginPopup(request));
    }
    loginRedirect(request?: RedirectRequest): Observable<void> {
        return from(this.instance.loginRedirect(request));
    }
    logout(logoutRequest?: EndSessionRequest): Observable<void> {
        return from(this.instance.logout(logoutRequest));
    }
    ssoSilent(request: SsoSilentRequest): Observable<AuthenticationResult> {
        return from(this.instance.ssoSilent(request));
    }

}
