/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common/browser";
import { CustomHeaderConstants } from "../../CustomAuthConstants.js";

/**
 * Filters the headers returned by a {@link CustomAuthRequestInterceptor},
 * keeping only those that conform to the custom-auth header naming rules.
 *
 * Rules (mirrors the iOS / Android native auth implementations):
 *  - Header names must start with `x-` (case-insensitive); others are dropped.
 *  - Header names that start with any reserved prefix (`x-client-`, `x-ms-`,
 *    `x-broker-`, `x-app-`) are dropped.
 *  - Headers with empty/whitespace-only names or null/undefined values are dropped.
 *
 * Dropped headers are logged as warnings (PII-safe) when a logger is provided.
 *
 * @param headers - Raw headers returned by the interceptor.
 * @param logger - Optional logger used to emit warnings for dropped headers.
 * @param correlationId - Optional correlation id forwarded to the logger.
 * @returns A new record containing only the headers that pass the filter,
 *          preserving the original casing of header names.
 */
export function filterCustomHeaders(
    headers: Record<string, string> | null | undefined,
    logger?: Logger,
    correlationId?: string
): Record<string, string> {
    const filtered: Record<string, string> = {};

    if (!headers) {
        return filtered;
    }

    for (const [name, value] of Object.entries(headers)) {
        if (!name || value === undefined || value === null) {
            continue;
        }

        const trimmedName = name.trim();

        if (!trimmedName) {
            continue;
        }

        const lowerName = trimmedName.toLowerCase();

        if (!lowerName.startsWith(CustomHeaderConstants.REQUIRED_PREFIX)) {
            logger?.warningPii(
                `Additional header field "${trimmedName}" must start with the "${CustomHeaderConstants.REQUIRED_PREFIX}" prefix. Ignoring.`,
                correlationId ?? ""
            );
            continue;
        }

        const reservedPrefix = CustomHeaderConstants.RESERVED_PREFIXES.find(
            (prefix) => lowerName.startsWith(prefix)
        );

        if (reservedPrefix) {
            logger?.warningPii(
                `Additional header field "${trimmedName}" uses reserved prefix "${reservedPrefix}". Ignoring.`,
                correlationId ?? ""
            );
            continue;
        }

        filtered[trimmedName] = value;
    }

    return filtered;
}
