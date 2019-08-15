// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
export class StringUtils {
    /**
     * Check if a string is empty
     *
     * @param str
     */
    static isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }
}