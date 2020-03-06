/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { INetworkModule } from "./INetworkModule";
import { ServerTokenRequestParameters } from "../server/ServerTokenRequestParameters";
import { ICacheStorage } from "../cache/ICacheStorage";
import { AccessTokenKey } from "../cache/AccessTokenKey";
import { AccessTokenValue } from '../cache/AccessTokenValue';
import { Constants } from "../utils/Constants";
import { ICrypto } from "../crypto/ICrypto";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { ClientInfo } from "../auth/ClientInfo";

export type NetworkResponse<T> = {
    headers: Map<string, string>;
    body: T;
    status: number;
};

export class NetworkManager {
    cacheStorage: ICacheStorage;
    networkClient: INetworkModule;
    cryptoObj: ICrypto;

    constructor(cacheStorage: ICacheStorage, networkClient: INetworkModule, cryptoObj: ICrypto) {
        this.cacheStorage = cacheStorage;
        this.networkClient = networkClient;
        this.cryptoObj = cryptoObj;
    }

    async sendPostRequest(tokenEndpoint: string, tokenReqParams: ServerTokenRequestParameters, tokenRequest: TokenExchangeParameters, clientInfo: ClientInfo, clientId: string): Promise<ServerAuthorizationTokenResponse> {
        const thumbprint = new AccessTokenKey(
            tokenRequest.authority, 
            clientId, 
            tokenRequest.scopes.join(" "), 
            tokenRequest.resource, 
            clientInfo && clientInfo.uid, 
            clientInfo && clientInfo.utid, 
            this.cryptoObj
        );

        const options = {
            body: tokenReqParams.createRequestBody(),
            headers: tokenReqParams.createRequestHeaders()
        };

        // this.preProcess();

        const networkResponse = await this.networkClient.sendPostRequestAsync(tokenEndpoint, options);

        this.postProcess(networkResponse, thumbprint);

        return networkResponse.body as ServerAuthorizationTokenResponse;
    }

    private postProcess(response: NetworkResponse<ServerAuthorizationTokenResponse>, thumbprint: AccessTokenKey): void {
        if (response.status >= 500 || response.status == 429 || (response.status < 200 || response.status >= 300) && response.headers.has("Retry-After")) {
            const throttleTime = parseInt(response.headers.get("Retry-After")) || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS;

            const cacheKey = JSON.stringify(thumbprint);
            const currentCacheValue = this.cacheStorage.getItem(cacheKey);
            const parsedValue = JSON.parse(currentCacheValue);

            const accessTokenValue = new AccessTokenValue(
                parsedValue.tokenType,
                parsedValue.accessToken,
                parsedValue.idToken,
                parsedValue.refreshToken,
                parsedValue.expiresOn,
                parsedValue.extExpiresOn,
                response.body.error,
                response.body.error_description,
                response.body.error_codes.join(" "),
                throttleTime
            );

            this.cacheStorage.setItem(cacheKey, JSON.stringify(accessTokenValue));
        }
    }

    // private preProcess() {

    // }
}
