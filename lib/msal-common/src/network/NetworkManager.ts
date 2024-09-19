/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from "./INetworkModule.js";
import { RequestThumbprint } from "./RequestThumbprint.js";
import { ThrottlingUtils } from "./ThrottlingUtils.js";
import { CacheManager } from "../cache/CacheManager.js";
import { AuthError } from "../error/AuthError.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse.js";

export type NetworkResponse<T> = {
    headers: Record<string, string>;
    body: T;
    status: number;
};

export type UrlToHttpRequestOptions = {
    protocol: string;
    hostname: string;
    hash: string;
    search: string;
    pathname: string;
    path: string;
    href: string;
    port?: number;
    auth?: string;
};

/** @internal */
export class NetworkManager {
    private networkClient: INetworkModule;
    private cacheManager: CacheManager;

    constructor(networkClient: INetworkModule, cacheManager: CacheManager) {
        this.networkClient = networkClient;
        this.cacheManager = cacheManager;
    }

    /**
     * Wraps sendPostRequestAsync with necessary preflight and postflight logic
     * @param thumbprint
     * @param tokenEndpoint
     * @param options
     */
    async sendPostRequest<T extends ServerAuthorizationTokenResponse>(
        thumbprint: RequestThumbprint,
        tokenEndpoint: string,
        options: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        ThrottlingUtils.preProcess(this.cacheManager, thumbprint);

        let response;
        try {
            response = await this.networkClient.sendPostRequestAsync<T>(
                tokenEndpoint,
                options
            );
        } catch (e) {
            if (e instanceof AuthError) {
                throw e;
            } else {
                throw createClientAuthError(ClientAuthErrorCodes.networkError);
            }
        }

        ThrottlingUtils.postProcess(this.cacheManager, thumbprint, response);

        return response;
    }
}
