/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JwtConstants, TokenType } from "../utils/Constants";
import { JWK } from "jose";

export type TokenValidationParameters = {
    // Valid claims
    validIssuers: Array<string>,
    validAudiences: Array<string>,
    validAlgorithms?: Array<string>,
    validTypes?: Array<string>,
    // Signature validation
    issuerSigningKeys?: Array<JWK>,
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
    validTypes: Array<string>,
    // Signature validation
    issuerSigningKeys?: Array<JWK>,
    issuerSigningJwksUri?: string,
    // Other
    requireExpirationTime: Required<Boolean>,
    requireSignedTokens: Required<Boolean>,
    subject?: string
    nonce?: string,
    code?: string,
    accessTokenForAtHash?: string,
};

export function buildTokenValidationParameters(params: TokenValidationParameters): ValidationParameters {
    const DEFAULT_VALIDATION_PARAMS = {
        validAlgorithms: [JwtConstants.RSA_256],
        validTypes: [TokenType.JWT],
        requireExpirationTime: true,
        requireSignedTokens: true,
    };

    const overlaidParams: ValidationParameters = {
        ...DEFAULT_VALIDATION_PARAMS,
        ...params
    };

    return overlaidParams;
}
