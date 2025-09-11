/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const crypto = require("crypto");
const { TextDecoder, TextEncoder } = require("util");
const { BroadcastChannel, MessageChannel } = require("worker_threads");

// Track active BroadcastChannel instances for cleanup
const activeBroadcastChannels = new Set();

// Store the original BroadcastChannel
const OriginalBroadcastChannel = BroadcastChannel;

// Create a wrapped BroadcastChannel that tracks instances
class TrackedBroadcastChannel extends OriginalBroadcastChannel {
    constructor(name) {
        super(name);
        activeBroadcastChannels.add(this);
    }

    close() {
        super.close();
        activeBroadcastChannels.delete(this);
    }
}

// Add cleanup function to global
global.cleanupMsalBroadcastChannels = function () {
    activeBroadcastChannels.forEach((channel) => {
        try {
            channel.close();
        } catch (error) {
            // Ignore cleanup errors
        }
    });
    activeBroadcastChannels.clear();
};

// Enhanced cleanup function that also cleans up listeners
global.forceCleanupMsalBroadcastChannels = function () {
    // First try graceful cleanup
    global.cleanupMsalBroadcastChannels();

    // Add more aggressive cleanup if needed
    if (typeof window !== "undefined" && window.BroadcastChannel) {
        // Reset to original BroadcastChannel to prevent further leaks
        window.BroadcastChannel = OriginalBroadcastChannel;
        // Then restore tracked version
        window.BroadcastChannel = TrackedBroadcastChannel;
    }

    // Clear any remaining instances in case some weren't tracked
    activeBroadcastChannels.clear();
};

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
