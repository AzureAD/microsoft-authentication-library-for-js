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
 * token-binding keys. Callers own the protocol policy (key type, JOSE
 * algorithm, and optional cache scope); implementations generate, store,
 * retrieve, and use the requested key material.
 */
export type TokenBindingKeyProvisioningParameters = {
    tokenBindingKeyType: string;
    tokenBindingKeyAlgorithm: string;
    correlationId: string;
    /**
     * Optional stable scope used to reuse a key before the JWK thumbprint is
     * known. Implementations append the generated thumbprint to this scope when
     * storing the key.
     */
    keyScope?: string;
};

/**
 * Parameters used by token-binding key managers to resolve existing keys.
 * Lookup/signing APIs do not carry key generation policy.
 */
export type TokenBindingKeyContext = {
    keyScope?: string;
};

/**
 * Internal key lifecycle abstraction for browser token-binding keys.
 * @internal
 */
export interface ITokenBindingKeyManager {
    /**
     * Provisions or reuses a token-binding key and returns the key identifier.
     * @param request - Key provisioning policy and cache scope.
     */
    provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string>;
    /**
     * Removes a token-binding key by identifier and optional lookup context.
     * @param kid - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     * @param context - Optional scoped lookup context.
     */
    removeTokenBindingKey(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<void>;
    /**
     * Gets a token-binding public key as a JWK by identifier and optional lookup context.
     * @param kid - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     * @param context - Optional scoped lookup context.
     */
    getTokenBindingPublicKeyJwk(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<JsonWebKey>;
}

/**
 * Default token-binding key manager used when a platform-specific implementation
 * has not been provided.
 * @internal
 */
export const DEFAULT_TOKEN_BINDING_KEY_MANAGER: ITokenBindingKeyManager = {
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
    async getTokenBindingPublicKeyJwk(): Promise<JsonWebKey> {
        throw createClientAuthError(
            ClientAuthErrorCodes.methodNotImplemented,
            ""
        );
    },
};
