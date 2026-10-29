/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Provides the latest resource-server DPoP nonce for proof generation.
 * @internal
 */
export interface IDpopNonceProvider {
    /**
     * Returns the latest nonce for the resource server identified by the request URI.
     * @param resourceRequestUri - Resource request URI used to identify the resource server.
     * @param correlationId - Request correlation identifier.
     */
    getDpopNonce(
        resourceRequestUri: string,
        correlationId?: string
    ): string | undefined;
}
