/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "../error/AuthError";
import { BaseAuthRequest } from "../request/BaseAuthRequest";
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

export type SignedHttpRequestParameters = Pick<BaseAuthRequest, "resourceRequestMethod" | "resourceRequestUri" | "shrClaims" | "shrNonce" > & {
    correlationId?: string
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
     * @param request
     */
    getPublicKeyThumbprint(request: SignedHttpRequestParameters): Promise<string>;
    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid 
     */
    removeTokenBindingKey(kid: string): Promise<boolean>;
    /**
     * Removes all cryptographic keys from IndexedDB storage
     */
    clearKeystore(): Promise<boolean>;
    /** 
     * Returns a signed proof-of-possession token with a given acces token that contains a cnf claim with the required kid.
     * @param accessToken 
     */
    signJwt(payload: SignedHttpRequest, kid: string, correlationId?: string): Promise<string>;
    /**
     * Returns the SHA-256 hash of an input string
     * @param plainText
     */
    hashString(plainText: string): Promise<string>;
}

export const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    createNewGuid: (): string => {
        const notImplErr = "Crypto interface - createNewGuid() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Decode: (): string => {
        const notImplErr = "Crypto interface - base64Decode() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Encode: (): string => {
        const notImplErr = "Crypto interface - base64Encode() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async generatePkceCodes(): Promise<PkceCodes> {
        const notImplErr = "Crypto interface - generatePkceCodes() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async getPublicKeyThumbprint(): Promise<string> {
        const notImplErr = "Crypto interface - getPublicKeyThumbprint() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async removeTokenBindingKey(): Promise<boolean> {
        const notImplErr = "Crypto interface - removeTokenBindingKey() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async clearKeystore(): Promise<boolean> {
        const notImplErr = "Crypto interface - clearKeystore() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async signJwt(): Promise<string> {
        const notImplErr = "Crypto interface - signJwt() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async hashString(): Promise<string> {
        const notImplErr = "Crypto interface - hashString() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};
