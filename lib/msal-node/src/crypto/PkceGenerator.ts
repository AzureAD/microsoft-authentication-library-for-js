/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PkceCodes } from "@azure/msal-common";
import { CharSet, Hash, RANDOM_OCTET_SIZE } from "../utils/Constants";
import { EncodingUtils } from "../utils/EncodingUtils";
import crypto from "crypto";

/**
 * https://tools.ietf.org/html/rfc7636#page-8
 */
export class PkceGenerator {
    /**
     * generates the codeVerfier and the challenge from the codeVerfier
     * reference: https://tools.ietf.org/html/rfc7636#section-4.1 and https://tools.ietf.org/html/rfc7636#section-4.2
     */
    async generatePkceCodes(): Promise<PkceCodes> {
        const verifier = this.generateCodeVerifier();
        const challenge = this.generateCodeChallengeFromVerifier(verifier);
        return { verifier, challenge };
    }

    /**
     * generates the codeVerfier; reference: https://tools.ietf.org/html/rfc7636#section-4.1
     */
    private generateCodeVerifier(): string {
        const buffer: Uint8Array = crypto.randomBytes(RANDOM_OCTET_SIZE);
        const verifier: string = this.bufferToCVString(buffer);
        return EncodingUtils.base64EncodeUrl(verifier);
    }

    /**
     * generate the challenge from the codeVerfier; reference: https://tools.ietf.org/html/rfc7636#section-4.2
     * @param codeVerifier
     */
    private generateCodeChallengeFromVerifier(codeVerifier: string): string {
        return EncodingUtils.base64EncodeUrl(
            this.sha256(codeVerifier).toString("base64"), 
            "base64"
        );
    }

    /**
     * generate 'SHA256' hash
     * @param buffer
     */
    private sha256(buffer: string): Buffer {
        return crypto
            .createHash(Hash.SHA256)
            .update(buffer)
            .digest();
    }

    /**
     * Accepted characters; reference: https://tools.ietf.org/html/rfc7636#section-4.1
     * @param buffer
     */
    private bufferToCVString(buffer: Uint8Array): string {
        const charArr = [];
        for (let i = 0; i < buffer.byteLength; i += 1) {
            const index = buffer[i] % CharSet.CV_CHARSET.length;
            charArr.push(CharSet.CV_CHARSET[index]);
        }
        return charArr.join("");
    }
}
