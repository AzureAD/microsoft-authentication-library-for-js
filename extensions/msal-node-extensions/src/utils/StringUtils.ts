/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class StringUtils {
    /**
     * Converts a numeric tag to a string representation
     * @param tag - The numeric tag to convert
     * @returns The string representation of the tag
     */
    static tagToString(tag: number): string {
        if (tag === 0) {
            return "UNTAG";
        }

        const tagSymbolSpace =
            "abcdefghijklmnopqrstuvwxyz0123456789****************************";
        let tagBuffer = "*****";

        const chars = [
            tagSymbolSpace[(tag >> 24) & 0x3f],
            tagSymbolSpace[(tag >> 18) & 0x3f],
            tagSymbolSpace[(tag >> 12) & 0x3f],
            tagSymbolSpace[(tag >> 6) & 0x3f],
            tagSymbolSpace[(tag >> 0) & 0x3f],
        ];

        tagBuffer = chars.join("");

        return tagBuffer;
    }
}
