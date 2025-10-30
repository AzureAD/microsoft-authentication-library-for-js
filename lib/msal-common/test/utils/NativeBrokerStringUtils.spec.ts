/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NativeBrokerStringUtils } from "../../src/utils/NativeBrokerStringUtils.js";

describe("NativeBrokerStringUtils", () => {
    describe("tagToString tests", () => {
        it("Returns 'UNTAG' for tag value 0", () => {
            expect(NativeBrokerStringUtils.tagToString(0)).toBe("UNTAG");
        });

        it("Converts numeric tag to 5-character string", () => {
            const tag = 0x01234567;
            const result = NativeBrokerStringUtils.tagToString(tag);

            expect(result).toHaveLength(5);
            expect(typeof result).toBe("string");
        });

        it("Produce same results for same input", () => {
            const tag = 0x12345678;
            const result1 = NativeBrokerStringUtils.tagToString(tag);
            const result2 = NativeBrokerStringUtils.tagToString(tag);

            expect(result1).toBe(result2);
        });
    });
});
