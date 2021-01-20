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
import { MSAL_INSTANCE } from "./constants";
import { Observable, from } from "rxjs";
import { IMsalService } from "./IMsalService";
import { name, version } from "./version.json";

@Injectable()
export class MsalService implements IMsalService {
    private redirectHash: string;
    private logger: Logger;

    constructor(
        @Inject(MSAL_INSTANCE) public instance: IPublicClientApplication,
        private location: Location
    ) {
        const hash = this.location.path(true).split("#").pop();
        if (hash) {
            this.redirectHash = `#${hash}`;
        }
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
    getLogger(): Logger {
        if (!this.logger) {
            this.logger = this.instance.getLogger().clone(name, version);
        }
        return this.logger;
    }
    setLogger(logger: Logger): void {
        this.logger = logger.clone(name, version);
        this.instance.setLogger(logger);
    }

}
