/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Parameters used by token-binding key managers to provision browser-managed
 * token-binding keys. Callers own the protocol policy (key type, JOSE
 * algorithm, and optional cache scope); implementations generate, store,
 * retrieve, and use the requested key material.
 * @internal
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
 * @internal
 */
export type TokenBindingKeyContext = {
    keyScope?: string;
};

/**
 * Internal key lifecycle abstraction for browser token-binding keys.
 * @internal
 */
export interface ITokenBindingKeyManager {
    provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string>;
    removeTokenBindingKey(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<void>;
    getTokenBindingPublicKeyJwk(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<JsonWebKey>;
}
