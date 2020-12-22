/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "../src";
import { expect } from "chai";

describe("Logger.ts", () => {

    it("exposes pii logging boolean", () => {
        const logger: Logger = new Logger(() => {}, {
            piiLoggingEnabled: true
        });
        expect(logger.isPiiLoggingEnabled()).to.be.true;
    });

    it("pii logging boolean defaults false", () => {
        const logger: Logger = new Logger(() => {});
        expect(logger.isPiiLoggingEnabled()).to.be.false;
    });

});
