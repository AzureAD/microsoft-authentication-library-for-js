/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger } from "@azure/msal-common";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { ClientCredentialRequest } from "../request/ClientCredentialRequest";
import { OnBehalfOfRequest } from "../request/OnBehalfOfRequest";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { TokenCache } from "../cache/TokenCache";
export interface IConfidentialClientApplication {
    getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string>;
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult | null>;
    acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult | null>;
    acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<AuthenticationResult | null>;
    acquireTokenByClientCredential(request: ClientCredentialRequest): Promise<AuthenticationResult | null>;
    acquireTokenOnBehalfOf(request: OnBehalfOfRequest): Promise<AuthenticationResult | null>;
    getTokenCache(): TokenCache;
    getLogger(): Logger;
    setLogger(logger: Logger): void;
}

