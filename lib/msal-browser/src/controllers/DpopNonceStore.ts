/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    canonicalizeDpopResourceServer,
    IDpopNonceStore,
    validateDpopNonce,
} from "@azure/msal-common/browser";

const MAX_RESOURCE_SERVER_NONCES = 50;

/**
 * Controller-owned, memory-only resource-server DPoP nonce state.
 * @internal
 */
export class DpopNonceStore implements IDpopNonceStore {
    private readonly resourceServerNonces = new Map<string, string>();

    setResourceServerNonce(
        resourceRequestUri: string,
        dpopNonce: string,
        correlationId: string = ""
    ): void {
        const resourceServer = canonicalizeDpopResourceServer(
            resourceRequestUri,
            correlationId
        );
        const validatedNonce = validateDpopNonce(dpopNonce, correlationId);

        this.resourceServerNonces.delete(resourceServer);
        this.resourceServerNonces.set(resourceServer, validatedNonce);

        if (this.resourceServerNonces.size > MAX_RESOURCE_SERVER_NONCES) {
            const oldestResourceServer = this.resourceServerNonces
                .keys()
                .next().value;
            if (oldestResourceServer) {
                this.resourceServerNonces.delete(oldestResourceServer);
            }
        }
    }

    getResourceServerNonce(resourceRequestUri: string): string | undefined {
        const resourceServer =
            canonicalizeDpopResourceServer(resourceRequestUri);
        return this.resourceServerNonces.get(resourceServer);
    }

    clear(): void {
        this.resourceServerNonces.clear();
    }
}
