import { ClientAuthError } from "../error/ClientAuthError";
import { CacheUtils } from "./CacheUtils";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The PKCECodes type describes the structure
 * of objects that contain PKCE code
 * challenge and verifier pairs
 */
export type PKCECodes = {
    verifier: string,
    challenge: string
};

const CV_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const RANDOM_BYTE_ARR_LENGTH = 32;

/**
 * @hidden
 */
export class CryptoUtils {

    /**
     * Creates a new random GUID - used to populate state?
     * @returns string (GUID)
     */
    static createNewGuid(): string {
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

        const cryptoObj: Crypto = window.crypto; // for IE 11
        if (cryptoObj && cryptoObj.getRandomValues) {
            const buffer: Uint8Array = new Uint8Array(16);
            cryptoObj.getRandomValues(buffer);

            // buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
            buffer[6] |= 0x40; // buffer[6] | 01000000 will set the 6 bit to 1.
            buffer[6] &= 0x4f; // buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".

            // buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
            buffer[8] |= 0x80; // buffer[8] | 10000000 will set the 7 bit to 1.
            buffer[8] &= 0xbf; // buffer[8] & 10111111 will set the 6 bit to 0.

            return CryptoUtils.decimalToHex(buffer[0]) + CryptoUtils.decimalToHex(buffer[1])
                + CryptoUtils.decimalToHex(buffer[2]) + CryptoUtils.decimalToHex(buffer[3])
                + "-" + CryptoUtils.decimalToHex(buffer[4]) + CryptoUtils.decimalToHex(buffer[5])
                + "-" + CryptoUtils.decimalToHex(buffer[6]) + CryptoUtils.decimalToHex(buffer[7])
                + "-" + CryptoUtils.decimalToHex(buffer[8]) + CryptoUtils.decimalToHex(buffer[9])
                + "-" + CryptoUtils.decimalToHex(buffer[10]) + CryptoUtils.decimalToHex(buffer[11])
                + CryptoUtils.decimalToHex(buffer[12]) + CryptoUtils.decimalToHex(buffer[13])
                + CryptoUtils.decimalToHex(buffer[14]) + CryptoUtils.decimalToHex(buffer[15]);
        }
        else {
            const guidHolder: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            const hex: string = "0123456789abcdef";
            let r: number = 0;
            let guidResponse: string = "";
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

    // #region Base64 Encode/Decode

    // Implementation derived from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64

    private static b64ToUint6 (charNum: number) {
        return charNum > 64 && charNum < 91 ?
            charNum - 65
            : charNum > 96 && charNum < 123 ? 
                charNum - 71
                : charNum > 47 && charNum < 58 ?
                    charNum + 4
                    : charNum === 43 ?
                        62
                        : charNum === 47 ?
                            63
                            :
                            0;
    }
    
    private static base64DecToArr (base64String: string, nBlockSize?: number) {
        const sB64Enc = base64String.replace(/[^A-Za-z0-9\+\/]/g, "");
        const nInLen = sB64Enc.length;
        const nOutLen = nBlockSize ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockSize) * nBlockSize : nInLen * 3 + 1 >>> 2;
        const aBytes = new Uint8Array(nOutLen);

        for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= CryptoUtils.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    aBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0;
            }
        }

