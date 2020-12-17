/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AuthorizationCodeRequest, AuthorizationUrlRequest, DeviceCodeRequest, Logger, RefreshTokenRequest, SilentFlowRequest, UsernamePasswordRequest } from "@azure/msal-common";
import { NodeConfigurationAuthError } from "../error/NodeConfigurationAuthError";
import { TokenCache } from "../cache/TokenCache";

export interface IPublicClientApplication {
    getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string>;
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult | null>;
    acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult | null>;
    acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<AuthenticationResult | null>;
    acquireTokenByDeviceCode(request: DeviceCodeRequest): Promise<AuthenticationResult | null>;
    acquireTokenByUsernamePassword(request: UsernamePasswordRequest): Promise<AuthenticationResult | null>;
    getTokenCache(): TokenCache;
    getLogger(): Logger;
    setLogger(logger: Logger): void;
}

export const stubbedPublicClientApplication: IPublicClientApplication = {
    getAuthCodeUrl: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByCode: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenSilent: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByRefreshToken: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByDeviceCode: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenByUsernamePassword: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    getTokenCache: () => {
        throw NodeConfigurationAuthError.createStubTokenCacheCalledError();
    },
    getLogger: () => {
        throw NodeConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    setLogger: () => {
        throw NodeConfigurationAuthError.createStubPcaInstanceCalledError();
    }
};

