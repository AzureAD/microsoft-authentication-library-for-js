/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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

    /**
     * toLower
     *
     * @param arr
     */
    static trimAndConvertArrayEntriesToLowerCase(arr: Array<string>): Array<string> {
        return arr.map(entry => entry.toLowerCase().trim());
    }

    static extractUserGivenState(stateString: string) {
        if (stateString) {
            const splitIndex = stateString.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < stateString.length) {
                return stateString.substring(splitIndex + 1);
            }
        }
        return stateString;
    }
}
