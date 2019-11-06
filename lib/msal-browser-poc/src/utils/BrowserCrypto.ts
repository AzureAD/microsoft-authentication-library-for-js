/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientBrowserAuthError } from "../error/ClientBrowserAuthError";
import { PKCECodes } from "msal-common";

const CV_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const RANDOM_BYTE_ARR_LENGTH = 32;

export class BrowserCrypto {
    // #region Base64 Encode/Decode

    // Implementation derived from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_JavaScript's_UTF-16_%3E_UTF-8_%3E_base64

    private b64ToUint6 (charNum: number) {
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
    
    private base64DecToArr (base64String: string, nBlockSize?: number) {
        const sB64Enc = base64String.replace(/[^A-Za-z0-9\+\/]/g, "");
        const nInLen = sB64Enc.length;
        const nOutLen = nBlockSize ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockSize) * nBlockSize : nInLen * 3 + 1 >>> 2;
        const aBytes = new Uint8Array(nOutLen);

        for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
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
    private uint6ToB64 (nUint6: number) {
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

    private base64EncArr (aBytes: Uint8Array) {  
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

    private utf8ArrToString (aBytes: Uint8Array): string {
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
    
    private stringToUtf8Arr (sDOMStr: string): Uint8Array {
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
    base64Encode(input: string): string {
        const inputUtf8Arr = this.stringToUtf8Arr(encodeURIComponent(input));
        return this.base64EncArr(inputUtf8Arr);
    }

    /**
     * encoding string to base64 specifically for URLs
     *
     * @param input
     */
    base64UrlEncode(input: string): string {
        return this.base64Encode(input)
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }

    base64UrlEncodeArr(inputArr: Uint8Array): string {
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
    base64Decode(input: string): string {
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

    private bufferToCVString(buffer: Uint8Array): string {
        const charArr = [];
        for (let i = 0; i < buffer.byteLength; i += 1) {
            const index = buffer[i] % CV_CHARSET.length;
            charArr.push(CV_CHARSET[index]);
        }
        return charArr.join("");
    }

    // #endregion

    async generatePKCECodes(): Promise<PKCECodes> {
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
    private generateCodeVerifier(): string {
        const cryptoObj: Crypto = window.crypto;
        if (cryptoObj && cryptoObj.getRandomValues) {
            // Generate random values as utf-8
            const buffer: Uint8Array = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
            cryptoObj.getRandomValues(buffer);
            // verifier as string
            const pkceCodeVerifierString = this.bufferToCVString(buffer);
            // encode verifier as base64
            const pkceCodeVerifierB64: string = this.base64UrlEncode(pkceCodeVerifierString);
            return pkceCodeVerifierB64;
        } else {
            throw ClientBrowserAuthError.createPKCENotGeneratedError(`window.crypto or getRandomValues does not exist. Crypto object: ${cryptoObj}`);
        }
    }

    /**
     * Creates a base64 encoded PKCE Code Challenge string from the
     * hash created from the PKCE Code Verifier supplied
     */
    private async generateCodeChallengeFromVerifier(pkceCodeVerifier: string): Promise<string> {
        const cryptoObj: Crypto = window.crypto;
        if (cryptoObj && cryptoObj.subtle) {
            // encode verifier as utf-8
            const pkceCodeVerifierUtf8 = new TextEncoder().encode(pkceCodeVerifier);
            // hashed verifier
            const pkceHashedCodeVerifier = await cryptoObj.subtle.digest("SHA-256", pkceCodeVerifierUtf8);
            // encode hash as base64
            return this.base64UrlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
        } else {
            throw ClientBrowserAuthError.createPKCENotGeneratedError(`window.crypto or window.crypto.subtle does not exist. Crypto object: ${cryptoObj}`);
        }
    }
}
