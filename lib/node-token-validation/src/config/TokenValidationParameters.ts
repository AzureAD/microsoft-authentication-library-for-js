/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JwtConstants, TokenType } from "../utils/Constants";
import { JWK } from "jose";

/**
 * Validation parameters object set by the user that contains options for the token to be validated against. 
 * All claims are optional except for validIssuers and validAudiences, which are required.
 * 
 * - validIssuers: Valid issuers used to check against the token's issuer. 
 * - validAudiences: Valid audiences used to check against the token's audience.
 * - validAlgorithms: Valid algorithms used to check against the token's algorithm. Optional with default.
 * - validTypes: Valid types used to check against the token `typ`. Optional with default.
 * - issuerSigningKeys: Key store for token decryption.
 * - issuerSigningJwksUri: Uri to retrieve the token signing keys.
 * - requireExpirationTime: Boolean for whether tokens must have expiration value. Defaults to true.
 * - requireSignedTokens: Boolean for whether tokens must be signed. Defaults to true.
 * - subject: Subject used to check against token's `sub` value.
 * - nonce: Nonce used to check against an id token's nonce value. 
 * - code: Authorization code used to check against an id token's c_hash.
 * - accessTokenForAtHash: Access token used to check against an id token's at_hash.
 * @public
 */
export type TokenValidationParameters = Partial<BaseValidationParameters> & {
    validIssuers: Required<Array<string>>,
    validAudiences: Required<Array<string>>
};

/**
 * Validation parameters used in validating tokens. Includes the user-input parameters with defaults.
 * 
 * - validIssuers: Valid issuers used to check against the token's issuer. 
 * - validAudiences: Valid audiences used to check against the token's audience.
 * - validAlgorithms: Valid algorithms used to check against the token's algorithm. Optional with default.
 * - validTypes: Valid types used to check against the token `typ`. Optional with default.
 * - issuerSigningKeys: Key store for token decryption.
 * - issuerSigningJwksUri: Uri to retrieve the token signing keys.
 * - requireExpirationTime: Boolean for whether tokens must have expiration value. Defaults to true.
 * - requireSignedTokens: Boolean for whether tokens must be signed. Defaults to true.
 * - subject: Subject used to check against token's `sub` value.
 * - nonce: Nonce used to check against an id token's nonce value. 
 * - code: Authorization code used to check against an id token's c_hash.
 * - accessTokenForAtHash: Access token used to check against an id token's at_hash.
 * @public
 */
export type BaseValidationParameters = {
    validAlgorithms: Array<string>,
    validIssuers: Array<string>,
    validAudiences: Array<string>,
    validTypes: Array<string>,
    issuerSigningKeys?: Array<JWK>,
    issuerSigningJwksUri?: string,
    requireExpirationTime: boolean,
    requireSignedTokens: boolean,
    subject?: string
    nonce?: string,
    code?: string,
    accessTokenForAtHash?: string,
};

/**
 * Function that sets default options when not explicity passed in token validation parameters
 * @param params 
 * @returns 
 */
export function buildTokenValidationParameters(params: TokenValidationParameters): BaseValidationParameters {
    const DEFAULT_VALIDATION_PARAMS = {
        validAlgorithms: [JwtConstants.RSA_256],
        validTypes: [TokenType.JWT],
        requireExpirationTime: true,
        requireSignedTokens: true,
    };

    const overlaidParams: BaseValidationParameters = {
        ...DEFAULT_VALIDATION_PARAMS,
        ...params
    };

    return overlaidParams;
}
