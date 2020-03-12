/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PkceCodes } from '@azure/msal-common';
import { PKCEConstants } from './../utils/NodeConstants';
import { Base64Encode } from './../encode/Base64Encode';
const crypto = require('crypto');

/**
 * https://tools.ietf.org/html/rfc7636#page-8
 */
export class PkceGenerator {
    /**
     * generates the codeVerfier and the challenge from the codeVerfier
     * reference: https://tools.ietf.org/html/rfc7636#section-4.1 and https://tools.ietf.org/html/rfc7636#section-4.2
     */
    async generatePkceCodes(): Promise<PkceCodes> {
        const v: string = this.generateCodeVerifier();
        const c: string = this.generateCodeChallengeFromVerifier(v);
        return { verifier: v, challenge: c };
    }

    /**
     * generates the codeVerfier; reference: https://tools.ietf.org/html/rfc7636#section-4.1
     */
    private generateCodeVerifier(): string {
        const buffer: Uint8Array = crypto.randomBytes(
            PKCEConstants.RANDOM_OCTET_SIZE
        );
        const verifier: string = this.bufferToCVString(buffer);
        return Base64Encode.encodeUrl(verifier);
    }

    /**
     * generate the challenge from the codeVerfier; reference: https://tools.ietf.org/html/rfc7636#section-4.2
     * @param codeVerifier
     */
    private generateCodeChallengeFromVerifier(codeVerifier: string): string {
        return Base64Encode.encodeUrl(this.sha256(codeVerifier));
    }

    /**
     * generate 'SHA256' hash
     * @param buffer
     */
    private sha256(buffer: string): string {
        return crypto
            .createHash(PKCEConstants.SHA256)
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
            const index = buffer[i] % PKCEConstants.CV_CHARSET.length;
            charArr.push(PKCEConstants.CV_CHARSET[index]);
        }
        return charArr.join('');
    }
}
