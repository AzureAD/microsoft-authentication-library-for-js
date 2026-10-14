/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IPerformanceClient,
    Logger,
    ProtocolMode,
} from "@azure/msal-common/browser";

/**
 * Returns true when the supplied user agent is using Safari
 *
 * @internal
 */
export function isSafari(
    userAgent: string = typeof navigator !== "undefined"
        ? navigator.userAgent
        : ""
): boolean {
    return userAgent.includes("Safari") && userAgent.includes("AppleWebKit");
}

/**
 * Returns true when EAR should be used for the current request.
 *
 * Safari cannot complete EAR's cross-origin form POST, so requests configured
 * for EAR transparently use authorization code flow instead.
 *
 * @internal
 */
export function shouldUseEar(
    protocolMode: ProtocolMode,
    logger: Logger,
    performanceClient: IPerformanceClient,
    correlationId: string,
    userAgent?: string
): boolean {
    if (protocolMode !== ProtocolMode.EAR) {
        return false;
    }

    if (!isSafari(userAgent)) {
        return true;
    }

    logger.verbose(
        "Safari detected. Falling back from EAR to authorization code flow.",
        correlationId
    );
    performanceClient.addFields(
        { "ext.earFallbackReason": "safari" },
        correlationId
    );
    return false;
}
