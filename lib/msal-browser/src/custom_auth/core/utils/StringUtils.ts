/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utility class for string operations.
 */
export class StringUtils {
    /**
     * Trims the slashes from the input string.
     * @param input The string to trim.
     * @returns The trimmed string.
     */
    static trimSlashes(input: string): string {
        if (!input) {
            return input;
        }

        let trimmedInput = input;

        while (trimmedInput.startsWith("/")) {
            trimmedInput = trimmedInput.substring(1);
        }
        while (trimmedInput.endsWith("/")) {
            trimmedInput = trimmedInput.substring(0, trimmedInput.length - 1);
        }

        return trimmedInput;
    }
}
