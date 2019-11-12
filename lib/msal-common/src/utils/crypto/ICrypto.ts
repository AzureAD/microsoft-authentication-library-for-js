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

/**
 * Interface for crypto functions used by library
 */
export interface ICrypto {
    /**
     * base64 Encode string
     * @param input 
     */
    base64Encode(input: string): string;
    /**
     * base64 decode string
     * @param input 
     */
    base64Decode(input: string): string;
    /**
     * Generate PKCE codes for OAuth. See RFC here: https://tools.ietf.org/html/rfc7636
     */
    generatePKCECodes(): Promise<PKCECodes>;
}
