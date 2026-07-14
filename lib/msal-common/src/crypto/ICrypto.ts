/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import type { BaseAuthRequest } from "../request/BaseAuthRequest.js";
import type { ShrOptions, SignedHttpRequest } from "./SignedHttpRequest.js";

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
 * Parameters used by crypto implementations to provision browser-managed
 * token-binding keys. Callers own the protocol policy (key type, JOSE
 * algorithm, and optional cache scope); crypto implementations only generate,
 * store, retrieve, and use the requested key material.
 */
export type TokenBindingKeyProvisioningParameters = {
    tokenBindingKeyType: string;
    tokenBindingKeyAlgorithm: string;
    correlationId: string;
    /**
     * Optional stable scope used to reuse a key before the JWK thumbprint is
     * known. Crypto implementations append the generated thumbprint to this
     * scope when storing the key.
     */
    keyScope?: string;
};

/**
 * Parameters used by crypto implementations to resolve existing
 * token-binding keys. Lookup/signing APIs do not carry key generation policy.
 */
export type TokenBindingKeyContext = {
    keyScope?: string;
};

/**
 * Parameters used by crypto implementations to create public key thumbprints.
 */
export type PublicKeyThumbprintParameters = SignedHttpRequestParameters;

/**
 * Shared JOSE algorithm literals used by MSAL package internals.
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
     * Provisions or reuses a public JWK thumbprint.
     *
     * @deprecated Compatibility wrapper for the legacy get-or-create API. New
     * token-binding flows should provision a key with protocol-owned key type
     * and JOSE algorithm policy, then use lookup/signing APIs with the returned
     * key id.
     *
     * @param request
     */
    getPublicKeyThumbprint(
        request: PublicKeyThumbprintParameters
    ): Promise<string>;
    /**
     * Provisions or reuses a browser token-binding key from caller-provided key
     * policy and returns the RFC 7638 public JWK thumbprint for the selected
     * key.
     * @param request
     * @internal
     */
    provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string>;
    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid
     * @param correlationId
     * @param context
     */
    removeTokenBindingKey(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<void>;
    /**
     * Removes all cryptographic keys from IndexedDB storage
     * @param correlationId
     */
    clearKeystore(correlationId: string): Promise<boolean>;
    /**
     * Gets the public JWK for a browser token-binding key.
     * @param kid
     * @param correlationId
     * @param context
     * @internal
     */
    getTokenBindingPublicKeyJwk(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<JsonWebKey>;
    /**
     * Signs a compact JWT with a browser token-binding key.
     * @param header
     * @param payload
     * @param kid
     * @param correlationId
     * @param context
     * @internal
     */
    signTokenBindingJwt(
        header: object,
        payload: object,
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<string>;
    /**
     * Returns a signed proof-of-possession token with a given acces token that contains a cnf claim with the required kid.
     * @deprecated Build SHR payloads in PopTokenGenerator and call signTokenBindingJwt instead.
     * @param payload
     * @param kid
     */
    signJwt(
        payload: SignedHttpRequest,
        kid: string,
        shrOptions?: ShrOptions,
        correlationId?: string
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
    async getPublicKeyThumbprint(): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async provisionTokenBindingKey(): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async removeTokenBindingKey(): Promise<void> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async clearKeystore(): Promise<boolean> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async getTokenBindingPublicKeyJwk(): Promise<JsonWebKey> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async signTokenBindingJwt(): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async signJwt(): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
    async hashString(): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
};
