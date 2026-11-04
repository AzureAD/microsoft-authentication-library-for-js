/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Provides authorization-server DPoP nonce state for token proof generation.
 * @internal
 */
export interface IDpopAuthorizationNonceProvider {
    /**
     * Returns the latest nonce for the token endpoint and DPoP key.
     * @param tokenEndpoint - Final token endpoint used as the DPoP htu.
     * @param dpopJkt - JWK thumbprint identifying the DPoP key.
     * @param correlationId - Request correlation identifier.
     */
    getDpopAuthorizationNonce(
        tokenEndpoint: string,
        dpopJkt: string,
        correlationId?: string
    ): string | undefined;

    /**
     * Stores the latest nonce for the token endpoint and DPoP key.
     * @param tokenEndpoint - Final token endpoint used as the DPoP htu.
     * @param dpopJkt - JWK thumbprint identifying the DPoP key.
     * @param dpopNonce - Opaque authorization-server nonce.
     * @param correlationId - Request correlation identifier.
     */
    setDpopAuthorizationNonce(
        tokenEndpoint: string,
        dpopJkt: string,
        dpopNonce: string,
        correlationId?: string
    ): void;
}
