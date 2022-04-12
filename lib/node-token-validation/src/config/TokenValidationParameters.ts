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
 * The following OIDC-compliant claims on a JSON Web Token (JWT) are validated if set:
 * 
 * - validIssuers: Valid issuers used to check against the token's `iss` (issuer) claim. 
 *      - The `iss` claim is the principal that issued the token and is usually a case-sensitive URL with the secure token service that constructs and returns the token, and your Directory (tenant) id.
 *      - If the token was issued by the v2.0 endpoint, the URI will end in /v2.0.
 *      - Id Token issuer example: "https://login.windows-ppe.net/TENANT_ID/v2.0"
 *      - Access token issuer example: "https://sts.windows.net/TENANT_ID/"
 * - validAudiences: Valid audiences used to check against the token's `aud` (audience) claim. 
 *      - The `aud` is the intended recipient of the token and is usually a string that is or contains the Application (client) ID of your application. 
 *      - Example: "CLIENT_ID" or "api://YOUR_CLIENT_ID"
 * - subject: Subject used to check against token's `sub` (subject) claim.
 *      - The `sub` claim is the principal that is the subject of the token and is usually a case-sensitive string.
 * 
 * The following additional claims are validated if set:
 * 
 * - nonce: Nonce used to check against an id token's nonce value and mitigate replay attacks.
 *      - This is the nonce included in the authorization request to the IDP, and is usually a case-sensitive string.
 * - code: Authorization code used to check against an id token's c_hash.
 * - accessTokenForAtHash: Access token used to check against an id token's at_hash.
 * 
 * The following parameters are for decoding and validating the JSON Web Signature (JWS):
 * 
 * - validAlgorithms: Valid algorithms used to check against the token's algorithm. 
 *      - Optional, defaults to RS256
 * - issuerSigningKeys: JSON Web Key Set for token decryption.
 *      - Optional, can be created with jose.createLocalJWKSet(). Will default to retrieving keys from well-known endpoint.
 *      - Details: https://github.com/panva/jose/blob/main/docs/functions/jwks_local.createLocalJWKSet.md
 * - issuerSigningJwksUri: Uri to retrieve the token signing keys.
 *      - Optional, will default to retrieving keys from well-known endpoint.
 *      - Details: https://github.com/panva/jose/blob/main/docs/functions/jwks_remote.createRemoteJWKSet.md
 * 
 * The following are additional parameters that currently have defaults. These parameters will be used in future validation scenarios:
 * 
 * - validTypes: Valid types used to check against the token `typ` (type) header parameter value.
 *      - Optional, defaults to "JWT".
 * - requireExpirationTime: Boolean for whether tokens must have expiration value.
 *      - Optional, defaults to true.
 * - requireSignedTokens: Boolean for whether tokens must be signed.
 *      - Optional, defaults to true.
 * 
 * Additional information about claims can be found here: 
 * https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
 * https://openid.net/specs/openid-connect-core-1_0.html#ImplicitTokenValidation
 * 
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
    requireExpirationTime: Boolean,
    requireSignedTokens: Boolean,
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
