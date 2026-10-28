/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    canonicalizeDpopResourceServer,
    validateDpopNonce,
} from "@azure/msal-common/browser";

export const DPOP_NONCE_CACHE_PREFIX = "dpop.nonce.";
export const DPOP_NONCE_REDIRECT_HANDOFF = "dpop.nonce.redirect";
export const MAX_RESOURCE_SERVER_NONCES = 50;
export const REDIRECT_HANDOFF_TTL_MS = 5 * 60 * 1000;

/**
 * PCA-local nonce state for one resource-server origin.
 * @internal
 */
export type DpopNonceRecord = {
    nonce: string;
    generation: number;
};

/**
 * Temporary redirect state used to restore one request-bound nonce.
 * @internal
 */
export type DpopNonceRedirectHandoff = {
    nonce: string;
    resourceServer: string;
    state: string;
    correlationId: string;
    expiresAt: number;
};

/**
 * Checks whether parsed cache data has the expected nonce-record shape.
 * @internal
 */
export function isDpopNonceRecord(value: object): value is DpopNonceRecord {
    const record = value as Partial<DpopNonceRecord>;
    return (
        typeof record.nonce === "string" &&
        typeof record.generation === "number"
    );
}

/**
 * Creates the in-memory cache key for a resource-server nonce.
 * @internal
 */
export function getDpopNonceCacheKey(
    resourceRequestUri: string,
    correlationId: string = ""
): string {
    return `${DPOP_NONCE_CACHE_PREFIX}${canonicalizeDpopResourceServer(
        resourceRequestUri,
        correlationId
    )}`;
}

/**
 * Checks whether an in-memory cache key contains resource-server nonce state.
 * @internal
 */
export function isDpopNonceCacheKey(key: string): boolean {
    return key.startsWith(DPOP_NONCE_CACHE_PREFIX);
}

/**
 * Creates validated nonce state with a PCA-local write generation.
 * @internal
 */
export function createDpopNonceRecord(
    nonce: string,
    generation: number,
    correlationId: string = ""
): DpopNonceRecord {
    return {
        nonce: validateDpopNonce(nonce, correlationId),
        generation,
    };
}

/**
 * Creates request-bound state for restoring a nonce after a redirect.
 * @internal
 */
export function createDpopNonceRedirectHandoff(
    resourceRequestUri: string,
    nonce: string,
    state: string,
    correlationId: string,
    now: number = Date.now()
): DpopNonceRedirectHandoff {
    return {
        nonce,
        resourceServer: canonicalizeDpopResourceServer(
            resourceRequestUri,
            correlationId
        ),
        state,
        correlationId,
        expiresAt: now + REDIRECT_HANDOFF_TTL_MS,
    };
}

/**
 * Checks the handoff shape and validates its untrusted persisted nonce.
 * @internal
 */
export function isDpopNonceRedirectHandoff(
    value: object
): value is DpopNonceRedirectHandoff {
    const handoff = value as Partial<DpopNonceRedirectHandoff>;
    if (
        typeof handoff.nonce !== "string" ||
        typeof handoff.resourceServer !== "string" ||
        typeof handoff.state !== "string" ||
        typeof handoff.correlationId !== "string" ||
        typeof handoff.expiresAt !== "number" ||
        !Number.isFinite(handoff.expiresAt)
    ) {
        return false;
    }

    try {
        validateDpopNonce(handoff.nonce);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks whether a redirect handoff belongs to the active request.
 * @internal
 */
export function matchesDpopNonceRedirectHandoff(
    handoff: DpopNonceRedirectHandoff,
    resourceRequestUri: string,
    state: string,
    correlationId: string,
    now: number = Date.now()
): boolean {
    return (
        handoff.expiresAt >= now &&
        handoff.state === state &&
        handoff.correlationId === correlationId &&
        handoff.resourceServer ===
            canonicalizeDpopResourceServer(resourceRequestUri, correlationId)
    );
}
