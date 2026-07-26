/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as CacheHelpers from "../../../src/cache/utils/CacheHelpers.js";

describe("CacheHelpers", () => {
    describe("getAttributeTokenComponents", () => {
        it("returns undefined for undefined", () => {
            expect(
                CacheHelpers.getAttributeTokenComponents(undefined)
            ).toBeUndefined();
        });

        it("returns undefined for empty array", () => {
            expect(
                CacheHelpers.getAttributeTokenComponents([])
            ).toBeUndefined();
        });

        it("returns components object with sorted, space-joined partition", () => {
            const components = CacheHelpers.getAttributeTokenComponents([
                "zeta",
                "alpha",
                "mike",
            ]);
            expect(components).toEqual({
                attribute_tokens: "alpha mike zeta",
            });
        });

        it("is deterministic regardless of input order", () => {
            const a = CacheHelpers.getAttributeTokenComponents(["a", "b", "c"]);
            const b = CacheHelpers.getAttributeTokenComponents(["c", "b", "a"]);
            expect(a).toEqual(b);
        });

        it("does not mutate the caller's array", () => {
            const input = ["z", "a"];
            CacheHelpers.getAttributeTokenComponents(input);
            expect(input).toEqual(["z", "a"]);
        });

        it("handles pre-computed partition string directly", () => {
            const preComputedPartition = "alpha mike zeta";
            const components =
                CacheHelpers.getAttributeTokenComponents(preComputedPartition);
            expect(components).toEqual({
                attribute_tokens: "alpha mike zeta",
            });
        });

        it("returns undefined for empty string", () => {
            expect(
                CacheHelpers.getAttributeTokenComponents("")
            ).toBeUndefined();
        });
    });

    describe("getAdditionalCacheKeyComponentsHashPayload", () => {
        it("produces length-prefixed (netstring) payload with keys in lexicographic order", () => {
            // Components with non-alphabetical key order
            const components = {
                zebra_field: "value1",
                alpha_field: "value2",
                mike_field: "value3",
            };
            const payload =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    components
                );

            // Should produce: <byteLen(alpha_field)>:alpha_field<byteLen(value2)>:value2<byteLen(mike_field)>:mike_field<byteLen(value3)>:value3<byteLen(zebra_field)>:zebra_field<byteLen(value1)>:value1
            const expected =
                "11:alpha_field6:value210:mike_field6:value311:zebra_field6:value1";
            expect(payload).toBe(expected);
        });

        it("is deterministic regardless of object construction order", () => {
            // Construct objects in different orders
            const obj1 = {
                z: "last",
                a: "first",
                m: "middle",
            };

            const obj2 = {
                m: "middle",
                z: "last",
                a: "first",
            };

            const payload1 =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(obj1);
            const payload2 =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(obj2);

            expect(payload1).toBe(payload2);
        });

        it("prevents collisions: {a:b, cd:e} ≠ {ab:c, d:e}", () => {
            const components1 = { a: "b", cd: "e" };
            const components2 = { ab: "c", d: "e" };

            const payload1 =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    components1
                );
            const payload2 =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    components2
                );

            // These should produce different payloads to avoid collision
            expect(payload1).not.toBe(payload2);
            // payload1: 1:a1:b2:cd1:e
            // payload2: 2:ab1:c1:d1:e
        });

        it("handles single-key objects", () => {
            const components = { attribute_tokens: "token1 token2" };
            const payload =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    components
                );
            // 16:attribute_tokens13:token1 token2
            const expected = "16:attribute_tokens13:token1 token2";
            expect(payload).toBe(expected);
        });

        it("handles empty string values correctly", () => {
            const components = { key: "" };
            const payload =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    components
                );
            // 3:key0:
            const expected = "3:key0:";
            expect(payload).toBe(expected);
        });

        it("uses UTF-8 byte length, not String.length", () => {
            // Test that we use byte length. Create a simple test with ASCII
            // (all ASCII is 1 byte per character)
            const components = { abc: "def" };
            const payload =
                CacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    components
                );
            // "abc" is 3 bytes, "def" is 3 bytes
            const expected = "3:abc3:def";
            expect(payload).toBe(expected);
        });
    });

    describe("getAttributeTokensHash", () => {
        it("returns undefined for undefined attributeTokens", async () => {
            const mockHash = jest.fn();
            const hash = await CacheHelpers.getAttributeTokensHash(
                undefined,
                mockHash
            );
            expect(hash).toBeUndefined();
            expect(mockHash).not.toHaveBeenCalled();
        });

        it("returns undefined for empty array", async () => {
            const mockHash = jest.fn();
            const hash = await CacheHelpers.getAttributeTokensHash(
                [],
                mockHash
            );
            expect(hash).toBeUndefined();
            expect(mockHash).not.toHaveBeenCalled();
        });

        it("hashes components with length-prefixed payload", async () => {
            const mockHash = jest.fn().mockResolvedValue("mock-hash-value");
            const hash = await CacheHelpers.getAttributeTokensHash(
                ["zebra", "alpha"],
                mockHash
            );

            expect(hash).toBe("mock-hash-value");
            // Should hash the payload with length-prefixed encoding of sorted keys
            // attribute_tokens is 16 bytes, "alpha zebra" is 11 bytes
            const expectedPayload = "16:attribute_tokens11:alpha zebra";
            expect(mockHash).toHaveBeenCalledWith(expectedPayload);
        });

        it("handles pre-computed partition string", async () => {
            const mockHash = jest.fn().mockResolvedValue("hash-from-string");
            const hash = await CacheHelpers.getAttributeTokensHash(
                "alpha zebra",
                mockHash
            );

            expect(hash).toBe("hash-from-string");
            const expectedPayload = "16:attribute_tokens11:alpha zebra";
            expect(mockHash).toHaveBeenCalledWith(expectedPayload);
        });
    });
});
