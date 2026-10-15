/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Optional capability implemented by standard public client applications that
 * can accept resource-server DPoP nonces.
 */
export interface IDpopNonceProvider {
    /**
     * Stores an opaque resource-server DPoP nonce for the matching HTTPS origin.
     */
    loadDpopNonce(resourceRequestUri: string, dpopNonce: string): Promise<void>;
}

/**
 * Returns true when the supplied value exposes the DPoP nonce capability.
 */
export function isDpopNonceProvider(
    value: unknown
): value is IDpopNonceProvider {
    if (
        typeof value !== "object" ||
        value === null ||
        !("loadDpopNonce" in value) ||
        typeof value.loadDpopNonce !== "function"
    ) {
        return false;
    }

    /*
     * PublicClientApplication can wrap a nestable/custom controller. Its
     * private marker prevents those wrappers from advertising this capability,
     * while independently implemented structural providers remain supported.
     */
    if (
        "dpopNonceProviderAvailable" in value &&
        value.dpopNonceProviderAvailable !== true
    ) {
        return false;
    }

    return true;
}
