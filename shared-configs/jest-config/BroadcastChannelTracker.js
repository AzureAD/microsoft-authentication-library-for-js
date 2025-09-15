/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Shared BroadcastChannel tracking utility for test environments.
 * This module provides consistent tracking and cleanup functionality
 * across different test environments (browser/jsdom and Node.js).
 */

/**
 * Creates a BroadcastChannel tracker for a given environment
 * @param {Function} getBroadcastChannel - Function that returns the BroadcastChannel constructor for the environment
 * @returns {Object} Object containing TrackedBroadcastChannel class and cleanup functions
 */
function createBroadcastChannelTracker(getBroadcastChannel) {
    const activeBroadcastChannels = new Set();
    const OriginalBroadcastChannel = getBroadcastChannel();

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

    // Basic cleanup function
    function cleanupBroadcastChannels() {
        activeBroadcastChannels.forEach((channel) => {
            try {
                channel.close();
            } catch (error) {
                // Ignore cleanup errors
            }
        });
        activeBroadcastChannels.clear();
    }

    // Enhanced cleanup function with additional reset logic
    function forceCleanupBroadcastChannels() {
        // First try graceful cleanup
        cleanupBroadcastChannels();

        // Add more aggressive cleanup if needed for browser environments
        if (typeof window !== "undefined" && window.BroadcastChannel) {
            // Reset to original BroadcastChannel to prevent further leaks
            window.BroadcastChannel = OriginalBroadcastChannel;
            // Then restore tracked version
            window.BroadcastChannel = TrackedBroadcastChannel;
        }

        // Clear any remaining instances in case some weren't tracked
        activeBroadcastChannels.clear();
    }

    return {
        TrackedBroadcastChannel,
        cleanupBroadcastChannels,
        forceCleanupBroadcastChannels,
        OriginalBroadcastChannel
    };
}

// Node.js-specific setup for @jest-environment node tests
// This automatically sets up BroadcastChannel tracking when this module is imported
if (typeof window === "undefined" && typeof global !== "undefined") {
    // Create BroadcastChannel tracker for Node.js environment
    const {
        TrackedBroadcastChannel,
        cleanupBroadcastChannels
    } = createBroadcastChannelTracker(() => {
        const { BroadcastChannel } = require('worker_threads');
        return BroadcastChannel;
    });

    // Replace global BroadcastChannel with tracked version
    global.BroadcastChannel = TrackedBroadcastChannel;

    // Add cleanup hooks for Node.js test environment
    if (typeof afterEach !== "undefined" && typeof afterAll !== "undefined") {
        afterEach(cleanupBroadcastChannels);
        afterAll(cleanupBroadcastChannels);
    }
}

module.exports = {
    createBroadcastChannelTracker
};
