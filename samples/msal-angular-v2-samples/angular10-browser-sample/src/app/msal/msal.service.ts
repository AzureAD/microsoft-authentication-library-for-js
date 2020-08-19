import { Inject, Injectable } from "@angular/core";
import {
    IPublicClientApplication, 
    AccountInfo, 
    EndSessionRequest,
    AuthorizationUrlRequest,
    AuthenticationResult,
    RedirectRequest,
    SilentRequest
} from "@azure/msal-browser";
import { MSAL_INSTANCE } from "./constants";

@Injectable()
export class MsalService implements IPublicClientApplication {

    constructor(
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication
    ) {}

    acquireTokenPopup(request: AuthorizationUrlRequest): Promise<AuthenticationResult> {
        return this.msalInstance.acquireTokenPopup(request);
    }
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        return this.msalInstance.acquireTokenRedirect(request);
    }
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult> {
        return this.msalInstance.acquireTokenSilent(silentRequest);
    }
    getAccountByUsername(userName: string): AccountInfo {
        return this.msalInstance.getAccountByUsername(userName);
    }
    getAllAccounts(): AccountInfo[] {
        return this.msalInstance.getAllAccounts();
    }
    handleRedirectPromise(): Promise<AuthenticationResult> {
        return this.msalInstance.handleRedirectPromise();
    }
    loginPopup(request?: AuthorizationUrlRequest): Promise<AuthenticationResult> {
        return this.msalInstance.loginPopup(request);
    }
    loginRedirect(request?: RedirectRequest): Promise<void> {
        return this.msalInstance.loginRedirect(request);
    }
    logout(logoutRequest?: EndSessionRequest): Promise<void> {
        return this.msalInstance.logout(logoutRequest);
    }
    ssoSilent(request: AuthorizationUrlRequest): Promise<AuthenticationResult> {
        return this.msalInstance.ssoSilent(request);
    }

}
