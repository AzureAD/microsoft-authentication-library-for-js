/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "../error/AuthError";
import { BoundServerAuthorizationTokenResponse } from "../response/BoundServerAuthorizationTokenResponse";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
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
    getPublicKeyThumbprint(resourceRequestMethod?: string, resourceRequestUri?: string): Promise<string>;
    /** 
     * Returns a signed proof-of-possession token with a given acces token that contains a cnf claim with the required kid.
     * @param accessToken 
     */
    signJwt(payload: SignedHttpRequest, kid: string): Promise<string>;
    /** 
     * Returns the public key of the Session Transport Key in stringified JWK object format
     * @param keyId 
     */
    getStkJwkPublicKey(stkJwkThumbprint: string): Promise<string>;
    /**
     * Returns the decrypted server token response
     * @param sessionKeyJwe
     * @param responseJwe
     * @param stkJwkThumbprint
     */
    decryptBoundTokenResponse(sessionKeyJwe: string, responseJwe: string, stkJwkThumbprint: string): Promise<ServerAuthorizationTokenResponse>;
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
    async signJwt(): Promise<string> {
        const notImplErr = "Crypto interface - signJwt() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async getStkJwkPublicKey(): Promise<string> {
        const notImplErr = "Crypto interface - getStkJwk() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async decryptBoundTokenResponse(): Promise<string> {
        const notImplErr = "Crypto interface - decryptBoundTokenResponse() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};
