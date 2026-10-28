/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createDpopNonceRecord,
    createDpopNonceRedirectHandoff,
    getDpopNonceCacheKey,
    isDpopNonceCacheKey,
    isDpopNonceRedirectHandoff,
    matchesDpopNonceRedirectHandoff,
    REDIRECT_HANDOFF_TTL_MS,
} from "../../src/cache/DpopNonceCache.js";

describe("DPoP nonce cache helpers", () => {
    it("normalizes resource-server cache keys", () => {
        const key = getDpopNonceCacheKey(
            "https://API.CONTOSO.COM:443/resource"
        );

        expect(key).toBe("dpop.nonce.https://api.contoso.com");
        expect(isDpopNonceCacheKey(key)).toBe(true);
        expect(isDpopNonceCacheKey("unrelated")).toBe(false);
    });

    it("creates validated records with the supplied generation", () => {
        expect(createDpopNonceRecord("opaque-nonce", 7)).toEqual({
            nonce: "opaque-nonce",
            generation: 7,
        });
    });

    it("creates and matches request-bound redirect handoffs", () => {
        const handoff = createDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "opaque-nonce",
            "request-state",
            "correlation-id",
            1000
        );

        expect(handoff.expiresAt).toBe(1000 + REDIRECT_HANDOFF_TTL_MS);
        expect(
            matchesDpopNonceRedirectHandoff(
                handoff,
                "https://api.contoso.com/other",
                "request-state",
                "correlation-id",
                handoff.expiresAt
            )
        ).toBe(true);
        expect(
            matchesDpopNonceRedirectHandoff(
                handoff,
                "https://api.contoso.com/other",
                "request-state",
                "correlation-id",
                handoff.expiresAt + 1
            )
        ).toBe(false);
    });

    it("rejects non-finite redirect expiration values", () => {
        expect(
            isDpopNonceRedirectHandoff({
                nonce: "opaque-nonce",
                resourceServer: "https://api.contoso.com",
                state: "request-state",
                correlationId: "correlation-id",
                expiresAt: Infinity,
            })
        ).toBe(false);
    });
});
