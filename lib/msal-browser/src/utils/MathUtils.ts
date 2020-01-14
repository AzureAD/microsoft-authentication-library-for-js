/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utility class for math specific functions in browser.
 */
export class MathUtils {

    /**
     * Decimal to Hex
     *
     * @param num
     */
    static decimalToHex(num: number): string {
        let hex: string = num.toString(16);
        while (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    }
}
