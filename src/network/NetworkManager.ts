/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule, NetworkRequestOptions } from "./INetworkModule";

export type NetworkResponse<T> = {
    headers: Map<string, string>;
    body: T;
    status: number;
};

export class NetworkManager {
    private networkClient: INetworkModule;

    constructor(networkClient: INetworkModule) {
        this.networkClient = networkClient;
    }

    /**
     * Wraps sendPostRequestAsync with necessary preflight and postflight logic
     * @param tokenEndpoint
     * @param options
     */
    async sendPostRequest<T>(tokenEndpoint: string, options: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const response = await this.networkClient.sendPostRequestAsync<T>(tokenEndpoint, options);

        return response;
    }
}
