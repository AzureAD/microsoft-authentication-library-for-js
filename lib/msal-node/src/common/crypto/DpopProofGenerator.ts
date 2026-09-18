/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, JsonWebTokenAlgorithms } from "./ICrypto.js";
import { ITokenBindingKeyManager } from "./ITokenBindingKeyManager.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import { JoseHeader } from "./JoseHeader.js";
import type { PublicJsonWebKey } from "./PublicJsonWebKey.js";

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
    htu: string;
    htm: string;
    ath: string;
    nonce?: string;
};

export type GenerateDpopResourceProofParams = {
    htu?: string;
    htm?: string;
    nonce?: string;
    accessToken: string;
};

const DPOP_HTM_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const DPOP_TOKEN_BINDING_KEY_TYPE = "dpop";
const DPOP_JWT_HEADER_ALGORITHM = JsonWebTokenAlgorithms.ES256;

function buildProofHeader(
    publicJwk: PublicJsonWebKey,
    correlationId: string
): JoseHeader {
    return JoseHeader.getDpopHeader(
        {
            alg: DPOP_JWT_HEADER_ALGORITHM,
            jwk: publicJwk,
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

function validateDpopNonce(
    nonce: string | undefined,
    correlationId: string
): void {
    if (nonce !== undefined && nonce.trim().length === 0) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopNonce,
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
export class DpopProofGenerator {
    private cryptoUtils: ICrypto;
    private tokenBindingKeyManager: ITokenBindingKeyManager;

    constructor(
        cryptoUtils: ICrypto,
        tokenBindingKeyManager: ITokenBindingKeyManager
    ) {
        this.cryptoUtils = cryptoUtils;
        this.tokenBindingKeyManager = tokenBindingKeyManager;
    }

    /**
     * Provisions a fresh DPoP key and returns the RFC 7638 JWK thumbprint used
     * as `dpop_jkt`.
     */
    async generateJkt(correlationId: string = ""): Promise<string> {
        return this.tokenBindingKeyManager.provisionTokenBindingKey({
            tokenBindingKeyType: DPOP_TOKEN_BINDING_KEY_TYPE,
            tokenBindingKeyAlgorithm: DPOP_JWT_HEADER_ALGORITHM,
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
        validateDpopNonce(params.nonce, correlationId);
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
        params: DpopTokenProofParams,
        keyId: string,
        correlationId: string = ""
    ): Promise<string> {
        return this.generateProof(
            this.buildTokenProofClaims(params, correlationId),
            keyId,
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
        validateDpopNonce(params.nonce, correlationId);
        const claims: DpopProofClaims = {
            jti: this.cryptoUtils.createNewGuid(),
            htm: normalizeHtm(params.htm, correlationId),
            htu: normalizeHtu(params.htu, correlationId),
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
        params: GenerateDpopResourceProofParams,
        keyId: string,
        correlationId: string = ""
    ): Promise<string> {
        const { htu, htm, nonce } = params;
        if (!htu || !htm) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.dpopMissingResourceContext,
                correlationId
            );
        }

        const ath = await this.cryptoUtils.hashString(params.accessToken);
        return this.generateProof(
            this.buildResourceProofClaims(
                {
                    htu,
                    htm,
                    ath,
                    nonce,
                },
                correlationId
            ),
            keyId,
            correlationId
        );
    }

    private async generateProof(
        claims: DpopProofClaims,
        keyId: string,
        correlationId: string
    ): Promise<string> {
        const publicJwk =
            await this.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                correlationId
            );

        return this.cryptoUtils.signTokenBindingJwt(
            buildProofHeader(publicJwk, correlationId),
            claims,
            keyId,
            correlationId
        );
    }
}
