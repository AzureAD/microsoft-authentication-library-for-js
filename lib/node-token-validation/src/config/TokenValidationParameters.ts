/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "./Configuration";
import { JwtConstants } from "../utils/Constants";
import { KeyLike } from "jose";

export type TokenValidationParameters = {
    // Valid claims
    validAlgorithms: Array<string>,
    validIssuers: Array<string>,
    validAudiences?: Array<string>,
    validTypes?: Array<string>,
    // Signature validation
    issuerSigningKeys?: Array<KeyLike|Uint8Array>,
    issuerSigningJwksUri?: string,
    // Other
    requireExpirationTime?: Boolean,
    requireSignedTokens?: Boolean,
    subject?: string
    nonce?: string,
    code?: string,
    accessTokenForAtHash?: string,
};

export type ValidationParameters = {
    // Valid claims
    validAlgorithms: Required<Array<string>>,
    validIssuers: Array<string>,
    validAudiences: Required<Array<string>>,
    validTypes?: Array<string>,
    // Signature validation
    issuerSigningKeys?: Array<KeyLike|Uint8Array>,
    issuerSigningJwksUri?: string,
    // Other
    requireExpirationTime: Required<Boolean>,
    requireSignedTokens: Required<Boolean>,
    subject?: string
    nonce?: string,
    code?: string,
    accessTokenForAtHash?: string,
};

export function buildTokenValidationParameters(params: TokenValidationParameters, config: Configuration): ValidationParameters {
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
        nonce: "",
        accessTokenForAtHash: ""
    };

    const overlaidParams: ValidationParameters = {
        validAlgorithms: params.validAlgorithms || DEFAULT_VALIDATION_PARAMS.validAlgorithms,
        validIssuers: params.validIssuers || DEFAULT_VALIDATION_PARAMS.validIssuers,
        validAudiences: params.validAudiences || DEFAULT_VALIDATION_PARAMS.validAudiences,
        validTypes: params.validTypes || DEFAULT_VALIDATION_PARAMS.validTypes,
        issuerSigningJwksUri: params.issuerSigningJwksUri || DEFAULT_VALIDATION_PARAMS.issuerSigningJwksUri,
        requireExpirationTime: params.requireExpirationTime || DEFAULT_VALIDATION_PARAMS.requireExpirationTime,
        requireSignedTokens: params.requireSignedTokens || DEFAULT_VALIDATION_PARAMS.requireSignedTokens,
        subject: params.subject || DEFAULT_ID_TOKEN_PARAMS.subject,
        nonce: params.nonce || DEFAULT_ID_TOKEN_PARAMS.nonce,
        code: params.code || DEFAULT_ID_TOKEN_PARAMS.code,
        accessTokenForAtHash: params.accessTokenForAtHash || DEFAULT_ID_TOKEN_PARAMS.accessTokenForAtHash
    };

    return overlaidParams;
}
