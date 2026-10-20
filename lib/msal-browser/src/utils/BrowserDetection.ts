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
    if (
        /OPR\/|OPiOS|PhantomJS|SamsungBrowser|Edge|EdgiOS|EdgA/.test(userAgent)
    ) {
        return false;
    }

    const browserNavigator =
        typeof navigator !== "undefined"
            ? (navigator as Navigator & {
                  userAgentData?: {
                      brands?: Array<{ brand?: string } | undefined>;
                  };
              })
            : undefined;

    if (
        /Edg/.test(userAgent) ||
        browserNavigator?.userAgentData?.brands?.some(
            (brand) => brand?.brand === "Microsoft Edge"
        )
    ) {
        return false;
    }

    if (/Electron|CriOS|Chrome|Trident|FxiOS|Firefox/.test(userAgent)) {
        return false;
    }

    return /Safari/.test(userAgent) || /AppleWebKit/.test(userAgent);
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
