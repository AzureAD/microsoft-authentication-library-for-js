/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createClientConfigurationError } from "../error/ClientConfigurationError.js";
import * as ClientConfigurationErrorCodes from "../error/ClientConfigurationErrorCodes.js";
import { UrlString } from "../url/UrlString.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import { ICrypto } from "./ICrypto.js";

export const DPOP_JWT_TYPE = "dpop+jwt";

export type DpopProofJwk = Record<string, string>;

export type DpopProofHeader = {
    typ: typeof DPOP_JWT_TYPE;
    alg: string;
    jwk: DpopProofJwk;
};

export type DpopTokenClaims = {
    jti: string;
    htm: string;
    htu: string;
    iat: number;
};

export type DpopResourceClaims = DpopTokenClaims & {
    ath: string;
};

export type DpopProof<TClaims extends DpopTokenClaims | DpopResourceClaims> = {
    header: DpopProofHeader;
    claims: TClaims;
};

export type DpopResourceRequestContext = {
    method: string;
    uri: string;
    normalizedMethod: string;
    normalizedUri: string;
};

export function buildDpopResourceRequestContext(
    resourceRequestMethod: string | undefined,
    resourceRequestUri: string | undefined,
    correlationId: string
): DpopResourceRequestContext {
    if (!resourceRequestMethod) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.missingDpopResourceRequestMethod,
            correlationId
        );
    }

    if (!resourceRequestUri) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.missingDpopResourceRequestUri,
            correlationId
        );
    }

    const url = new UrlString(resourceRequestUri, correlationId).getUrlComponents();
    if (!url.Protocol || !url.HostNameAndPort || !url.AbsolutePath) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidDpopResourceRequest,
            correlationId
        );
    }

    return {
        method: resourceRequestMethod,
        uri: resourceRequestUri,
        normalizedMethod: resourceRequestMethod.toUpperCase(),
        normalizedUri: `${url.Protocol.toLowerCase()}//${url.HostNameAndPort.toLowerCase()}${url.AbsolutePath}${url.QueryString ? `?${url.QueryString}` : ""}`,
    };
}

/** @internal */
export class DpopProofGenerator {
    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    generateTokenProof(
        algorithm: string,
        jwk: DpopProofJwk,
        resourceRequestContext: DpopResourceRequestContext
    ): DpopProof<DpopTokenClaims> {
        return {
            header: {
                typ: DPOP_JWT_TYPE,
                alg: algorithm,
                jwk,
            },
            claims: {
                jti: this.cryptoUtils.createNewGuid(),
                htm: resourceRequestContext.normalizedMethod,
                htu: resourceRequestContext.normalizedUri,
                iat: TimeUtils.nowSeconds(),
            },
        };
    }

    async generateResourceProof(
        algorithm: string,
        jwk: DpopProofJwk,
        resourceRequestContext: DpopResourceRequestContext,
        accessToken: string
    ): Promise<DpopProof<DpopResourceClaims>> {
        const tokenProof = this.generateTokenProof(
            algorithm,
            jwk,
            resourceRequestContext
        );

        return {
            header: tokenProof.header,
            claims: {
                ...tokenProof.claims,
                ath: await this.cryptoUtils.hashString(accessToken),
            },
        };
    }
}
