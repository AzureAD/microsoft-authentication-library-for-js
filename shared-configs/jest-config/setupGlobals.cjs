/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const crypto = require("crypto");
const { TextDecoder, TextEncoder } = require("util");
const { BroadcastChannel, MessageChannel } = require("worker_threads");
const { createBroadcastChannelTracker } = require("./BroadcastChannelTracker");

// Create BroadcastChannel tracker for browser/jsdom environment
const {
    TrackedBroadcastChannel,
    cleanupBroadcastChannels,
    forceCleanupBroadcastChannels
} = createBroadcastChannelTracker(() => BroadcastChannel);

// Add cleanup functions to global for use in test setup files
global.cleanupMsalBroadcastChannels = cleanupBroadcastChannels;
global.forceCleanupMsalBroadcastChannels = forceCleanupBroadcastChannels;

try {
    Object?.defineProperties(global.self, {
        crypto: {
            value: {
                subtle: crypto.webcrypto.subtle,
                getRandomValues(dataBuffer) {
                    return crypto.randomFillSync(dataBuffer);
                },
                randomUUID() {
                    return crypto.randomUUID();
                },
            },
        },
        TextDecoder: {
            value: TextDecoder,
        },
        TextEncoder: {
            value: TextEncoder,
        },
        BroadcastChannel: {
            value: TrackedBroadcastChannel,
        },
        MessageChannel: {
            value: MessageChannel,
        },
    });
} catch (e) {
    // catch silently for non-browser tests
}
