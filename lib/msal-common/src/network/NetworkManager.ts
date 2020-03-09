/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { INetworkModule } from "./INetworkModule";
import { ServerTokenRequestParameters } from "../server/ServerTokenRequestParameters";
import { ICacheStorage } from "../cache/ICacheStorage";
import { AccessTokenKey } from "../cache/AccessTokenKey";
import { AccessTokenValue } from "../cache/AccessTokenValue";
import { Constants, HEADER_NAMES } from "../utils/Constants";
import { ICrypto } from "../crypto/ICrypto";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { ClientInfo } from "../auth/ClientInfo";
import { ServerError } from "../error/ServerError";

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
        const thumbprint = this.createThumbprint(clientId, tokenRequest, clientInfo);

        const options = {
            body: tokenReqParams.createRequestBody(),
            headers: tokenReqParams.createRequestHeaders()
        };

        this.preProcess(thumbprint);

        const networkResponse = await this.networkClient.sendPostRequestAsync(tokenEndpoint, options);

        this.postProcess(networkResponse, thumbprint);

        return networkResponse.body as ServerAuthorizationTokenResponse;
    }

    private postProcess(response: NetworkResponse<ServerAuthorizationTokenResponse>, thumbprint: AccessTokenKey): void {
        if (response.status >= 500 || response.status == 429 || (response.status < 200 || response.status >= 300) && response.headers.has(HEADER_NAMES.RETRY_AFTER)) {
            const throttleTime = parseInt(response.headers.get(HEADER_NAMES.RETRY_AFTER)) || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS;

            const accessTokenValue = this.getThumbprintValueFromCache(thumbprint);

            const newAccessTokenValue = new AccessTokenValue(
                accessTokenValue.tokenType,
                accessTokenValue.accessToken,
                accessTokenValue.idToken,
                accessTokenValue.refreshToken,
                accessTokenValue.expiresOnSec,
                accessTokenValue.extExpiresOnSec,
                response.body.error,
                response.body.error_description,
                response.body.error_codes.join(" "),
                throttleTime
            );

            this.cacheStorage.setItem(JSON.stringify(thumbprint), JSON.stringify(newAccessTokenValue));
        }
    }

    private preProcess(thumbprint: AccessTokenKey): void {
        const accessTokenValue = this.getThumbprintValueFromCache(thumbprint);
        const currentTime = Date.now();

        if (accessTokenValue.throttleTime > currentTime) {
            throw new ServerError(accessTokenValue.error, accessTokenValue.errorDescription);
        }
        else if (accessTokenValue.throttleTime <= currentTime) {
            if (accessTokenValue.idToken) {
                const newAccessTokenValue = new AccessTokenValue(
                    accessTokenValue.tokenType,
                    accessTokenValue.accessToken,
                    accessTokenValue.idToken,
                    accessTokenValue.refreshToken,
                    accessTokenValue.expiresOnSec,
                    accessTokenValue.extExpiresOnSec
                );
    
                this.cacheStorage.setItem(JSON.stringify(thumbprint), JSON.stringify(newAccessTokenValue));
            }
            else {
                this.cacheStorage.removeItem(JSON.stringify(thumbprint));
            }
        }
    }

    private createThumbprint(clientId: string, tokenRequest: TokenExchangeParameters, clientInfo: ClientInfo): AccessTokenKey {
        return new AccessTokenKey(
            tokenRequest.authority, 
            clientId, 
            tokenRequest.scopes.join(" "), 
            tokenRequest.resource, 
            clientInfo && clientInfo.uid, 
            clientInfo && clientInfo.utid, 
            this.cryptoObj
        );
    }

    private getThumbprintValueFromCache(thumbprint: AccessTokenKey): AccessTokenValue {
        const cacheKey = JSON.stringify(thumbprint);
        const currentCacheValue = this.cacheStorage.getItem(cacheKey);
        return JSON.parse(currentCacheValue) as AccessTokenValue;
    }
}
