/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Resource-server DPoP nonce value and its monotonic store generation.
 * @internal
 */
export type DpopNonceRecord = {
    nonce: string;
    version: number;
};

/**
 * Internal resource-server DPoP nonce state consumed during proof generation.
 * @internal
 */
export interface IDpopNonceStore {
    getResourceServerNonce(
        resourceRequestUri: string,
        correlationId?: string
    ): DpopNonceRecord | undefined;
    clear(): void;
}
