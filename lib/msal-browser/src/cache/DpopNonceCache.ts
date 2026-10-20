/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { validateDpopNonce } from "@azure/msal-common/browser";

export type DpopNonceRecord = {
    nonce: string;
    version: number;
};

export type DpopNonceRedirectHandoff = {
    nonce: string;
    resourceServer: string;
    state: string;
    correlationId: string;
    expiresAt: number;
};

export function isDpopNonceRecord(value: object): value is DpopNonceRecord {
    const record = value as Partial<DpopNonceRecord>;
    return (
        typeof record.nonce === "string" && typeof record.version === "number"
    );
}

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
