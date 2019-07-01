import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";

export const CACHE_EVENT_TYPES = {
    TokenCacheLookup: `${EVENT_NAME_PREFIX}token_cache_lookup`,
    TokenCacheWrite: `${EVENT_NAME_PREFIX}token_cache_write`,
    TokenCacheBeforeAccess: `${EVENT_NAME_PREFIX}token_cache_before_access`,
    TokenCacheAfterAccess: `${EVENT_NAME_PREFIX}token_cache_after_access`,
    TokenCacheBeforeWrite: `${EVENT_NAME_PREFIX}token_cache_before_write`,
    TokenCacheDelete: `${EVENT_NAME_PREFIX}token_cache_delete`,
};

export const TOKEN_TYPES = {
    AT: "at",
    ID: "id",
    ACCOUNT: "account"
};

export const TOKEN_TYPE_KEY = `${EVENT_NAME_PREFIX}token_type`;

export default class CacheEvent extends TelemetryEvent {
    constructor(eventName: string, correlationId: string) {
        super(eventName, correlationId);
    }

    public set tokenType(tokenType: string) {
        this.event[TOKEN_TYPE_KEY] = tokenType;
    }

}
