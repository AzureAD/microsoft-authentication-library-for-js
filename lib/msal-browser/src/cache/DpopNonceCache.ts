/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { validateDpopNonce } from "@azure/msal-common/browser";

/**
 * PCA-local nonce state for one resource-server origin.
 * @internal
 */
export type DpopNonceRecord = {
    nonce: string;
    version: number;
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
        typeof record.nonce === "string" && typeof record.version === "number"
    );
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
        typeof handoff.expiresAt !== "number"
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
