/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { INetworkModule } from "./INetworkModule";
import { ServerTokenRequestParameters } from "../server/ServerTokenRequestParameters";
import { ICacheStorage } from "../cache/ICacheStorage";
import { AccessTokenKey } from "../cache/AccessTokenKey";
import { RequestThumbprint } from "./RequestThumbprint";
import { Constants } from "../utils/Constants";
import { ICrypto } from "../crypto/ICrypto";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { ClientInfo } from "../auth/ClientInfo";
import { ErrorValue } from "../cache/ErrorValue";

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
        const thumbprint = new RequestThumbprint(tokenRequest.authority, clientId, tokenRequest.scopes, tokenRequest.resource, clientInfo, this.cryptoObj);

        const options = {
            body: tokenReqParams.createRequestBody(),
            headers: tokenReqParams.createRequestHeaders()
        };

        // this.preProcess();

        const networkResponse = await this.networkClient.sendPostRequestAsync(tokenEndpoint, options);

        this.postProcess(networkResponse, thumbprint, clientInfo);

        return networkResponse.body as ServerAuthorizationTokenResponse;
    }

    private postProcess(response: NetworkResponse<ServerAuthorizationTokenResponse>, thumbprint: RequestThumbprint, clientInfo: ClientInfo): void {
        if (response.status >= 500 || response.status == 429 || response.status >= 300 && response.headers.has("Retry-After")) {
            const throttleTime = response.headers.get("Retry-After") || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS;
            // const responseBody = JSON.parse(response.body);

            const accessTokenKey = new AccessTokenKey(
                thumbprint.authority,
                thumbprint.clientId,
                thumbprint.scopes.join(" "),
                thumbprint.resource,
                throttleTime,
                clientInfo && clientInfo.uid, 
                clientInfo && clientInfo.utid, 
                this.cryptoObj
            );

            const errorValue = new ErrorValue(
                response.body.error,
                response.body.error_description,
                response.body.error_codes.join(" ")
            );

            this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(errorValue));
        }
    }

    // private preProcess() {

    // }
}
