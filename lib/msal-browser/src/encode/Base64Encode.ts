/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-common";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";

/**
 * Class which exposes APIs to encode plaintext to base64 encoded string. See here for implementation details:
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64
 */
export class Base64Encode {
    
    /**
     * Returns URL Safe b64 encoded string from a plaintext string.
     * @param input 
     */
    urlEncode(input: string): string {
        return encodeURIComponent(this.encode(input)
            .replace(/=/g, Constants.EMPTY_STRING)
            .replace(/\+/g, "-")
            .replace(/\//g, "_"));
    }

    /**
     * Returns URL Safe b64 encoded string from an int8Array.
     * @param inputArr 
     */
    urlEncodeArr(inputArr: Uint8Array): string {
        return this.base64EncArr(inputArr)
            .replace(/=/g, Constants.EMPTY_STRING)
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }

    /**
     * Returns b64 encoded string from plaintext string.
     * @param input 
     */
    encode(input: string): string {
        const inputUtf8Arr = BrowserStringUtils.stringToUtf8Arr(input);
        return this.base64EncArr(inputUtf8Arr);
    }

    /**
     * Base64 encode byte array
     * @param aBytes 
     */
    private base64EncArr(aBytes: Uint8Array): string {  
        const eqLen = (3 - (aBytes.length % 3)) % 3;
        let sB64Enc = Constants.EMPTY_STRING;
      
        for (let nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            /* Uncomment the following line in order to split the output in lines 76-character long: */
            /*
             *if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
             */
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(
                    this.uint6ToB64(nUint24 >>> 18 & 63), 
                    this.uint6ToB64(nUint24 >>> 12 & 63), 
                    this.uint6ToB64(nUint24 >>> 6 & 63), 
                    this.uint6ToB64(nUint24 & 63)
                );
                nUint24 = 0;
            }
        }

        return  eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? "=" : "==");
    }

    /**
     * Base64 string to array encoding helper
     * @param nUint6 
     */
    private uint6ToB64 (nUint6: number): number {
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
}
