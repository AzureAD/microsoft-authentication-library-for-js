/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export class CryptoUtils {

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

    /**
     * deserialize a string
     *
     * @param query
     */
    static deserialize(query: string): any {
        let match: Array<string>; // Regex for replacing addition symbol with a space
        const pl = /\+/g;
        const search = /([^&=]+)=([^&]*)/g;
        const decode = (s: string) => decodeURIComponent(s.replace(pl, " "));
        const obj: {} = {};
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        return obj;
    }
}
