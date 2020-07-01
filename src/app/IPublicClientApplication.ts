import { AuthenticationResult, AuthorizationUrlRequest } from "@azure/msal-common";
import { SilentFlowRequest, EndSessionRequest, AccountInfo } from "../";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export interface IPublicClientApplication {
    acquireTokenPopup(request: AuthorizationUrlRequest): Promise<AuthenticationResult>;
    acquireTokenRedirect(request: AuthorizationUrlRequest): Promise<void>;
    acquireTokenSilent(silentRequest: SilentFlowRequest): Promise<AuthenticationResult>;
    getAccountByUsername(userName: string): AccountInfo;
    getAllAccounts(): AccountInfo[];
    handleRedirectPromise(): Promise<AuthenticationResult | null>;
    loginPopup(request: AuthorizationUrlRequest): Promise<AuthenticationResult>;
    loginRedirect(request: AuthorizationUrlRequest): Promise<void>;
    logout(logoutRequest?: EndSessionRequest): Promise<void>;
    ssoSilent(request: AuthorizationUrlRequest): Promise<AuthenticationResult>;
}
