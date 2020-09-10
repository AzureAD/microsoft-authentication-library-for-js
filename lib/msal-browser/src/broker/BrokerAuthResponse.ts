import { BrokerMessage } from "./BrokerMessage";
import { BrokerAuthenticationResult, AccessTokenEntity, IdTokenEntity, AccountEntity, CacheManager, AuthenticationResult } from "@azure/msal-common";
import { InteractionType, BrokerMessageType } from "../utils/BrowserConstants";
import { CacheRecord } from "@azure/msal-common/dist/src/cache/entities/CacheRecord";
import { BrowserStorage } from "../cache/BrowserStorage";

export class BrokerAuthResponse extends BrokerMessage {
    public interactionType: InteractionType;
    public result: BrokerAuthenticationResult;
    public error: Error;

    constructor(interactionType: InteractionType, authResult: BrokerAuthenticationResult, authError?: Error) {
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

            // TODO: verify version compat

            return new BrokerAuthResponse(message.data.interactionType, message.data.result);
        }

        return null;
    }

    static processBrokerResponse(brokerAuthResultMessage: MessageEvent, browserStorage: BrowserStorage): AuthenticationResult {
        const brokerAuthResult = BrokerAuthResponse.validate(brokerAuthResultMessage);
        if (brokerAuthResult.error) {
            throw brokerAuthResult.error;
        }
        const accessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
        const idTokenEntity: IdTokenEntity = new IdTokenEntity();
        const accountEntity: AccountEntity = new AccountEntity();
        const cacheRecord: CacheRecord = {
            accessToken: CacheManager.toObject(brokerAuthResult.result.tokensToCache.accessToken, accessTokenEntity) as AccessTokenEntity,
            idToken: CacheManager.toObject(brokerAuthResult.result.tokensToCache.idToken, idTokenEntity) as IdTokenEntity,
            account: CacheManager.toObject(brokerAuthResult.result.tokensToCache.account, accountEntity) as AccountEntity,
            refreshToken: null
        };
        browserStorage.saveCacheRecord(cacheRecord);
        delete brokerAuthResult.result.tokensToCache;
        return {
            ...brokerAuthResult.result
        };
    }
}
