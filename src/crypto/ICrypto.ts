/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignedHttpRequest } from "./SignedHttpRequest";

/**
 * The PkceCodes type describes the structure
 * of objects that contain PKCE code
 * challenge and verifier pairs
 */
export type PkceCodes = {
    verifier: string,
    challenge: string
};

/**
 * Interface for crypto functions used by library
 */
export interface ICrypto {
    /**
     * Creates a guid randomly.
     */
    createNewGuid(): string;
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
    generatePkceCodes(): Promise<PkceCodes>;
    /**
     * Generates an JWK RSA S256 Thumbprint
     * @param resourceRequestMethod 
     * @param resourceRequestUri 
     */
    getPublicKeyThumbprint(resourceRequestMethod: string, resourceRequestUri: string): Promise<string>;
    /** 
     * Returns a signed proof-of-possession token with a given acces token that contains a cnf claim with the required kid.
     * @param accessToken 
     */
    signJwt(payload: SignedHttpRequest, kid: string): Promise<string>;
}
