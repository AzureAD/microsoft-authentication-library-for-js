/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const crypto = require("crypto");
const { TextDecoder, TextEncoder } = require("util");
const { BroadcastChannel } = require("worker_threads");

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
        },
        "BroadcastChannel": {
            value: BroadcastChannel
        }
    });
} catch (e) {
    // catch silently for non-browser tests
}
