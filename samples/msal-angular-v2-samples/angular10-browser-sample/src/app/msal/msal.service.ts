import { Inject, Injectable } from "@angular/core";
import {
    IPublicClientApplication,
    AccountInfo,
    EndSessionRequest,
    AuthorizationUrlRequest,
    AuthenticationResult,
    PopupRequest,
    RedirectRequest,
    SilentRequest,
    AuthError, BroadcastEvent
} from "@azure/msal-browser";
import { MSAL_INSTANCE } from "./constants";
import { Observable, from } from 'rxjs';
import { BrowserBroadcastService } from './msal.broadcast.service';

interface IMsalService {
    acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Observable<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Observable<AuthenticationResult>;
    getAccountByUsername(userName: string): AccountInfo | null;
    getAllAccounts(): AccountInfo[];
    handleRedirectObservable(): Observable<AuthenticationResult | null>;
    loginPopup(request?: PopupRequest): Observable<AuthenticationResult>;
    loginRedirect(request?: RedirectRequest): Observable<void>;
    logout(logoutRequest?: EndSessionRequest): Observable<void>;
    ssoSilent(request: AuthorizationUrlRequest): Observable<AuthenticationResult>;
}

@Injectable()
export class MsalService implements IMsalService {

    constructor(
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
        private browserBroadcastService: BrowserBroadcastService
    ) {}

    acquireTokenPopup(request: AuthorizationUrlRequest): Observable<AuthenticationResult> {
        return from(
            this.msalInstance.acquireTokenPopup(request)
                .then((authResponse) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_SUCCESS, authResponse);
                    return authResponse;
                })
                .catch((error: AuthError) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_FAILURE, error);
                    throw error;
                })
        );
    }
    acquireTokenRedirect(request: RedirectRequest): Observable<void> {
        this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_START, null);
        return from(this.msalInstance.acquireTokenRedirect(request));
    }
    acquireTokenSilent(silentRequest: SilentRequest): Observable<AuthenticationResult> {
        return from(
            this.msalInstance.acquireTokenSilent(silentRequest)
                .then((authResponse: AuthenticationResult) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_SUCCESS, authResponse);
                    return authResponse;
                })
                .catch((error: AuthError) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_FAILURE, error);
                    throw error;
                })
        );
    }
    getAccountByUsername(userName: string): AccountInfo {
        return this.msalInstance.getAccountByUsername(userName);
    }
    getAllAccounts(): AccountInfo[] {
        return this.msalInstance.getAllAccounts();
    }
    handleRedirectObservable(): Observable<AuthenticationResult> {
        this.browserBroadcastService.broadcast(BroadcastEvent.HANDLE_REDIRECT_START, null);
        const loggedInAccounts = this.msalInstance.getAllAccounts();
        return from(
            this.msalInstance.handleRedirectPromise()
                .then((authResponse: AuthenticationResult) => {
                    if (authResponse) {
                        const loggedInAccount = loggedInAccounts.find((account) => account.username === authResponse.account.username);
                        if (loggedInAccount) {
                            this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_SUCCESS, authResponse);
                        } else {
                            this.browserBroadcastService.broadcast(BroadcastEvent.LOGIN_SUCCESS, authResponse);
                        }
                    }
                    return authResponse;
                })
                .catch((error: AuthError) => {
                    if (this.getAllAccounts().length > 0) {
                        this.browserBroadcastService.broadcast(BroadcastEvent.ACQUIRE_TOKEN_FAILURE, error);
                    } else {
                        this.browserBroadcastService.broadcast(BroadcastEvent.LOGIN_FAILURE, error);
                    }
                    throw error;
                })

        );
    }
    loginPopup(request?: AuthorizationUrlRequest): Observable<AuthenticationResult> {
        return from(
            this.msalInstance.loginPopup(request)
                .then((authResponse: AuthenticationResult) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.LOGIN_SUCCESS, authResponse);
                    return authResponse;
                })
                .catch((error: AuthError) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.LOGIN_FAILURE, error);
                    throw error;
                })
        );
    }
    loginRedirect(request?: RedirectRequest): Observable<void> {
        return from(this.msalInstance.loginRedirect(request));
    }
    logout(logoutRequest?: EndSessionRequest): Observable<void> {
        return from(this.msalInstance.logout(logoutRequest));
    }
    ssoSilent(request: AuthorizationUrlRequest): Observable<AuthenticationResult> {
        return from(
            this.msalInstance.ssoSilent(request)
                .then((authResponse: AuthenticationResult) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.SSO_SILENT_SUCCESS, authResponse);
                    return authResponse;
                })
                .catch((error: AuthError) => {
                    this.browserBroadcastService.broadcast(BroadcastEvent.SSO_SILENT_FAILURE, error);
                    throw error;
                })
        );
    }

}
