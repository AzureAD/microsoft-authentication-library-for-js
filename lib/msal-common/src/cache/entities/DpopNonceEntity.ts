/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../../error/ClientConfigurationError.js";

/**
 * Schema version for persisted DPoP nonce entries. This is intentionally
 * independent from account and credential cache schema versions.
 * @internal
 */
export const DPOP_NONCE_SCHEMA_VERSION = 1;

/**
 * Maximum accepted DPoP nonce size, measured after UTF-8 encoding.
 * @internal
 */
export const DPOP_NONCE_MAX_SIZE_BYTES = 1024;

/**
 * Maximum lifetime of a persisted DPoP nonce.
 * @internal
 */
export const DPOP_NONCE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum number of retained entries for each client ID and nonce type.
 * @internal
 */
export const DPOP_NONCE_MAX_ENTRIES_PER_TYPE = 50;

/**
 * Prefix shared by all versions of DPoP nonce cache keys.
 * @internal
 */
export const DPOP_NONCE_CACHE_KEY_PREFIX = "msal.dpop_nonce";

/**
 * DPoP nonce issuer namespaces.
 * @internal
 */
export const DpopNonceType = {
    AuthorizationServer: "authorization_server",
    ResourceServer: "resource_server",
} as const;
/** @internal */
export type DpopNonceType = (typeof DpopNonceType)[keyof typeof DpopNonceType];

/**
 * Source category retained with a DPoP nonce.
 * @internal
 */
export const DpopNonceSource = {
    AuthorizationServer: "authorization_server",
    ResourceServer: "resource_server",
} as const;
/** @internal */
export type DpopNonceSource =
    (typeof DpopNonceSource)[keyof typeof DpopNonceSource];

/**
 * Versioned, non-credential cache entity for opaque DPoP nonce state.
 * @internal
 */
export type DpopNonceEntity = {
    schemaVersion: number;
    nonce: string;
    clientId: string;
    nonceType: DpopNonceType;
    nonceSource: DpopNonceSource;
    lastUpdatedAt: number;
};

/**
 * Parsed dimensions from a DPoP nonce cache key.
 * @internal
 */
export type DpopNonceCacheKey = {
    schemaVersion: number;
    clientId: string;
    nonceType: DpopNonceType;
    issuerHash: string;
};

const DPOP_NONCE_CONTROL_CHARACTER_REGEX = /[\u0000-\u001f\u007f-\u009f]/;

function getUtf8ByteLength(value: string): number {
    let byteLength = 0;

    for (let i = 0; i < value.length; i++) {
        const codeUnit = value.charCodeAt(i);
        if (codeUnit <= 0x7f) {
            byteLength += 1;
        } else if (codeUnit <= 0x7ff) {
            byteLength += 2;
        } else if (
            codeUnit >= 0xd800 &&
            codeUnit <= 0xdbff &&
            i + 1 < value.length
        ) {
            const nextCodeUnit = value.charCodeAt(i + 1);
            if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
                byteLength += 4;
                i++;
            } else {
                byteLength += 3;
            }
        } else {
            byteLength += 3;
        }
    }

    return byteLength;
}

/**
 * Validates a DPoP nonce against the centralized input policy and returns the
 * original string unchanged.
 * @internal
 */
export function validateDpopNonce(
    nonce: unknown,
    correlationId: string = ""
): string {
    if (
        typeof nonce !== "string" ||
        nonce.length === 0 ||
        DPOP_NONCE_CONTROL_CHARACTER_REGEX.test(nonce) ||
        getUtf8ByteLength(nonce) > DPOP_NONCE_MAX_SIZE_BYTES
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopNonce,
            correlationId
        );
    }

    return nonce;
}

/**
 * Canonicalizes an authorization-server token endpoint or resource-server URI
 * for DPoP nonce key derivation. Authorization-server paths are retained while
 * resource-server keys use only the HTTPS origin.
 * @internal
 */
