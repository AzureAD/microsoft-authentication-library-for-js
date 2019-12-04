/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { PKCECodes } from "msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { Base64Encode } from "./Base64Encode";

const CV_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const RANDOM_BYTE_ARR_LENGTH = 32;

/**
 * Class which exposes APIs to generate PKCE codes and code verifiers.
 */
export class PkceGenerator {

    private base64Encode: Base64Encode = new Base64Encode();

    /**
     * Generates PKCE Codes. See the RFC for more information: https://tools.ietf.org/html/rfc7636
     */
    async generateCodes(): Promise<PKCECodes> {
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
            const pkceCodeVerifierB64: string = this.base64Encode.urlEncode(pkceCodeVerifierString);
            return pkceCodeVerifierB64;
        } else {
            throw BrowserAuthError.createPKCENotGeneratedError(`window.crypto or getRandomValues does not exist. Crypto object: ${cryptoObj}`);
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
            return this.base64Encode.urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
        } else {
            throw BrowserAuthError.createPKCENotGeneratedError(`window.crypto or window.crypto.subtle does not exist. Crypto object: ${cryptoObj}`);
        }
    }

    /**
     * Generates a character string based on input array.
     * @param buffer 
     */
    private bufferToCVString(buffer: Uint8Array): string {
        const charArr = [];
        for (let i = 0; i < buffer.byteLength; i += 1) {
            const index = buffer[i] % CV_CHARSET.length;
            charArr.push(CV_CHARSET[index]);
        }
        return charArr.join("");
    }
}
