/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "./CryptoOps.js";
import { TokenBindingKeyManager } from "./TokenBindingKeyManager.js";
import {
    DpopProofGenerator,
    GenerateDpopResourceProofParams,
    Logger,
    LoggerOptions,
} from "@azure/msal-common/browser";
import { version, name } from "../packageMetadata.js";

export type DpopProofSignerOptions = {
    logger?: Logger;
    loggerOptions?: LoggerOptions;
};

/**
 * Browser wrapper for generating RFC 9449 DPoP key thumbprints and proof JWTs.
 */
export class DpopProofSigner {
    private dpopProofGenerator: DpopProofGenerator;

    constructor(options?: DpopProofSignerOptions) {
        const logger =
            options?.logger?.clone(name, version) ||
            new Logger(options?.loggerOptions || {}, name, version);
        this.dpopProofGenerator = new DpopProofGenerator(
            new CryptoOps(logger),
            new TokenBindingKeyManager(logger)
        );
    }

    /**
     * Provisions a browser-held DPoP keypair and returns its JWK thumbprint.
     */
    generatePublicKeyThumbprint(correlationId: string = ""): Promise<string> {
        return this.dpopProofGenerator.generateJkt(correlationId);
    }

    /**
     * Generates a DPoP proof for the token endpoint.
     */
    signTokenRequest(
        parameters: {
            tokenEndpoint: string;
            correlationId: string;
            nonce?: string;
        },
        publicKeyThumbprint: string
    ): Promise<string> {
        return this.dpopProofGenerator.generateTokenProof(
            {
                tokenEndpoint: parameters.tokenEndpoint,
                nonce: parameters.nonce,
            },
            publicKeyThumbprint,
            parameters.correlationId
        );
    }

    /**
     * Generates a DPoP proof for a resource request.
     */
    signResourceRequest(
        parameters: {
            accessToken: string;
            resourceRequestUri?: string;
            resourceRequestMethod?: string;
            resourceRequestNonce?: string;
            correlationId: string;
        },
        publicKeyThumbprint: string
    ): Promise<string> {
        const proofParams: GenerateDpopResourceProofParams = {
            accessToken: parameters.accessToken,
            htu: parameters.resourceRequestUri,
            htm: parameters.resourceRequestMethod,
            nonce: parameters.resourceRequestNonce,
        };

        return this.dpopProofGenerator.generateResourceProof(
            proofParams,
            publicKeyThumbprint,
            parameters.correlationId
        );
    }
}
