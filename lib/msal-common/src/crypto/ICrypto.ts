/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import type { BaseAuthRequest } from "../request/BaseAuthRequest.js";
import type { JoseHeader } from "./JoseHeader.js";

/**
 * PKCE code verifier and challenge pair used by authorization code flows.
 */
export type PkceCodes = {
    verifier: string;
    challenge: string;
};

/**
 * Parameters used by crypto implementations to build signed HTTP request
 * proof-of-possession tokens.
 */
export type SignedHttpRequestParameters = Pick<
    BaseAuthRequest,
    | "resourceRequestMethod"
    | "resourceRequestUri"
    | "shrClaims"
    | "shrNonce"
    | "shrOptions"
> & {
    correlationId: string;
};

/**
 * Shared JOSE algorithm literals used by MSAL package internals.
 * @internal
 */
export const JsonWebTokenAlgorithms = {
    ES256: "ES256",
    RS256: "RS256",
} as const;
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
     * base64 URL safe encoded string
     */
    base64UrlEncode(input: string): string;
    /**
     * Stringifies and base64Url encodes input public key
     * @param inputKid
     * @returns Base64Url encoded public key
     */
    encodeKid(inputKid: string): string;
    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid
     * @param correlationId
     */
    removeTokenBindingKey(kid: string, correlationId: string): Promise<void>;
    /**
     * Removes all cryptographic keys from IndexedDB storage
     * @param correlationId
     */
    clearKeystore(correlationId: string): Promise<boolean>;
    /**
     * Signs a compact JWT with the token-binding key identified by kid.
     * @internal
     * @param header
     * @param payload
     * @param kid
     * @param correlationId
     */
    signTokenBindingJwt(
        header: JoseHeader,
        payload: object,
        kid: string,
        correlationId: string
    ): Promise<string>;
    /**
     * Returns the SHA-256 hash of an input string
     * @param plainText
     */
    hashString(plainText: string): Promise<string>;
}

/**
 * Default crypto implementation used when a platform-specific implementation has
 * not been provided.
 */
export const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    createNewGuid: (): string => {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    base64Decode: (): string => {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    base64Encode: (): string => {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    base64UrlEncode: (): string => {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    encodeKid: (): string => {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async removeTokenBindingKey(
        kid: string,
        correlationId: string
    ): Promise<void> {
        void kid;
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            correlationId
        );
    },
    async clearKeystore(correlationId: string): Promise<boolean> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            correlationId
        );
    },
    async signTokenBindingJwt(
        header: JoseHeader,
        payload: object,
        kid: string,
        correlationId: string
    ): Promise<string> {
        void header;
        void payload;
        void kid;
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            correlationId
        );
    },
    async hashString(): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
};
