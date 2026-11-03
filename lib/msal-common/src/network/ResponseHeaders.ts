/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Track only our normalized copies, never caller-owned mutable inputs.
const normalizedHeaderRecords = new WeakSet<Record<string, string>>();

/**
 * Creates a lowercase-keyed snapshot without changing header values or the input.
 * Reuses snapshots produced by this function to avoid repeated normalization.
 * @internal
 */
export function normalizeResponseHeaders(
    headers: Record<string, string>
): Record<string, string> {
    if (normalizedHeaderRecords.has(headers)) {
        return headers;
    }

    const normalized = Object.fromEntries<string>(
        Object.entries(headers).map(([name, value]): [string, string] => [
            name.toLowerCase(),
            value,
        ])
    );
    normalizedHeaderRecords.add(normalized);
    return normalized;
}

/**
 * Reads a response header case-insensitively.
 * Normalized snapshots are never scanned, even when a header is missing.
 * @internal
 */
export function getResponseHeader(
    headers: Record<string, string>,
    name: string
): string | undefined {
    const key = name.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(headers, key)) {
        return headers[key];
    }
    if (normalizedHeaderRecords.has(headers)) {
        return undefined;
    }

    const headerName = Object.keys(headers).find(
        (header) => header.toLowerCase() === key
    );
    return headerName === undefined ? undefined : headers[headerName];
}
