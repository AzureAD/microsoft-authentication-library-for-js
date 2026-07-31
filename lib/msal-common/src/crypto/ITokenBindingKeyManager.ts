/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";

/**
 * Parameters used by token-binding key managers to provision browser-managed
 * token-binding keys. Callers own the protocol policy (key type and JOSE
 * algorithm); implementations generate, store, retrieve, and use the requested
 * key material by key identifier.
 */
export type TokenBindingKeyProvisioningParameters = {
    tokenBindingKeyType: string;
    tokenBindingKeyAlgorithm: string;
    correlationId: string;
};

/**
 * Internal key lifecycle abstraction for browser token-binding keys.
 * @internal
 */
export interface ITokenBindingKeyManager {
    /**
     * Provisions a token-binding key and returns the key identifier.
     * @param request - Key provisioning policy.
     */
    provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string>;
    /**
     * Removes a token-binding key by identifier.
     * @param kid - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     */
    removeTokenBindingKey(kid: string, correlationId: string): Promise<void>;
    /**
     * Gets a token-binding public key as a JWK by identifier.
     * @param kid - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     */
    getTokenBindingPublicKeyJwk(
        kid: string,
        correlationId: string
    ): Promise<JsonWebKey>;
}

/**
 * Default token-binding key manager used when a platform-specific implementation
 * has not been provided.
 * @internal
 */
export const DEFAULT_TOKEN_BINDING_KEY_MANAGER: ITokenBindingKeyManager = {
    async provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            request.correlationId
        );
    },
    async removeTokenBindingKey(
        _kid: string,
        correlationId: string
    ): Promise<void> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            correlationId
        );
    },
    async getTokenBindingPublicKeyJwk(
        _kid: string,
        correlationId: string
    ): Promise<JsonWebKey> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            correlationId
        );
    },
};
