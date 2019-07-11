import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";
import { prependEventNamePrefix } from "./TelemetryUtils";

export const CACHE_EVENT_TYPES = {
    TokenCacheLookup: prependEventNamePrefix("token_cache_lookup"),
    TokenCacheWrite: prependEventNamePrefix("token_cache_write"),
    TokenCacheBeforeAccess: prependEventNamePrefix("token_cache_before_access"),
    TokenCacheAfterAccess: prependEventNamePrefix("token_cache_after_access"),
    TokenCacheBeforeWrite: prependEventNamePrefix("token_cache_before_write"),
    TokenCacheDelete: prependEventNamePrefix("token_cache_delete")
};

export enum TOKEN_TYPES {
    AT = "at",
    ID = "id",
    ACCOUNT = "account"
}


export const TOKEN_TYPE_KEY = prependEventNamePrefix("token_type");

export default class CacheEvent extends TelemetryEvent {
    constructor(eventName: string, correlationId: string) {
        super(eventName, correlationId);
    }

    public set tokenType(tokenType: string) {
        this.event[TOKEN_TYPE_KEY] = tokenType;
    }

}
