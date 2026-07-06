/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto } from "./ICrypto.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";

/**
 * RFC 9449 DPoP proof JWT payload claims.
 * Not exported from any public package entry point.
 * @internal
 */
export type DpopProofClaims = {
    jti: string;
    htm: string;
    htu: string;
    iat: number;
    nonce?: string;
    ath?: string;
};

/**
 * Parameters for building a token-endpoint DPoP proof.
 * @internal
 */
export type DpopTokenProofParams = {
    tokenEndpoint: string;
    nonce?: string;
};

/**
 * Parameters for building a resource-endpoint DPoP proof.
 * @internal
 */
export type DpopResourceProofParams = {
    resourceUrl: string;
    htm: string;
    ath: string;
    nonce?: string;
};

const SHA256_BASE64URL_REGEX = /^[A-Za-z0-9_-]{43}$/;
const HTTP_METHOD_REGEX = /^[A-Za-z]+$/;
export const DPOP_JWT_HEADER_ALGORITHM = "ES256";

/**
 * Normalizes a URL for use as the DPoP htu claim.
 * Per RFC 9449 §4.2, htu is the target URI without query and fragment components.
 * @internal
 */
function normalizeDpopHtu(url: string, correlationId: string): string {
    if (!/^https:\/\//i.test(url)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.urlParseError,
            correlationId
        );
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.urlParseError,
            correlationId
        );
    }

    if (parsedUrl.protocol !== "https:") {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.urlParseError,
            correlationId
        );
    }

    /*
     * RFC 9449 §4.2: htu is the target URI without query and fragment.
     * Use the URL API only for parsing and scheme/host canonicalization; avoid
     * UrlString comparison normalization because DPoP target matching must not
     * lowercase or add trailing slashes to the path component.
     */
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
}

function normalizeDpopHttpMethod(
    method: string,
    correlationId: string
): string {
    if (!HTTP_METHOD_REGEX.test(method)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidClaims,
            correlationId
        );
    }

    return method.toUpperCase();
}

function validateDpopAth(ath: string, correlationId: string): void {
    if (!SHA256_BASE64URL_REGEX.test(ath)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidClaims,
            correlationId
        );
    }
}

/**
 * Builds RFC 9449 DPoP proof JWT payloads for token-endpoint and
 * resource-endpoint proof bindings.
 *
 * Not exported from any public package entry point.
 * This helper is internal-only until DPoP is wired into acquisition flows
 * in a subsequent work item.
 *
 * DPoP proofs do not contain SHR fields (at, ts, m, u, p, q).
 * @internal
 */
export class DpopTokenGenerator {
    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    /**
     * Builds RFC 9449 claims for a token-endpoint DPoP proof.
     * - htm is always "POST" because token endpoint requests use HTTP POST (RFC 9449 §5).
     * - htu is the normalized token endpoint URI (query and fragment stripped).
     * - jti is a fresh CSPRNG-backed unique identifier for every proof.
     */
    buildTokenProofClaims(
        params: DpopTokenProofParams,
        correlationId: string = ""
    ): DpopProofClaims {
        const claims: DpopProofClaims = {
            jti: this.cryptoUtils.createNewGuid(),
            htm: "POST",
            htu: normalizeDpopHtu(params.tokenEndpoint, correlationId),
            iat: TimeUtils.nowSeconds(),
        };
        if (params.nonce !== undefined) {
            claims.nonce = params.nonce;
        }
        return claims;
    }

    /**
     * Builds RFC 9449 claims for a resource-endpoint DPoP proof.
     * - htm is uppercased per RFC 9449 §4.2.
     * - htu is the normalized resource URI (query and fragment stripped).
     * - ath is the base64url-encoded SHA-256 hash of the ASCII access token.
     * - jti is a fresh CSPRNG-backed unique identifier for every proof.
     */
    buildResourceProofClaims(
        params: DpopResourceProofParams,
        correlationId: string = ""
    ): DpopProofClaims {
        validateDpopAth(params.ath, correlationId);

        const claims: DpopProofClaims = {
            jti: this.cryptoUtils.createNewGuid(),
            htm: normalizeDpopHttpMethod(params.htm, correlationId),
            htu: normalizeDpopHtu(params.resourceUrl, correlationId),
            ath: params.ath,
            iat: TimeUtils.nowSeconds(),
        };
        if (params.nonce !== undefined) {
            claims.nonce = params.nonce;
        }
        return claims;
    }
}
