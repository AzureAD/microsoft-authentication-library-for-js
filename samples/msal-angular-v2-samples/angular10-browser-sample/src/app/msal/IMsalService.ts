import {
    EndSessionRequest,
    AuthorizationUrlRequest,
    AuthenticationResult,
    PopupRequest,
    RedirectRequest,
    SilentRequest
} from "@azure/msal-browser";
import { Observable } from 'rxjs';

export interface IMsalService {
    acquireTokenPopup(request: PopupRequest): Observable<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Observable<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Observable<AuthenticationResult>;
    handleRedirectObservable(): Observable<AuthenticationResult | null>;
    loginPopup(request?: PopupRequest): Observable<AuthenticationResult>;
    loginRedirect(request?: RedirectRequest): Observable<void>;
    logout(logoutRequest?: EndSessionRequest): Observable<void>;
    ssoSilent(request: AuthorizationUrlRequest): Observable<AuthenticationResult>;
}