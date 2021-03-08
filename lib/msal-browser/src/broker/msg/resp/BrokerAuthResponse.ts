/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessage } from "../BrokerMessage";
import { BrokerAuthenticationResult, AccessTokenEntity, IdTokenEntity, AccountEntity, CacheManager, AuthenticationResult, CacheRecord, AuthError, InteractionRequiredAuthError, ServerError, ClientAuthError, ClientConfigurationError } from "@azure/msal-common";
import { InteractionType, BrokerMessageType } from "../../../utils/BrowserConstants";
import { BrowserCacheManager } from "../../../cache/BrowserCacheManager";
import { BrowserAuthError } from "../../../error/BrowserAuthError";
import { BrowserConfigurationAuthError } from "../../../error/BrowserConfigurationAuthError";
import { BrokerAuthError } from "../../../error/BrokerAuthError";

/**
 * Message type for responses to BrokerAuthRequests
 */
export class BrokerAuthResponse extends BrokerMessage {
    public interactionType: InteractionType;
    public result: BrokerAuthenticationResult | null;
    public error?: Error;

    constructor(interactionType: InteractionType, authResult: BrokerAuthenticationResult | null, authError?: Error) {
        super(BrokerMessageType.AUTH_RESULT);
        this.interactionType = interactionType;
        this.result = authResult;
        this.error = authError;
    }

    static validate(message: MessageEvent): BrokerAuthResponse | null {
        if (message.data &&
            message.data.messageType === BrokerMessageType.AUTH_RESULT &&
            message.data.interactionType &&
            (message.data.result || message.data.error)) {

            return new BrokerAuthResponse(message.data.interactionType, message.data.result, BrokerAuthResponse.detectError(message));
        }

        return null;
    }

    static detectError(message: MessageEvent): AuthError | undefined {
        const messageError = message.data.error;
        if (!messageError) {
            return undefined;
        }
        // const errorStack = messageError.stack;
        const errMessage = messageError.errorMessage.split(":");
        const code = errMessage.shift().trim();
        const messageBody = errMessage.join().trim();
        if (messageError.name.indexOf("InteractionRequiredAuthError") === 0) {
            return new InteractionRequiredAuthError(code, messageBody);
        } else if (messageError.name.indexOf("ServerError") === 0) {
            return new ServerError(code, messageBody);
        } else if (messageError.name.indexOf("ClientAuthError") === 0) {
            return new ClientAuthError(code, messageBody);
        } else if (messageError.name.indexOf("ClientConfigurationError") === 0) {
            return new ClientConfigurationError(code, messageBody);
        } else if (messageError.name.indexOf("BrowserAuthError") === 0) {
            return new BrowserAuthError(code, messageBody);
        } else if (messageError.name.indexOf("BrowserConfigurationAuthError") === 0) {
            return new BrowserConfigurationAuthError(code, messageBody);   
        } else if (messageError.name.indexOf("BrokerAuthError") === 0) {
            return new BrokerAuthError(code, messageBody);
        } else if (messageError.name.indexOf("AuthError") === 0) {
            return new AuthError(code, messageBody);
        }
        return messageError;
    }

    static processBrokerResponseMessage(brokerAuthResultMessage: MessageEvent, browserStorage: BrowserCacheManager): AuthenticationResult | null {
        const brokerAuthResult = BrokerAuthResponse.validate(brokerAuthResultMessage);
        return BrokerAuthResponse.processBrokerResponse(brokerAuthResult, browserStorage);
    }

    static processBrokerResponse(brokerAuthResult: BrokerAuthResponse | null, browserStorage: BrowserCacheManager): AuthenticationResult | null {
        if (!brokerAuthResult) {
            return null;
        }

        if (brokerAuthResult.error) {
            throw brokerAuthResult.error;
        }

        if (!brokerAuthResult.result || !brokerAuthResult.result.tokensToCache) {
            // If we reach here without a result object or tokensToCache, throw error as it is an unexpected code path.
            throw BrokerAuthError.createBrokerResponseInvalidError();
        }

        const accessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
        const idTokenEntity: IdTokenEntity = new IdTokenEntity();
        const accountEntity: AccountEntity = new AccountEntity();

        const tokensToCache = brokerAuthResult.result.tokensToCache;
        const cacheRecord: CacheRecord = {
            accessToken: CacheManager.toObject(tokensToCache.accessToken, accessTokenEntity) as AccessTokenEntity,
            idToken: CacheManager.toObject(tokensToCache.idToken, idTokenEntity) as IdTokenEntity,
            account: CacheManager.toObject(tokensToCache.account, accountEntity) as AccountEntity,
            refreshToken: null,
            appMetadata: null
        };
        browserStorage.saveCacheRecord(cacheRecord);
        delete brokerAuthResult.result.tokensToCache;
        return {
            ...brokerAuthResult.result
        };
    }
}
