/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    canonicalizeDpopResourceServer,
    validateDpopNonce,
} from "@azure/msal-common/browser";

export const DPOP_NONCE_REDIRECT_HANDOFF = "dpop.nonce.redirect";
export const MAX_RESOURCE_SERVER_NONCES = 50;
export const REDIRECT_HANDOFF_TTL_MS = 5 * 60 * 1000;

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
 * Canonicalizes a resource URI for PCA-local nonce storage.
 * @internal
 */
export function getDpopNonceResourceServer(
    resourceRequestUri: string,
    correlationId: string = ""
): string {
    return canonicalizeDpopResourceServer(resourceRequestUri, correlationId);
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
