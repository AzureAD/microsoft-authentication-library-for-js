/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from "./INetworkModule";
import { RequestThumbprint } from "./RequestThumbprint";
import { ThrottlingUtils } from "./ThrottlingUtils";
import { CacheManager } from "../cache/CacheManager";

export type NetworkResponse<T> = {
    headers: Record<string, string>;
    body: T;
    status: number;
};

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
    async sendPostRequest<T>(thumbprint: RequestThumbprint, tokenEndpoint: string, options: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        ThrottlingUtils.preProcess(this.cacheManager, thumbprint);
        const response = await this.networkClient.sendPostRequestAsync<T>(tokenEndpoint, options);
        ThrottlingUtils.postProcess(this.cacheManager, thumbprint, response);

        // Placeholder for Telemetry hook

        return response;
    }
}
