/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utility class which exposes functions for managing date and time operations.
 */
export class TimeUtils {

    /**
     * return the current time in Unix time (seconds).
     */
    static nowSeconds(): number {
        // Date.getTime() returns in milliseconds.
        return Math.round(new Date().getTime() / 1000.0);
    }
}
