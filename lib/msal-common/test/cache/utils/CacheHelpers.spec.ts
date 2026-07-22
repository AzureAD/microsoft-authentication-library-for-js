/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as CacheHelpers from "../../../src/cache/utils/CacheHelpers.js";

describe("CacheHelpers", () => {
    describe("getAttributeTokenPartitionKey", () => {
        it("returns undefined for undefined", () => {
            expect(
                CacheHelpers.getAttributeTokenPartitionKey(undefined)
            ).toBeUndefined();
        });

        it("returns undefined for empty array", () => {
            expect(
                CacheHelpers.getAttributeTokenPartitionKey([])
            ).toBeUndefined();
        });

        it("returns sorted, space-joined partition without a key prefix", () => {
            expect(
                CacheHelpers.getAttributeTokenPartitionKey([
                    "zeta",
                    "alpha",
                    "mike",
                ])
            ).toBe("alpha mike zeta");
        });

        it("is deterministic regardless of input order", () => {
            const a = CacheHelpers.getAttributeTokenPartitionKey([
                "a",
                "b",
                "c",
            ]);
            const b = CacheHelpers.getAttributeTokenPartitionKey([
                "c",
                "b",
                "a",
            ]);
            expect(a).toBe(b);
        });

        it("does not mutate the caller's array", () => {
            const input = ["z", "a"];
            CacheHelpers.getAttributeTokenPartitionKey(input);
            expect(input).toEqual(["z", "a"]);
        });
    });

    describe("buildAttributeTokenAdditionalCacheKeyComponents", () => {
        it("returns undefined for empty partition", () => {
            expect(
                CacheHelpers.buildAttributeTokenAdditionalCacheKeyComponents(
                    undefined
                )
            ).toBeUndefined();
        });

        it("returns record keyed by attribute_tokens for non-empty partition", () => {
            const components =
                CacheHelpers.buildAttributeTokenAdditionalCacheKeyComponents(
                    "alpha zeta"
                );
            expect(components).toEqual({
                attribute_tokens: "alpha zeta",
            });
        });
    });

    describe("getAdditionalCacheKeyComponentsHashPayload", () => {
        it("returns undefined for undefined components", () => {
            expect(
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    undefined
                )
            ).toBeUndefined();
        });

        it("returns undefined for empty object", () => {
            expect(
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload({})
            ).toBeUndefined();
        });

        it("emits canonical JSON with keys sorted lexicographically", () => {
            expect(
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload({
                    z: "1",
                    a: "2",
                })
            ).toBe('{"a":"2","z":"1"}');
        });

        it("produces identical payload regardless of key insertion order", () => {
            const a = CacheHelpers.getAdditionalCacheKeyComponentsHashPayload({
                attribute_tokens: "p1",
                foo: "bar",
            });
            const b = CacheHelpers.getAdditionalCacheKeyComponentsHashPayload({
                foo: "bar",
                attribute_tokens: "p1",
            });
            expect(a).toBe(b);
        });
    });
});
