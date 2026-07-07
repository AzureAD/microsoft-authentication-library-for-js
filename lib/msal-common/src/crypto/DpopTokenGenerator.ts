/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    JsonWebTokenAlgorithms,
    PRIVATE_JWK_MEMBERS,
    SHA256_BASE64URL_REGEX,
} from "./ICrypto.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import { removeQueryStringAndFragment } from "../utils/UrlUtils.js";

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
 * Public JWK embedded in the DPoP proof header.
 * @internal
 */
export type DpopPublicJwk = Record<string, unknown>;

/**
 * RFC 9449 DPoP proof JWT header.
 * @internal
 */
export type DpopProofHeader = {
    typ: typeof DPOP_JWT_HEADER_TYPE;
    alg: string;
    jwk: DpopPublicJwk;
};

/**
 * Signs the ASCII DPoP JWT signing input with the declared JOSE alg
 * and returns a base64url-encoded signature.
 * @internal
 */
export type DpopProofSigner = {
    alg: string;
    sign: (signingInput: string, correlationId: string) => Promise<string>;
};

/**
 * Parameters shared by token and resource DPoP proof generation.
 * @internal
 */
export type DpopProofGenerationParams = {
    publicJwk: DpopPublicJwk;
    signer: DpopProofSigner;
};

const DPOP_ATH_REGEX = SHA256_BASE64URL_REGEX;
const DPOP_PRIVATE_JWK_MEMBERS = PRIVATE_JWK_MEMBERS;
export const DPOP_JWT_HEADER_TYPE = "dpop+jwt";
export const DPOP_JWT_HEADER_ALGORITHM = JsonWebTokenAlgorithms.ES256;

/**
 * Normalizes a URL for use as the DPoP htu claim.
 * Per RFC 9449 §4.2, htu is the target URI without query and fragment components.
 * @internal
 */
function normalizeHtu(url: string, correlationId: string): string {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.urlParseError,
            correlationId
        );
    }

    if (
        !/^https:\/\//i.test(url) ||
        parsedUrl.protocol !== "https:" ||
        parsedUrl.username ||
        parsedUrl.password
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtu,
            correlationId
        );
    }

    return removeQueryStringAndFragment(url);
}

function validateAth(ath: string, correlationId: string): void {
    if (!DPOP_ATH_REGEX.test(ath)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopAth,
            correlationId
        );
    }
}

function sanitizePublicJwk(
    publicJwk: DpopPublicJwk,
    correlationId: string
): DpopPublicJwk {
    const hasPrivateMember = DPOP_PRIVATE_JWK_MEMBERS.some((member) =>
        Object.prototype.hasOwnProperty.call(publicJwk, member)
    );

    if (hasPrivateMember) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopPublicJwk,
            correlationId
        );
    }

    return { ...publicJwk };
}

function buildProofHeader(
    params: DpopProofGenerationParams,
    correlationId: string
): DpopProofHeader {
    return {
        typ: DPOP_JWT_HEADER_TYPE,
        alg: params.signer.alg,
        jwk: sanitizePublicJwk(params.publicJwk, correlationId),
    };
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
            htu: normalizeHtu(params.tokenEndpoint, correlationId),
            iat: TimeUtils.nowSeconds(),
        };
        if (params.nonce !== undefined) {
            claims.nonce = params.nonce;
        }
        return claims;
    }

    /**
     * Builds and signs a compact DPoP proof JWT for a token-endpoint request.
     */
    async generateTokenProof(
        params: DpopTokenProofParams & DpopProofGenerationParams,
        correlationId: string = ""
    ): Promise<string> {
        return this.generateProof(
            this.buildTokenProofClaims(params, correlationId),
            params,
            correlationId
        );
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
        validateAth(params.ath, correlationId);

        const claims: DpopProofClaims = {
            jti: this.cryptoUtils.createNewGuid(),
            htm: params.htm.toUpperCase(),
            htu: normalizeHtu(params.resourceUrl, correlationId),
            ath: params.ath,
            iat: TimeUtils.nowSeconds(),
        };
        if (params.nonce !== undefined) {
            claims.nonce = params.nonce;
        }
        return claims;
    }

    /**
     * Builds and signs a compact DPoP proof JWT for a resource request.
     */
    async generateResourceProof(
        params: DpopResourceProofParams & DpopProofGenerationParams,
        correlationId: string = ""
    ): Promise<string> {
        return this.generateProof(
            this.buildResourceProofClaims(params, correlationId),
            params,
            correlationId
        );
    }

    private async generateProof(
        claims: DpopProofClaims,
        params: DpopProofGenerationParams,
        correlationId: string
    ): Promise<string> {
        const encodedHeader = this.cryptoUtils.base64UrlEncode(
            JSON.stringify(buildProofHeader(params, correlationId))
        );
        const encodedClaims = this.cryptoUtils.base64UrlEncode(
            JSON.stringify(claims)
        );
        const signingInput = `${encodedHeader}.${encodedClaims}`;
        const signature = await params.signer.sign(signingInput, correlationId);

        return `${signingInput}.${signature}`;
    }
}
