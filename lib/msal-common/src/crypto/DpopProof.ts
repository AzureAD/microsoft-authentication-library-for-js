/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createClientAuthError } from "../error/ClientAuthError.js";
import * as ClientAuthErrorCodes from "../error/ClientAuthErrorCodes.js";
import type { ICrypto } from "./ICrypto.js";
import * as TimeUtils from "../utils/TimeUtils.js";

const DPOP_PROOF_JWT_TYPE = "dpop+jwt";

export type DpopProofHeader = {
    typ: typeof DPOP_PROOF_JWT_TYPE;
    alg: string;
    jwk: Record<string, unknown>;
};

export type DpopProofClaims = {
    jti: string;
    htm: string;
    htu: string;
    iat: number;
    ath?: string;
};

export type DpopProof = {
    header: DpopProofHeader;
    payload: DpopProofClaims;
};

export type DpopProofGenerationOptions = {
    correlationId: string;
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    alg: string;
    jwk: Record<string, unknown>;
    accessToken?: string;
    jti?: string;
    iat?: number;
};

export class DpopProofGenerator {
    private cryptoUtils: Pick<ICrypto, "createNewGuid" | "hashString">;

    constructor(cryptoUtils: Pick<ICrypto, "createNewGuid" | "hashString">) {
        this.cryptoUtils = cryptoUtils;
    }

    async generateProof(
        options: DpopProofGenerationOptions
    ): Promise<DpopProof> {
        const resourceRequestMethod = options.resourceRequestMethod;
        if (!resourceRequestMethod) {
            throw createClientAuthError(
                ClientAuthErrorCodes.dpopResourceRequestMethodRequired,
                options.correlationId
            );
        }

        const resourceRequestUri = options.resourceRequestUri;
        if (!resourceRequestUri) {
            throw createClientAuthError(
                ClientAuthErrorCodes.dpopResourceRequestUriRequired,
                options.correlationId
            );
        }

        return {
            header: {
                typ: DPOP_PROOF_JWT_TYPE,
                alg: options.alg,
                jwk: options.jwk,
            },
            payload: {
                jti: options.jti || this.cryptoUtils.createNewGuid(),
                htm: resourceRequestMethod.toUpperCase(),
                htu: removeUrlFragment(resourceRequestUri),
                iat: options.iat || TimeUtils.nowSeconds(),
                ath: options.accessToken
                    ? await this.cryptoUtils.hashString(options.accessToken)
                    : undefined,
            },
        };
    }
}

function removeUrlFragment(url: string): string {
    return url.split("#")[0];
}
