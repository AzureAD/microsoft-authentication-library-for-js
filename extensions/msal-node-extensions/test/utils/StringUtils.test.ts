/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils } from "../../src/utils/StringUtils.js";

describe("StringUtils", () => {
    describe("tagToString tests", () => {
        it("Returns 'UNTAG' for tag value 0", () => {
            expect(StringUtils.tagToString(0)).toBe("UNTAG");
        });

        it("Converts numeric tag to 5-character string", () => {
            const tag = 0x01234567;
            const result = StringUtils.tagToString(tag);

            expect(result).toHaveLength(5);
            expect(typeof result).toBe("string");
        });

        it("Produce same results for same input", () => {
            const tag = 0x12345678;
            const result1 = StringUtils.tagToString(tag);
            const result2 = StringUtils.tagToString(tag);

            expect(result1).toBe(result2);
        });
    });
});