export function canonicalizeDpopNonceIssuer(
    issuerUri: unknown,
    nonceType: DpopNonceType,
    correlationId: string = ""
): string {
    if (typeof issuerUri !== "string" || !/^https:\/\//i.test(issuerUri)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(issuerUri);
    } catch {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    if (
        parsedUrl.protocol !== "https:" ||
        parsedUrl.origin === "null" ||
        !parsedUrl.hostname ||
        parsedUrl.username ||
        parsedUrl.password
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    if (nonceType === DpopNonceType.ResourceServer) {
        return parsedUrl.origin;
    }

    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.href;
}

/**
 * Creates a versioned DPoP nonce cache entity.
 * @internal
 */
export function createDpopNonceEntity(
    clientId: string,
    nonceType: DpopNonceType,
    nonceSource: DpopNonceSource,
    nonce: unknown,
    lastUpdatedAt: number = Date.now()
): DpopNonceEntity {
    return {
        schemaVersion: DPOP_NONCE_SCHEMA_VERSION,
        nonce: validateDpopNonce(nonce),
        clientId,
        nonceType,
        nonceSource,
        lastUpdatedAt,
    };
}

/**
 * Validates the shape, ownership, and lifetime of a persisted nonce entry.
 * Exact TTL and current-time boundaries remain valid.
 * @internal
 */
export function isDpopNonceEntityValid(
    entity: unknown,
    clientId: string,
    nonceType: DpopNonceType,
    now: number = Date.now()
): entity is DpopNonceEntity {
    if (!entity || typeof entity !== "object") {
        return false;
    }

    const candidate = entity as Partial<DpopNonceEntity>;
    if (
        candidate.schemaVersion !== DPOP_NONCE_SCHEMA_VERSION ||
        candidate.clientId !== clientId ||
        candidate.nonceType !== nonceType ||
        !Object.values(DpopNonceSource).includes(
            candidate.nonceSource as DpopNonceSource
        ) ||
        typeof candidate.lastUpdatedAt !== "number" ||
        !Number.isFinite(candidate.lastUpdatedAt) ||
        candidate.lastUpdatedAt < 0 ||
        candidate.lastUpdatedAt > now ||
        now - candidate.lastUpdatedAt > DPOP_NONCE_TTL_MS
    ) {
        return false;
    }

    try {
        validateDpopNonce(candidate.nonce);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generates a bounded, versioned cache key from a precomputed issuer hash.
 * @internal
 */
export function generateDpopNonceCacheKey(
    clientId: string,
    nonceType: DpopNonceType,
    issuerHash: string
): string {
    return [
        `${DPOP_NONCE_CACHE_KEY_PREFIX}.${DPOP_NONCE_SCHEMA_VERSION}`,
        encodeURIComponent(clientId),
        nonceType,
        issuerHash,
    ].join("|");
}

/**
 * Parses any recognized DPoP nonce cache-key version.
 * @internal
 */
export function parseDpopNonceCacheKey(
    cacheKey: string
): DpopNonceCacheKey | null {
    const [versionPrefix, encodedClientId, nonceType, issuerHash, ...rest] =
        cacheKey.split("|");
    if (
        rest.length > 0 ||
        !versionPrefix.startsWith(`${DPOP_NONCE_CACHE_KEY_PREFIX}.`) ||
        !encodedClientId ||
        !Object.values(DpopNonceType).includes(nonceType as DpopNonceType) ||
        !issuerHash
    ) {
        return null;
    }

    const schemaVersion = Number(
        versionPrefix.slice(DPOP_NONCE_CACHE_KEY_PREFIX.length + 1)
    );
    if (!Number.isInteger(schemaVersion) || schemaVersion < 0) {
        return null;
    }

    try {
        return {
            schemaVersion,
            clientId: decodeURIComponent(encodedClientId),
            nonceType: nonceType as DpopNonceType,
            issuerHash,
        };
    } catch {
        return null;
    }
}
