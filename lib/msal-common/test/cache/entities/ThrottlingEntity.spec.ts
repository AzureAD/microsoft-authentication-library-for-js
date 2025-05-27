/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheHelpers } from "../../../src";
import * as Constants from "../../../src/utils/Constants.js";
import { TEST_CONFIG } from "../../test_kit/StringConstants";

describe("ThrottlingEntity", () => {
    describe("isThrottlingEntity", () => {
        const key =
            Constants.THROTTLING_PREFIX +
            Constants.CACHE_KEY_SEPARATOR +
            TEST_CONFIG.MSAL_CLIENT_ID;
        it("Verifies if an object is a ThrottlingEntity", () => {
            const throttlingObject = {
                throttleTime: 0,
            };
            expect(CacheHelpers.isThrottlingEntity(key, throttlingObject)).toBe(
                true
            );
        });

        it("Verifies if an object is a ThrottlingEntity when no object is given", () => {
            expect(CacheHelpers.isThrottlingEntity(key)).toBe(true);
            // @ts-ignore
            expect(CacheHelpers.isThrottlingEntity(key, null)).toBe(true);
        });

        it("Verifies if an object is not a ThrottlingEntity based on field", () => {
            const throttlingObject = {
                test: 0,
            };
            expect(CacheHelpers.isThrottlingEntity(key, throttlingObject)).toBe(
                false
            );
        });

        it("Verifies if an object is not a ThrottlingEntity based on key", () => {
            const throttlingObject = {
                throttleTime: 0,
            };
            expect(
                CacheHelpers.isThrottlingEntity("asd", throttlingObject)
            ).toBe(false);
            expect(CacheHelpers.isThrottlingEntity("", throttlingObject)).toBe(
                false
            );
            expect(
                // @ts-ignore
                CacheHelpers.isThrottlingEntity(null, throttlingObject)
            ).toBe(false);
        });
    });
});
