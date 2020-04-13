/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { CacheHelpers } from "../cache/CacheHelpers";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { buildClientInfo, ClientInfo } from "../account/ClientInfo";
import { ICrypto } from "../crypto/ICrypto";
import { ICacheStorage } from "../cache/ICacheStorage";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { Logger } from "../logger/Logger";
import { ServerError } from "../error/ServerError";

/**
 * Class that handles response parsing.
 */
export class ResponseHandler {
    private clientId: string;
    private cacheStorage: ICacheStorage;
    // private cacheManager: TokenCacheGenerator;
    private cryptoObj: ICrypto;
    private logger: Logger;
    private homeAccountIdentifier: string;

    constructor(
        clientId: string,
        cacheStorage: ICacheStorage,
        cacheManager: CacheHelpers,
        cryptoObj: ICrypto,
        logger: Logger
    ) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        // this.cacheManager = cacheManager;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
    }

    /**
     * Function which validates server authorization code response.
     * @param serverResponseHash
     * @param cachedState
     * @param cryptoObj
     */
    validateServerAuthorizationCodeResponse(
        serverResponseHash: ServerAuthorizationCodeResponse,
        cachedState: string,
        cryptoObj: ICrypto
    ): void {
        if (serverResponseHash.state !== cachedState) {
            throw ClientAuthError.createStateMismatchError();
        }

        // Check for error
        if (serverResponseHash.error || serverResponseHash.error_description) {
            throw new ServerError(
                serverResponseHash.error,
                serverResponseHash.error_description
            );
        }

        if (serverResponseHash.client_info) {
            buildClientInfo(serverResponseHash.client_info, cryptoObj);
        }
    }

    /**
     * Function which validates server authorization token response.
     * @param serverResponse
     */
    validateServerAuthorizationTokenResponse(
        serverResponse: ServerAuthorizationTokenResponse
    ): void {
        // Check for error
        if (serverResponse.error || serverResponse.error_description) {
            const errString = `${serverResponse.error_codes} - [${serverResponse.timestamp}]: ${serverResponse.error_description} - Correlation ID: ${serverResponse.correlation_id} - Trace ID: ${serverResponse.trace_id}`;
            throw new ServerError(serverResponse.error, errString);
        }

        // generate homeAccountId
        if (serverResponse.client_info) {
            const clientInfo: ClientInfo = buildClientInfo(serverResponse.client_info, this.cryptoObj);
            if (!StringUtils.isEmpty(clientInfo.uid) && !StringUtils.isEmpty(clientInfo.utid)) {
                this.homeAccountIdentifier = this.cryptoObj.base64Encode(clientInfo.uid) + "." + this.cryptoObj.base64Encode(clientInfo.utid);
            }
        }
    }

}
