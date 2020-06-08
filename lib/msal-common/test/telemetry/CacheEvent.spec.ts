import { expect } from "chai";
import CacheEvent, { CACHE_EVENT_TYPES, TOKEN_TYPES, TOKEN_TYPE_KEY } from "../../src/telemetry/CacheEvent";

describe("CacheEvent", () => {
    it("constructs and carries exepcted values", () => {
        const event = new CacheEvent("event-id", CACHE_EVENT_TYPES.TokenCacheLookup, "correlation-id").get();
        expect(event["msal.event_name"]).to.eq(CACHE_EVENT_TYPES.TokenCacheLookup);
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets values", () =>{
        const cacheEvent = new CacheEvent("event-id", CACHE_EVENT_TYPES.TokenCacheBeforeAccess, "corelation-id");

        cacheEvent.tokenType = TOKEN_TYPES.AT;

        const event = cacheEvent.get();

        expect(event[TOKEN_TYPE_KEY]).to.eq(TOKEN_TYPES.AT);
    });
});
