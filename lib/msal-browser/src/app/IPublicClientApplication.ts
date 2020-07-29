import { AuthenticationResult, AuthorizationUrlRequest, AccountInfo, EndSessionRequest } from "@azure/msal-common";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export interface IPublicClientApplication {
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Promise<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult>;
    getAccountByUsername(userName: string): AccountInfo | null;
    getAllAccounts(): AccountInfo[];
    handleRedirectPromise(): Promise<AuthenticationResult | null>;
    loginPopup(request: PopupRequest): Promise<AuthenticationResult>;
    loginRedirect(request: RedirectRequest): Promise<void>;
    logout(logoutRequest?: EndSessionRequest): Promise<void>;
    ssoSilent(request: AuthorizationUrlRequest): Promise<AuthenticationResult>;
}
