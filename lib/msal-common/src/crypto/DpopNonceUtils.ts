/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../error/ClientConfigurationError.js";

/**
 * Validates that a DPoP nonce is a non-empty string and returns the opaque
 * value unchanged.
 * @internal
 */
export function validateDpopNonce(
    nonce: unknown,
    correlationId: string = ""
): string {
    if (typeof nonce !== "string" || nonce.length === 0) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopNonce,
            correlationId
        );
    }

    return nonce;
}

/**
 * Returns the normalized HTTPS origin used to scope a resource-server nonce.
 * @internal
 */
export function canonicalizeDpopResourceServer(
    resourceRequestUri: unknown,
    correlationId: string = ""
): string {
    if (
        typeof resourceRequestUri !== "string" ||
        !/^https:\/\//i.test(resourceRequestUri)
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(resourceRequestUri);
    } catch {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    if (
        parsedUrl.protocol !== "https:" ||
        parsedUrl.origin === "null" ||
        !parsedUrl.hostname ||
        parsedUrl.username ||
        parsedUrl.password
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    return parsedUrl.origin;
}
