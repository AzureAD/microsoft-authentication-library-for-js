import CacheEvent, { CACHE_EVENT_TYPES, TOKEN_TYPES, TOKEN_TYPE_KEY } from "../../src/telemetry/CacheEvent";
import { CryptoUtils } from '../../src/utils/CryptoUtils';

describe("CacheEvent", () => {
    it("constructs and carries exepcted values", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const event = new CacheEvent(CACHE_EVENT_TYPES.TokenCacheLookup, correlationId).get();
        expect(event["msal.event_name"]).toBe(CACHE_EVENT_TYPES.TokenCacheLookup);
        expect(event["msal.elapsed_time"]).toBe(-1);
    });

    it("sets values", () =>{
        const correlationId = CryptoUtils.createNewGuid();
        const cacheEvent = new CacheEvent(CACHE_EVENT_TYPES.TokenCacheBeforeAccess, correlationId);

        cacheEvent.tokenType = TOKEN_TYPES.AT;

        const event = cacheEvent.get();

        expect(event[TOKEN_TYPE_KEY]).toBe(TOKEN_TYPES.AT);
    });
});
