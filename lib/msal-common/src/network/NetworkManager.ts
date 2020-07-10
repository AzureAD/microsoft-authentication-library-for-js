/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { INetworkModule, NetworkRequestOptions } from "./INetworkModule";
import { CacheManager } from "../cache/CacheManager";
import { TelemetryManager } from "../telemetry/TelemetryManager";

export type NetworkResponse<T> = {
    headers: Map<string, string>;
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
     * @param tokenEndpoint
     * @param options
     */
    async sendPostRequest<T>(tokenEndpoint: string, options: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const response = await this.networkClient.sendPostRequestAsync<T>(tokenEndpoint, options);

        if (NetworkManager.serverLoggedRequest(response)) {
            // Request was logged by server, clear telemetry cache
            this.cacheManager.clearTelemetryCache();
        }

        return response;
    }

    /**
     * Checks a NetworkResponse object's status codes against 429 or 5xx
     * @param response
     */
    static serverLoggedRequest(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.status < 500 && response.status !== 429;
    }
}
