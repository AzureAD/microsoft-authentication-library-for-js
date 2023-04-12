/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import MockBridge from "../naa/MockBridge";

beforeAll(() => {
    const crypto = require("crypto");

    Object.defineProperty(global, "crypto", {
        value: {
            randomUUID: () => crypto.randomUUID(),
        },
    });

    if (typeof window !== "undefined") {
        /*
         * JSDOM get's used except for tests that we're marked with node test environment
         * that's done to simulate server side usage of the library
         */
        window.nestedAppAuthBridge = new MockBridge();
    }
});
afterAll(() => {});
