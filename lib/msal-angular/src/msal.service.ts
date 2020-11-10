/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable } from "@angular/core";
import { Location } from "@angular/common";
import {
    IPublicClientApplication,
    AccountInfo,
    EndSessionRequest,
    AuthorizationUrlRequest,
    AuthenticationResult,
    PopupRequest,
    RedirectRequest,
    SilentRequest
} from "@azure/msal-browser";
import { MSAL_INSTANCE } from "./constants";
import { Observable, from } from "rxjs";
import { IMsalService } from "./IMsalService";

@Injectable()
export class MsalService implements IMsalService {
    private redirectHash: string;

    constructor(
        @Inject(MSAL_INSTANCE) public instance: IPublicClientApplication,
        private location: Location
    ) {
        const hash = this.location.path(true).split("#").pop();
        if (hash) {
            this.redirectHash = `#${hash}`;
        }
    }

    acquireTokenPopup(request: AuthorizationUrlRequest): Observable<AuthenticationResult> {
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
    loginPopup(request?: AuthorizationUrlRequest): Observable<AuthenticationResult> {
        return from(this.instance.loginPopup(request));
    }
    loginRedirect(request?: RedirectRequest): Observable<void> {
        return from(this.instance.loginRedirect(request));
    }
    logout(logoutRequest?: EndSessionRequest): Observable<void> {
        return from(this.instance.logout(logoutRequest));
    }
    ssoSilent(request: AuthorizationUrlRequest): Observable<AuthenticationResult> {
        return from(this.instance.ssoSilent(request));
    }

}
