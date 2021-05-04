/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "mocha";
import { expect } from "chai";
import { ThrottlingEntity } from "../../../src/cache/entities/ThrottlingEntity";
import { ThrottlingConstants, Separators } from "../../../src/utils/Constants";
import { TEST_CONFIG } from "../../test_kit/StringConstants";

describe("ThrottlingEntity", () => {
    describe("isThrottlingEntity", () => {

        const key = ThrottlingConstants.THROTTLING_PREFIX + Separators.CACHE_KEY_SEPARATOR + TEST_CONFIG.MSAL_CLIENT_ID;
        it("Verifies if an object is a ThrottlingEntity", () => {
            const throttlingObject = {
                throttleTime: 0
            };
            expect(ThrottlingEntity.isThrottlingEntity(key, throttlingObject)).to.be.true;

        });

        it("Verifies if an object is a ThrottlingEntity when no object is given", () => {
            expect(ThrottlingEntity.isThrottlingEntity(key)).to.be.true;
            expect(ThrottlingEntity.isThrottlingEntity(key, null)).to.be.true;
        });

        it("Verifies if an object is not a ThrottlingEntity based on field", () => {
            const throttlingObject = {
                test: 0
            };
            expect(ThrottlingEntity.isThrottlingEntity(key, throttlingObject)).to.be.false;
        });

        it("Verifies if an object is not a ThrottlingEntity based on key", () => {
            const throttlingObject = {
                throttleTime: 0
            };
            expect(ThrottlingEntity.isThrottlingEntity("asd", throttlingObject)).to.be.false;
            expect(ThrottlingEntity.isThrottlingEntity("", throttlingObject)).to.be.false;
            expect(ThrottlingEntity.isThrottlingEntity(null, throttlingObject)).to.be.false;
        });
    });
});
