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
import { ErrorPayload } from "../ErrorPayload";

/**
 * Message type for responses to BrokerAuthRequests
 */
export class BrokerAuthResponse extends BrokerMessage {
    public interactionType: InteractionType;
    public result: BrokerAuthenticationResult;
    public errorPayload?: ErrorPayload;

    constructor(interactionType: InteractionType, authResult: BrokerAuthenticationResult | null, authError?: AuthError) {
        super(BrokerMessageType.AUTH_RESULT);
        this.interactionType = interactionType;
        this.result = authResult;
        this.errorPayload = this.generateErrorPayload(authError);
    }

    private generateErrorPayload(authError?: AuthError): ErrorPayload | undefined {
        return !authError ? undefined : {
            ...authError
        };
    }

    static validate(message: MessageEvent): BrokerAuthResponse | null {
        if (message.data &&
            message.data.messageType === BrokerMessageType.AUTH_RESULT &&
            message.data.interactionType &&
            (message.data.result || message.data.errorPayload)) {

            return new BrokerAuthResponse(message.data.interactionType, message.data.result, message.data.errorPayload);
        }

        return null;
    }

    static detectError(errPayload: ErrorPayload): AuthError {
        switch (errPayload.name) {
            case InteractionRequiredAuthError.INTERACTION_REQ_ERROR_NAME:
                return new InteractionRequiredAuthError(errPayload.errorCode, errPayload.errorMessage, errPayload.subError);
            case ServerError.SERVER_ERROR_NAME:
                return new ServerError(errPayload.errorCode, errPayload.errorMessage, errPayload.subError);
            case ClientAuthError.CLIENT_AUTH_ERR_NAME:
                return new ClientAuthError(errPayload.errorCode, errPayload.errorMessage);
            case ClientConfigurationError.CLIENT_CONFIG_ERROR_NAME:
                return new ClientConfigurationError(errPayload.errorCode, errPayload.errorMessage);
            case BrowserAuthError.BROWSER_AUTH_ERROR_NAME:
                return new BrowserAuthError(errPayload.errorCode, errPayload.errorMessage);
            case BrowserConfigurationAuthError.BROWSER_CONFIG_ERROR_NAME:
                return new BrowserConfigurationAuthError(errPayload.errorCode, errPayload.errorMessage);
            case BrokerAuthError.BROKER_AUTH_ERROR_NAME:
                return new BrokerAuthError(errPayload.errorCode, errPayload.errorMessage);
            case AuthError.AUTH_ERROR_NAME:
                return new AuthError(errPayload.errorCode, errPayload.errorMessage, errPayload.subError);
            default:
                return AuthError.createUnexpectedError(`Unknown error: ${JSON.stringify(errPayload)}`);
        }
    }

    static processBrokerResponseMessage(brokerAuthResultMessage: MessageEvent, browserStorage: BrowserCacheManager): AuthenticationResult | null {
        const brokerAuthResult = BrokerAuthResponse.validate(brokerAuthResultMessage);
        return BrokerAuthResponse.processBrokerResponse(brokerAuthResult, browserStorage);
    }

    static processBrokerResponse(brokerAuthResult: BrokerAuthResponse | null, browserStorage: BrowserCacheManager): AuthenticationResult | null {
        if (!brokerAuthResult) {
            return null;
        }
        
        if (brokerAuthResult.errorPayload) {
            throw BrokerAuthResponse.detectError(brokerAuthResult.errorPayload);
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
