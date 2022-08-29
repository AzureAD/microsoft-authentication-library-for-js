/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants , IGuidGenerator } from "@azure/msal-common";
import { MathUtils } from "../utils/MathUtils";
import { BrowserCrypto } from "./BrowserCrypto";
export class GuidGenerator implements IGuidGenerator {

    // browser crypto object used to generate random values
    private cryptoObj: BrowserCrypto;

    constructor(cryptoObj: BrowserCrypto) {
        this.cryptoObj = cryptoObj;
    }

    /*
     * RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
     * pseudo-random numbers.
     * The algorithm is as follows:
     *     Set the two most significant bits (bits 6 and 7) of the
     *        clock_seq_hi_and_reserved to zero and one, respectively.
     *     Set the four most significant bits (bits 12 through 15) of the
     *        time_hi_and_version field to the 4-bit version number from
     *        Section 4.1.3. Version4
     *     Set all the other bits to randomly (or pseudo-randomly) chosen
     *     values.
     * UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
     * time-low               = 4hexOctet
     * time-mid               = 2hexOctet
     * time-high-and-version  = 2hexOctet
     * clock-seq-and-reserved = hexOctet:
     * clock-seq-low          = hexOctet
     * node                   = 6hexOctet
     * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     * y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
     * y values are 8, 9, A, B
     */
    generateGuid(): string {
        try {
            const buffer: Uint8Array = new Uint8Array(16);
            this.cryptoObj.getRandomValues(buffer);

            // buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
            buffer[6] |= 0x40; // buffer[6] | 01000000 will set the 6 bit to 1.
            buffer[6] &= 0x4f; // buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".

            // buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
            buffer[8] |= 0x80; // buffer[8] | 10000000 will set the 7 bit to 1.
            buffer[8] &= 0xbf; // buffer[8] & 10111111 will set the 6 bit to 0.

            return MathUtils.decimalToHex(buffer[0]) + MathUtils.decimalToHex(buffer[1])
                + MathUtils.decimalToHex(buffer[2]) + MathUtils.decimalToHex(buffer[3])
                + "-" + MathUtils.decimalToHex(buffer[4]) + MathUtils.decimalToHex(buffer[5])
                + "-" + MathUtils.decimalToHex(buffer[6]) + MathUtils.decimalToHex(buffer[7])
                + "-" + MathUtils.decimalToHex(buffer[8]) + MathUtils.decimalToHex(buffer[9])
                + "-" + MathUtils.decimalToHex(buffer[10]) + MathUtils.decimalToHex(buffer[11])
                + MathUtils.decimalToHex(buffer[12]) + MathUtils.decimalToHex(buffer[13])
                + MathUtils.decimalToHex(buffer[14]) + MathUtils.decimalToHex(buffer[15]);
        }
        catch (err) {
            const guidHolder: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            const hex: string = "0123456789abcdef";
            let r: number = 0;
            let guidResponse: string = Constants.EMPTY_STRING;
            for (let i: number = 0; i < 36; i++) {
                if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
                    // each x and y needs to be random
                    r = Math.random() * 16 | 0;
                }
                if (guidHolder[i] === "x") {
                    guidResponse += hex[r];
                } else if (guidHolder[i] === "y") {
                    // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                    r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                    r |= 0x8; // set pos 3 to 1 as 1???
                    guidResponse += hex[r];
                } else {
                    guidResponse += guidHolder[i];
                }
            }
            return guidResponse;
        }
    }

    /**
     * verifies if a string is  GUID
     * @param guid
     */
    isGuid(guid: string): boolean {
        const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regexGuid.test(guid);
    }
}
