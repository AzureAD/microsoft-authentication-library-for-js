/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PkceCodes } from "@azure/msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { Base64Encode } from "../encode/Base64Encode";
import { BrowserCrypto } from "./BrowserCrypto";

// Constant byte array length
const RANDOM_BYTE_ARR_LENGTH = 32;

/**
 * Class which exposes APIs to generate PKCE codes and code verifiers.
 */
export class PkceGenerator {

    private base64Encode: Base64Encode;
    private cryptoObj: BrowserCrypto;

    constructor(cryptoObj: BrowserCrypto) {
        this.base64Encode = new Base64Encode();
        this.cryptoObj = cryptoObj;
    }

    /**
     * Generates PKCE Codes. See the RFC for more information: https://tools.ietf.org/html/rfc7636
     */
    async generateCodes(): Promise<PkceCodes> {
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
        try {
            // Generate random values as utf-8
            const buffer: Uint8Array = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
            this.cryptoObj.getRandomValues(buffer);
            // encode verifier as base64
            const pkceCodeVerifierB64: string = this.base64Encode.urlEncodeArr(buffer);
            return pkceCodeVerifierB64;
        } catch (e) {
            throw BrowserAuthError.createPkceNotGeneratedError(e);
        }
    }

    /**
     * Creates a base64 encoded PKCE Code Challenge string from the
     * hash created from the PKCE Code Verifier supplied
     */
    private async generateCodeChallengeFromVerifier(pkceCodeVerifier: string): Promise<string> {
        try {
            // hashed verifier
            const pkceHashedCodeVerifier = await this.cryptoObj.sha256Digest(pkceCodeVerifier);
            // encode hash as base64
            return this.base64Encode.urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
        } catch (e) {
            throw BrowserAuthError.createPkceNotGeneratedError(e);
        }
    }
}
