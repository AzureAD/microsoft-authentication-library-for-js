/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const crypto = require("crypto");

try {
    Object?.defineProperty(global.self, "crypto", {
        value: {
            subtle: crypto.webcrypto.subtle,
            getRandomValues(dataBuffer) {
                return crypto.randomFillSync(dataBuffer);
            },
            randomUUID() {
                return crypto.randomUUID();
            },
        },
    });
} catch (e) {
    // catch silently for non-browser tests
}
