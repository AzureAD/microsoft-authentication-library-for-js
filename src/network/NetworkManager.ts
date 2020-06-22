/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto } from '../crypto/ICrypto';
import { ICacheStorage } from '../cache/interface/ICacheStorage';
import { INetworkModule, NetworkRequestOptions } from './INetworkModule';
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";

export type NetworkResponse<T> = {
    headers: Record<string, string>;
    body: T;
    status: number;
};

export class NetworkThumbprint {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier: string;

    constructor(clientId: string, authority: string, scopes: Array<string>, homeAccountIdentifier: string) {
        this.clientId = clientId;
        this.authority = authority;
        this.scopes = scopes;
        this.homeAccountIdentifier = homeAccountIdentifier;
    }

    // base64Encode function

    // base64Decode function

    // generateCacheKey
}

// TODO placeholder: this will be filled in by the throttling PR
export class NetworkManager {
    cryptoObj: ICrypto;
    cacheStorage: ICacheStorage
    networkClient: INetworkModule

    constructor(cryptoObj:ICrypto, cacheStorage: ICacheStorage, networkClient: INetworkModule) {
        this.cryptoObj = cryptoObj;
        this.cacheStorage = cacheStorage;
        this.networkClient = networkClient;
    }

    private async sendPostRequest(tokenEndpoint: string, options: NetworkRequestOptions, isInteractive: boolean): Promise<NetworkResponse<T>> {
        const thumbprint = new NetworkThumbprint();

        this.preProcess(thumbprint, isInteractive);
        const response = await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(tokenEndpoint, options);
        this.postProcess(thumbprint, response as ServerAuthorizationTokenResponse);

        return response;
    }

    private preProcess(thumbprint: NetworkThumbprint, isInteractive: boolean): void {
        const key = generateCacheKey(thumbprint);
        const cacheValue = this.cacheStorage.getItem(key);
        const date = new Date();

        if (cacheValue) {
            if (cacheValue.throttleTime >= date.getTime()) {
                // remove throttle here
                return;
            }
            if (isInteractive) {
                return;
            }
            // throw error back to user here
        }
    }
        // create thumbprint
        // check against cache + STATE
            // if we find nothing, make request
            // if we find something:
                // check if throttled
                // check expiration of throttle
                    // remove throttle if expired?
        

    private postProcess(thumbprint: NetworkThumbprint, response: ServerAuthorizationTokenResponse): void {

    }
    // private postProcess()
        // create thumbprint
        // check the response, put things in cache if necessary

    // cache storage? 

}


// InteractionType state?