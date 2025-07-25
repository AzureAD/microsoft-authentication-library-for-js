/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const PREFIX = "msal";
const BROWSER_PREFIX = "browser";
export const CACHE_KEY_SEPARATOR = "-";
export const CREDENTIAL_SCHEMA_VERSION = 1;
export const ACCOUNT_SCHEMA_VERSION = 1;

export const LOG_LEVEL_CACHE_KEY = `${PREFIX}.${BROWSER_PREFIX}.log.level`;
export const LOG_PII_CACHE_KEY = `${PREFIX}.${BROWSER_PREFIX}.log.pii`;
export const BROWSER_PERF_ENABLED_KEY = `${PREFIX}.${BROWSER_PREFIX}.performance.enabled`;
export const PLATFORM_AUTH_DOM_SUPPORT = `${PREFIX}.${BROWSER_PREFIX}.platform.auth.dom`;
export const VERSION_CACHE_KEY = `${PREFIX}.version`;

export function getAccountKeysCacheKey(schema: number = ACCOUNT_SCHEMA_VERSION): string {
    if (schema < 1) {
        return `${PREFIX}.account.keys`;
    }

    return `${PREFIX}.${schema}.account.keys`;
}

export function getTokenKeysCacheKey(clientId: string, schema: number = CREDENTIAL_SCHEMA_VERSION): string {
    if (schema < 1) {
        return `${PREFIX}.token.keys.${clientId}`;
    }

    return `${PREFIX}.${schema}.token.keys.${clientId}`;
}
