/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import crypto from "crypto";

try {
    Object?.defineProperty(global.self, "crypto", {
        value: {
            subtle: crypto.webcrypto.subtle,
            getRandomValues(dataBuffer: Uint8Array): Uint8Array {
                return crypto.randomFillSync(dataBuffer);
            },
            randomUUID: () => crypto.randomUUID(),
        },
    });
} catch (e) {
    // catch silently for non-browser tests
}
