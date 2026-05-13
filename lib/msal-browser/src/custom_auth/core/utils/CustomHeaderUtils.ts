/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomHeaderConstants } from "../../CustomAuthConstants.js";

export function filterCustomHeaders(
    headers: Record<string, string> | null | undefined
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
            continue;
        }

        const startsWithReservedPrefix =
            CustomHeaderConstants.RESERVED_PREFIXES.some((prefix) =>
                lowerName.startsWith(prefix)
            );

        if (startsWithReservedPrefix) {
            continue;
        }

        filtered[trimmedName] = value;
    }

    return filtered;
}
