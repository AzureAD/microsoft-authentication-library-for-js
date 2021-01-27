/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger } from "@azure/msal-common";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { DeviceCodeRequest } from "../request/DeviceCodeRequest";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { UsernamePasswordRequest } from "../request/UsernamePasswordRequest";
import { TokenCache } from "../cache/TokenCache";

/**
 * Interface for the PublicClientApplication class defining the public API signatures
 */
export interface IPublicClientApplication {
    /**
     * Creates the URL of the authorization request
     * @param request
     */
    getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string>;

    /**
     * Acquires a token by exchanging the Authorization Code received from the first step of OAuth2.0
     * Authorization Code flow.
     * @param request
     */
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult | null>;

    /**
     * Acquires a token silently when a user specifies the account the token is requested for.
     * @param request
     */
    acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult | null>;

    /**
     * Acquires a token by exchanging the refresh token provided for a new set of tokens.
     * @param request
     */
    acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<AuthenticationResult | null>;

    /**
     * Acquires a token from the authority using OAuth2.0 device code flow.
     * @param request
     */
    acquireTokenByDeviceCode(request: DeviceCodeRequest): Promise<AuthenticationResult | null>;

    /**
     * Acquires tokens with password grant by exchanging client applications username and password for credentials
     * @internal
     * @param request
     */
    acquireTokenByUsernamePassword(request: UsernamePasswordRequest): Promise<AuthenticationResult | null>;

    /**
     * Fetches the token cache
     */
    getTokenCache(): TokenCache;

    /**
     * Fetches the logger instance
     */
    getLogger(): Logger;

    /**
     * Sets the logger instance
     * @param logger
     */
    setLogger(logger: Logger): void;
}

