/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from "./INetworkModule";
import { RequestThumbprint } from "./RequestThumbprint";
import { ThrottlingUtils } from "./ThrottlingUtils";
import { CacheManager } from "../cache/CacheManager";
import { AuthError } from "../error/AuthError";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";

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
     * Wraps the networkClient's sendGetRequestAsync with necessary preflight and postflight logic
     * Managed Identity sends GET requests to communicate to the following managed identity sources:
     * App Service, Azure Arc, Imds, Service Fabric
     *
     * @param thumbprint
     * @param tokenEndpoint
     * @param options
     */
    async sendGetRequest<T extends ServerAuthorizationTokenResponse>(
        thumbprint: RequestThumbprint,
        tokenEndpoint: string,
        options: NetworkRequestOptions,
        cancellationToken?: number
    ): Promise<NetworkResponse<T>> {
        ThrottlingUtils.preProcess(this.cacheManager, thumbprint);

        let response;
        try {
            response = await this.networkClient.sendGetRequestAsync<T>(
                tokenEndpoint,
                options,
                cancellationToken
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

    /**
     * Wraps the networkClient's sendPostRequestAsync with necessary preflight and postflight logic
     * @param thumbprint
     * @param tokenEndpoint
     * @param options
     */
    async sendPostRequest<T extends ServerAuthorizationTokenResponse>(
        thumbprint: RequestThumbprint,
        tokenEndpoint: string,
        options: NetworkRequestOptions,
        cancellationToken?: number
    ): Promise<NetworkResponse<T>> {
        ThrottlingUtils.preProcess(this.cacheManager, thumbprint);

        let response;
        try {
            response = await this.networkClient.sendPostRequestAsync<T>(
                tokenEndpoint,
                options,
                cancellationToken
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
