/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto } from '../crypto/ICrypto';
import { ICacheStorage } from '../cache/interface/ICacheStorage';
import { INetworkModule, NetworkRequestOptions } from './INetworkModule';
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { Constants, HeaderNames } from "../utils/Constants";

export type NetworkResponse<T> = {
    headers: Record<string, string>;
    body: T;
    status: number;
};

export class NetworkManager {
    cryptoObj: ICrypto;
    cacheStorage: ICacheStorage
    networkClient: INetworkModule

    constructor(cryptoObj:ICrypto, cacheStorage: ICacheStorage, networkClient: INetworkModule) {
        this.cryptoObj = cryptoObj;
        this.cacheStorage = cacheStorage;
        this.networkClient = networkClient;
    }

    public async sendPostRequest(thumbprint: RequestThumbprint, tokenEndpoint: string, options: NetworkRequestOptions, isInteractive: boolean): Promise<NetworkResponse<T>> {

        this.preProcess(thumbprint, isInteractive);
        const response = await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(tokenEndpoint, options);
        this.postProcess(thumbprint, response);

        return response;
    }

    private preProcess(thumbprint: NetworkThumbprint, isInteractive: boolean): void {
        const key = generateCacheKey(thumbprint);
        const cacheValue = this.cacheStorage.getItem(key);

        if (cacheValue) {
            if (cacheValue.throttleTime >= Date.now()) {
                // TODO: remove throttle from cache
                return;
            }
            if (isInteractive) {
                return;
            }
            // TODO: throw error back to user here
        }
    }

        

    private postProcess(thumbprint: RequestThumbprint, response: NetworkResponse<ServerAuthorizationTokenResponse>): void {
        if (this.checkResponseForThrottle(response)) {
            const throttleTime = this.calculateThrottleTime(parseInt(response.headers.get(HeaderNames.RETRY_AFTER)));
            // TODO: setItem to cache
        }
    }

    private checkResponseForThrottle(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        if (response.status == 429 || response.status >= 500 && response.status < 600) {
            return true;
        }

        if (response.headers.has(HeaderNames.RETRY_AFTER) && response.status < 200 && response.status >= 300) {
            return true;
        }

        return false;
    }

    private calculateThrottleTime(throttleTime: number): number {
        return Math.min(throttleTime || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS, Constants.DEFAULT_MAX_THROTTLE_TIME_MS);
    }
}
