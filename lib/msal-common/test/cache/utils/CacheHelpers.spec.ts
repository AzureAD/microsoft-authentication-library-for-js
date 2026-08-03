/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as CacheHelpers from "../../../src/cache/utils/CacheHelpers.js";

describe("CacheHelpers", () => {
    describe("serializeAttributeTokens", () => {
        it("returns undefined for undefined", () => {
            expect(
                CacheHelpers.serializeAttributeTokens(undefined)
            ).toBeUndefined();
        });

        it("returns undefined for empty array", () => {
            expect(CacheHelpers.serializeAttributeTokens([])).toBeUndefined();
        });

        it("returns sorted, space-joined partition", () => {
            const partition = CacheHelpers.serializeAttributeTokens([
                "zeta",
                "alpha",
                "mike",
            ]);
            expect(partition).toEqual("alpha mike zeta");
        });

        it("is deterministic regardless of input order", () => {
            const a = CacheHelpers.serializeAttributeTokens(["a", "b", "c"]);
            const b = CacheHelpers.serializeAttributeTokens(["c", "b", "a"]);
            expect(a).toEqual(b);
        });

        it("does not mutate the caller's array", () => {
            const input = ["z", "a"];
            CacheHelpers.serializeAttributeTokens(input);
            expect(input).toEqual(["z", "a"]);
        });
    });
});
