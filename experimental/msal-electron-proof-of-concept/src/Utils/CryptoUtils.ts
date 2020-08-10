// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PKCECodes } from './PKCECodes';

import * as crypto from 'crypto';

/**
 * The CryptoUtils class exposes various utility methods used to generate
 * different kinds of cryptographically constructed strings
 */
export class CryptoUtils {
    static generateStateId(): string {
        return Math.random().toString(36).substr(7);
    }

    static generatePKCECodes(): PKCECodes {
        const verifier: string = this.generateCodeVerifier();
        const challenge: string = this.generateCodeChallengeFromVerifier(verifier);
        return {
            verifier,
            challenge
        };
    }

    /**
     * Generates a random 32 byte buffer and returns the base64
     * encoded string to be used as a PKCE Code Verifier
     */
    static generateCodeVerifier(): string {
        const randomBytes: Buffer = crypto.randomBytes(32);
        const PKCECodeVerifier: string = this.base64URLEncode(randomBytes);
        return PKCECodeVerifier;
    }

    /**
     * Creates a base64 encoded PKCE Code Challenge string from the
     * hash created from the PKCE Code Verifier supplied
     */
    static generateCodeChallengeFromVerifier(PKCECodeVerifier: string): string {
        const PKCEHashedCodeVerifier: Buffer = crypto.createHash('sha256').update(PKCECodeVerifier).digest();
        const PKCECodeChallenge: string = this.base64URLEncode(PKCEHashedCodeVerifier);
        return PKCECodeChallenge;
    }

    /**
     * Performs base64 string encoding on a buffer digest
     */
    static base64URLEncode(buffer: Buffer): string {
        return buffer.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}
