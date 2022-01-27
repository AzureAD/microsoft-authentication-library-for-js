/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "./Configuration";
import { JwtConstants } from "../utils/Constants";
import { AlgorithmValidator, AudienceValidator, IssuerValidator, LifetimeValidator, SignatureValidator, TypeValidator, IssuerSigningKeyValidator, IssuerSigningKeyResolver, TokenDecryptionKeyResolver } from "../utils/ValidatorUtils";

export type TokenValidationParameters = {
    // Valid claims
    validAlgorithms: Array<string>,
    validIssuers: Array<string>,
    validAudiences: Array<string>,
    validTypes?: Array<string>,
    // Validator overrides
    algorithmValidator?: AlgorithmValidator,
    audienceValidator?: AudienceValidator,
    issuerValidator?: IssuerValidator,
    lifetimeValidator?: LifetimeValidator,
    signatureValidator?: SignatureValidator,
    typeValidator?: TypeValidator,
    // Signature validation
    issuerSigningKeys?: Array<any>,
    issuerSigningJwksUri?: string,
    issuerSigningKeyValidator?: IssuerSigningKeyValidator,
    issuerSigningKeyResolver?: IssuerSigningKeyResolver,
    // Token decryption
    tokenDecryptionKeys?: Array<any>,
    tokenDecryptionKeyResolver?: TokenDecryptionKeyResolver,
    // Other?
    requireExpirationTime?: Boolean,
    requireSignedTokens?: Boolean,
    subject?: string
    nonce?: string,
    code?: string,
    accessTokenForAtHash?: string,
};

export type TokenInputParameters = {
    // Valid claims
    validAlgorithms: Array<string>,
    validIssuers: Array<string>,
    validAudiences?: Array<string>,
    validTypes?: Array<string>,
    // Validator overrides
    algorithmValidator?: AlgorithmValidator,
    audienceValidator?: AudienceValidator,
    issuerValidator?: IssuerValidator,
    lifetimeValidator?: LifetimeValidator,
    signatureValidator?: SignatureValidator,
    typeValidator?: TypeValidator,
    // Signature validation
    issuerSigningKeys?: Array<any>,
    issuerSigningJwksUri?: string,
    issuerSigningKeyValidator?: IssuerSigningKeyValidator,
    issuerSigningKeyResolver?: IssuerSigningKeyResolver,
    // Token decryption
    tokenDecryptionKeys?: Array<any>,
    tokenDecryptionKeyResolver?: TokenDecryptionKeyResolver,
    // Other?
    requireExpirationTime?: Boolean,
    requireSignedTokens?: Boolean,
    subject?: string
    nonce?: string,
    code?: string,
    accessTokenForAtHash?: string,
};

export function buildTokenValidationParameters(params: TokenInputParameters, config: Configuration): TokenValidationParameters {
    const DEFAULT_VALIDATION_PARAMS = { // Are there defaults for these? Which ones should not have defaults?
        validAlgorithms: [JwtConstants.RSA_256],
        validIssuers: [],
        validAudiences: [`api://${config.auth.clientId}`, config.auth.clientId], // Is this still needed now in this new library?
        validTypes: [], // .NET: if not set, all types will be accepted
        jweKeyStore: "",
        issuerSigningJwksUri: "",
        requireExpirationTime: true,
        requireSignedTokens: true,
    };

    const DEFAULT_ID_TOKEN_PARAMS = {
        code: "",
        subject: "",
        nonce: ""
    };

    const DEFAULT_ACCESS_TOKEN_PARAMS = {
        accessTokenForAtHash: ""
    };

    const overlaidParams: TokenValidationParameters = {
        validAlgorithms: params.validAlgorithms || DEFAULT_VALIDATION_PARAMS.validAlgorithms,
        validIssuers: params.validIssuers || DEFAULT_VALIDATION_PARAMS.validIssuers,
        validAudiences: params.validAudiences || DEFAULT_VALIDATION_PARAMS.validAudiences,
        validTypes: params.validTypes || DEFAULT_VALIDATION_PARAMS.validTypes,
        issuerSigningJwksUri: params.issuerSigningJwksUri || DEFAULT_VALIDATION_PARAMS.issuerSigningJwksUri,
        subject: params.subject || DEFAULT_ID_TOKEN_PARAMS.subject,
        nonce: params.nonce || DEFAULT_ID_TOKEN_PARAMS.nonce,
        code: params.code || DEFAULT_ID_TOKEN_PARAMS.code,
        accessTokenForAtHash: params.accessTokenForAtHash || DEFAULT_ACCESS_TOKEN_PARAMS.accessTokenForAtHash
    };

    return overlaidParams;
}
