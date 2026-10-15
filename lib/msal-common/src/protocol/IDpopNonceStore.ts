/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Internal resource-server DPoP nonce state consumed during proof generation.
 * @internal
 */
export interface IDpopNonceStore {
    getResourceServerNonce(resourceRequestUri: string): string | undefined;
    clear(): void;
}
