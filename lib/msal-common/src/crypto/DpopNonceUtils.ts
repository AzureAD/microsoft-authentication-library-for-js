/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../error/ClientConfigurationError.js";

/**
 * Maximum accepted DPoP nonce size, measured after UTF-8 encoding.
 * @internal
 */
export const DPOP_NONCE_MAX_SIZE_BYTES = 1024;

const DPOP_NONCE_CONTROL_CHARACTER_REGEX = /[\u0000-\u001f\u007f-\u009f]/;

/**
 * Returns the byte length of a string after UTF-8 encoding.
 */
function getUtf8ByteLength(value: string): number {
    return new TextEncoder().encode(value).length;
}

/**
 * Validates a DPoP nonce and returns the original opaque value unchanged.
 * @internal
 */
export function validateDpopNonce(
    nonce: unknown,
    correlationId: string = ""
): string {
    if (
        typeof nonce !== "string" ||
        nonce.trim().length === 0 ||
        DPOP_NONCE_CONTROL_CHARACTER_REGEX.test(nonce) ||
        nonce.length > DPOP_NONCE_MAX_SIZE_BYTES ||
        getUtf8ByteLength(nonce) > DPOP_NONCE_MAX_SIZE_BYTES
    ) {
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
