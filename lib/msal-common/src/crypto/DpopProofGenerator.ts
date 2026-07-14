/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    JsonWebTokenAlgorithms,
    TokenBindingKeyContext,
} from "./ICrypto.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import { JoseHeader } from "./JoseHeader.js";
import { JsonWebTokenTypes } from "../utils/Constants.js";

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
 * Parameters for provisioning a DPoP key and producing its JWK thumbprint
 * (`dpop_jkt`).
 * @internal
 */
export type DpopJktGenerationParams = {
    clientId: string;
    authority: string;
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
    typ: typeof JsonWebTokenTypes.Dpop;
    alg: string;
    jwk: DpopPublicJwk;
};

/**
 * Parameters shared by token and resource DPoP proof generation.
 * @internal
 */
export type DpopProofGenerationParams = {
    publicJwk: DpopPublicJwk;
    keyId: string;
    keyContext: TokenBindingKeyContext;
};

const DPOP_HTM_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const DPOP_TOKEN_BINDING_KEY_TYPE = "dpop";
export const DPOP_JWT_HEADER_TYPE = JsonWebTokenTypes.Dpop;
export const DPOP_JWT_HEADER_ALGORITHM = JsonWebTokenAlgorithms.ES256;

function buildProofHeader(
    params: DpopProofGenerationParams,
    correlationId: string
): JoseHeader {
    return JoseHeader.getDpopHeader(
        {
            alg: DPOP_JWT_HEADER_ALGORITHM,
            jwk: params.publicJwk,
        },
        correlationId
    );
}

function normalizeHtm(htm: string, correlationId: string): string {
    if (typeof htm !== "string" || !DPOP_HTM_REGEX.test(htm)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopHtm,
            correlationId
        );
    }

    return htm.toUpperCase();
}

/**
 * Normalizes a URL for use as the DPoP htu claim.
 * Per RFC 9449 §4.2, htu is the target URI without query and fragment components.
 * WHATWG URL serialization handles RFC 3986 syntax- and scheme-based normalization
 * such as lowercasing scheme/host and eliding default ports.
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

    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.href;
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
export class DpopProofGenerator {
    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    /**
     * Provisions or reuses the DPoP key for a client/authority pair and
     * returns the RFC 7638 JWK thumbprint used as `dpop_jkt`.
     */
    async generateJkt(
        params: DpopJktGenerationParams,
        correlationId: string = ""
    ): Promise<string> {
        return this.cryptoUtils.provisionTokenBindingKey({
            tokenBindingKeyType: DPOP_TOKEN_BINDING_KEY_TYPE,
            tokenBindingKeyAlgorithm: DPOP_JWT_HEADER_ALGORITHM,
            keyScope: this.getKeyScope(params),
            correlationId,
        });
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
        const claims: DpopProofClaims = {
            jti: this.cryptoUtils.createNewGuid(),
            htm: normalizeHtm(params.htm, correlationId),
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
        return this.cryptoUtils.signTokenBindingJwt(
            buildProofHeader(params, correlationId),
            claims,
            params.keyId,
            correlationId,
            params.keyContext
        );
    }

    private getKeyScope(params: DpopJktGenerationParams): string {
        return `${DPOP_TOKEN_BINDING_KEY_TYPE}.${params.clientId}.${params.authority}`;
    }
}