        return aBytes;
    }
      
    /* Base64 string to array encoding */  
    private static uint6ToB64 (nUint6: number) {
        return nUint6 < 26 ?
            nUint6 + 65
            : nUint6 < 52 ?
                nUint6 + 71
                : nUint6 < 62 ?
                    nUint6 - 4
                    : nUint6 === 62 ?
                        43
                        : nUint6 === 63 ?
                            47
                            :
                            65;
    }

    private static base64EncArr (aBytes: Uint8Array) {  
        const eqLen = (3 - (aBytes.length % 3)) % 3;
        let sB64Enc = "";
      
        for (let nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            /* Uncomment the following line in order to split the output in lines 76-character long: */
            /*
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
            */
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(
                    CryptoUtils.uint6ToB64(nUint24 >>> 18 & 63), 
                    CryptoUtils.uint6ToB64(nUint24 >>> 12 & 63), 
                    CryptoUtils.uint6ToB64(nUint24 >>> 6 & 63), 
                    CryptoUtils.uint6ToB64(nUint24 & 63)
                );
                nUint24 = 0;
            }
        }

        return  eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? "=" : "==");
    }

    private static utf8ArrToString (aBytes: Uint8Array): string {
        let sView = "";
        for (let nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
            nPart = aBytes[nIdx];
            sView += String.fromCharCode(
                nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
                    /* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
                    (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                    : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
                        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                        : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
                            (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                            : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
                                (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
                                : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
                                    (nPart - 192 << 6) + aBytes[++nIdx] - 128
                                    : /* nPart < 127 ? */ /* one byte */
                                    nPart
            );
        }
        return sView;
    }
    
    private static stringToUtf8Arr (sDOMStr: string): Uint8Array {
        let nChr;
        let nArrLen = 0;
        const nStrLen = sDOMStr.length;
        /* mapping... */
        for (let nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
            nChr = sDOMStr.charCodeAt(nMapIdx);
            nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
        }

        const aBytes = new Uint8Array(nArrLen);

        /* transcription... */

        for (let nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
            nChr = sDOMStr.charCodeAt(nChrIdx);
            if (nChr < 128) {
                /* one byte */
                aBytes[nIdx++] = nChr;
            } else if (nChr < 0x800) {
                /* two bytes */
                aBytes[nIdx++] = 192 + (nChr >>> 6);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x10000) {
                /* three bytes */
                aBytes[nIdx++] = 224 + (nChr >>> 12);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x200000) {
                /* four bytes */
                aBytes[nIdx++] = 240 + (nChr >>> 18);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else if (nChr < 0x4000000) {
                /* five bytes */
                aBytes[nIdx++] = 248 + (nChr >>> 24);
                aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            } else /* if (nChr <= 0x7fffffff) */ {
                /* six bytes */
                aBytes[nIdx++] = 252 + (nChr >>> 30);
                aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
                aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
                aBytes[nIdx++] = 128 + (nChr & 63);
            }
        }

        return aBytes;      
    }

    /**
     * encoding string to base64 - platform specific check
     *
     * @param input
     */
    static base64Encode(input: string): string {
        const inputUtf8Arr = this.stringToUtf8Arr(encodeURIComponent(input));
        return this.base64EncArr(inputUtf8Arr);
    }

    /**
     * encoding string to base64 specifically for URLs
     *
     * @param input
     */
    static base64UrlEncode(input: string): string {
        return this.base64Encode(input)
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }

    static base64UrlEncodeArr(inputArr: Uint8Array): string {
        return this.base64EncArr(inputArr)
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }

    /**
     * Decodes a base64 encoded string.
     *
     * @param input
     */
    static base64Decode(input: string): string {
        let encodedString = input.replace(/-/g, "+").replace(/_/g, "/");
        switch (encodedString.length % 4) {
            case 0:
                break;
            case 2:
                encodedString += "==";
                break;
            case 3:
                encodedString += "=";
                break;
            default:
                throw new Error("Invalid base64 string");
        }

        const inputUtf8Arr = this.base64DecToArr(encodedString);
        return decodeURIComponent(this.utf8ArrToString(inputUtf8Arr));
    }

    // #endregion

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

    static async generatePKCECodes(): Promise<PKCECodes> {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallengeFromVerifier(codeVerifier);
        return {
            verifier: codeVerifier,
            challenge: codeChallenge
        };
    }

    /**
     * Generates a random 32 byte buffer and returns the base64
     * encoded string to be used as a PKCE Code Verifier
     */
    private static generateCodeVerifier(): string {
        const cryptoObj: Crypto = window.crypto;
        if (cryptoObj && cryptoObj.getRandomValues) {
            // Generate random values as utf-8
            const buffer: Uint8Array = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
            cryptoObj.getRandomValues(buffer);
            console.log("Verifier rands: " + JSON.stringify(buffer));
            // verifier as string
            const pkceCodeVerifierString = this.bufferToCVString(buffer);
            console.log("Verifier decoded: " + JSON.stringify(pkceCodeVerifierString));
            // encode verifier as base64
            const pkceCodeVerifierB64: string = CryptoUtils.base64UrlEncode(pkceCodeVerifierString);
            console.log("Verifier string: " + JSON.stringify(pkceCodeVerifierB64));
            return pkceCodeVerifierB64;
        } else {
            throw ClientAuthError.createPKCENotGeneratedError(`window.crypto or getRandomValues does not exist. Crypto object: ${cryptoObj}`);
        }
    }

    private static bufferToCVString(buffer: Uint8Array): string {
        const charArr = [];
        for (let i = 0; i < buffer.byteLength; i += 1) {
            const index = buffer[i] % CV_CHARSET.length;
            charArr.push(CV_CHARSET[index]);
        }
        return charArr.join("");
    }

    /**
     * Creates a base64 encoded PKCE Code Challenge string from the
     * hash created from the PKCE Code Verifier supplied
     */
    private static async generateCodeChallengeFromVerifier(pkceCodeVerifier: string): Promise<string> {
        const cryptoObj: Crypto = window.crypto;
        if (cryptoObj && cryptoObj.subtle) {
            // encode verifier as utf-8
            const pkceCodeVerifierUtf8 = new TextEncoder().encode(pkceCodeVerifier);
            // hashed verifier
            const pkceHashedCodeVerifier = await cryptoObj.subtle.digest("SHA-256", pkceCodeVerifierUtf8);
            // encode hash as base64
            return this.base64UrlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
        } else {
            throw ClientAuthError.createPKCENotGeneratedError(`window.crypto or window.crypto.subtle does not exist. Crypto object: ${cryptoObj}`);
        }
    }
}
