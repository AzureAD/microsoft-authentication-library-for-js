/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as AttributeTokenCacheHelpers from "../../../src/cache/utils/AttributeTokenCacheHelpers.js";

describe("AttributeTokenCacheHelpers", () => {
    describe("getAttributeTokenPartitionKey", () => {
        it("returns bearer partition for undefined", () => {
            expect(
                AttributeTokenCacheHelpers.getAttributeTokenPartitionKey(
                    undefined
                )
            ).toBe(AttributeTokenCacheHelpers.ATTRIBUTE_TOKEN_BEARER_PARTITION);
        });

        it("returns bearer partition for empty array", () => {
            expect(
                AttributeTokenCacheHelpers.getAttributeTokenPartitionKey([])
            ).toBe(AttributeTokenCacheHelpers.ATTRIBUTE_TOKEN_BEARER_PARTITION);
        });

        it("returns sorted, space-joined attribute_tokens:<...> partition", () => {
            expect(
                AttributeTokenCacheHelpers.getAttributeTokenPartitionKey([
                    "zeta",
                    "alpha",
                    "mike",
                ])
            ).toBe("attribute_tokens:alpha mike zeta");
        });

        it("is deterministic regardless of input order", () => {
            const a = AttributeTokenCacheHelpers.getAttributeTokenPartitionKey([
                "a",
                "b",
                "c",
            ]);
            const b = AttributeTokenCacheHelpers.getAttributeTokenPartitionKey([
                "c",
                "b",
                "a",
            ]);
            expect(a).toBe(b);
        });

        it("does not mutate the caller's array", () => {
            const input = ["z", "a"];
            AttributeTokenCacheHelpers.getAttributeTokenPartitionKey(input);
            expect(input).toEqual(["z", "a"]);
        });
    });

    describe("buildAttributeTokenAdditionalCacheKeyComponents", () => {
        it("returns undefined for bearer partition", () => {
            expect(
                AttributeTokenCacheHelpers.buildAttributeTokenAdditionalCacheKeyComponents(
                    AttributeTokenCacheHelpers.ATTRIBUTE_TOKEN_BEARER_PARTITION
                )
            ).toBeUndefined();
        });

        it("returns record keyed by attribute_tokens for non-bearer partition", () => {
            const components =
                AttributeTokenCacheHelpers.buildAttributeTokenAdditionalCacheKeyComponents(
                    "attribute_tokens:alpha zeta"
                );
            expect(components).toEqual({
                attribute_tokens: "attribute_tokens:alpha zeta",
            });
        });
    });

    describe("getAdditionalCacheKeyComponentsHashPayload", () => {
        it("returns undefined for undefined components", () => {
            expect(
                AttributeTokenCacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    undefined
                )
            ).toBeUndefined();
        });

        it("returns undefined for empty object", () => {
            expect(
                AttributeTokenCacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    {}
                )
            ).toBeUndefined();
        });

        it("emits sorted key-value concatenation with no separators", () => {
            expect(
                AttributeTokenCacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    { z: "1", a: "2" }
                )
            ).toBe("a2z1");
        });

        it("produces identical payload regardless of key insertion order", () => {
            const a =
                AttributeTokenCacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    { attribute_tokens: "p1", foo: "bar" }
                );
            const b =
                AttributeTokenCacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
                    { foo: "bar", attribute_tokens: "p1" }
                );
            expect(a).toBe(b);
        });
    });
});
