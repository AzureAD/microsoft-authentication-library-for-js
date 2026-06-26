/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto } from "./ICrypto.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import { UrlString } from "../url/UrlString.js";

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

/**
 * Normalizes a URL for use as the DPoP htu claim.
 * Per RFC 9449 §4.2, htu is the target URI without query and fragment components.
 * @internal
 */
function normalizeDpopHtu(url: string, correlationId: string): string {
    const urlObj = new UrlString(url, correlationId);
    const components = urlObj.getUrlComponents();
    // RFC 9449 §4.2: htu is the target URI without query and fragment.
    // Use "/" as the path when AbsolutePath is empty (bare origin URL).
    const path = components.AbsolutePath || "/";
    return `${components.Protocol}//${components.HostNameAndPort}${path}`;
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
        const claims: DpopProofClaims = {
            jti: this.cryptoUtils.createNewGuid(),
            htm: params.htm.toUpperCase(),
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
