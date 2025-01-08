/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utility class for string operations.
 */
export class StringUtils {
    /**
     * Trims the specified characters from the input string.
     * @param input The string to trim.
     * @param charsToTrim The characters to trim from the input string.
     * @returns The trimmed string.
     */
    static trim(input: string, charsToTrim?: string): string {
        if (!input) {
            return input;
        }

        if (!charsToTrim) {
            return input.trim();
        }

        const regex = new RegExp(`^[${charsToTrim}]+|[${charsToTrim}]+$`, "g");
        return input.replace(regex, "");
    }
}
