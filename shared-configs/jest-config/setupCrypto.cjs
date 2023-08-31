/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const crypto = require("crypto");
const { TextDecoder, TextEncoder } = require("util");

try {
    Object?.defineProperties(global.self, {
        "crypto": {
            value: {
                subtle: crypto.webcrypto.subtle,
                getRandomValues(dataBuffer) {
                    return crypto.randomFillSync(dataBuffer);
                },
                randomUUID() {
                    return crypto.randomUUID();
                },
            }
        },
        "TextDecoder": {
            value: TextDecoder
        },
        "TextEncoder": {
            value: TextEncoder
        }
    });
} catch (e) {
    // catch silently for non-browser tests
}
