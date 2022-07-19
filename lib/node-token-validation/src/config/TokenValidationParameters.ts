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
 * - validIssuers 
 * - validAudiences
 * - subject
 * 
 * The following additional claims are validated if set:
 * 
 * - nonce
 * - code
 * - accessTokenForAtHash
 * 
 * The following parameters are for decoding and validating the JSON Web Signature (JWS):
 * 
 * - validAlgorithms
 * - issuerSigningKeys
 * - issuerSigningJwksUri
 * 
 * The following are additional parameters that currently have defaults. These parameters will be used in future validation scenarios:
 * 
 * - validTypes
 * - requireExpirationTime
 * - requireSignedTokens
 * 
 * Additional information about claims can be found here: 
 * https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
 * https://openid.net/specs/openid-connect-core-1_0.html#ImplicitTokenValidation
 */
export type TokenValidationParameters = {
    /**
     * An array of valid issuers used to check against the token's `iss` (issuer) claim. 
     * The `iss` claim is the principal that issued the token and is usually a case-sensitive URL with the secure token service that constructs and returns the token, and your Directory (tenant) id.
     * If the token was issued by the v2.0 endpoint, the URI will end in /v2.0.
     * Id Token issuer example: "https://login.windows-ppe.net/TENANT_ID/v2.0"
     * Access token issuer example: "https://sts.windows.net/TENANT_ID/"
     */
    validIssuers: Required<Array<string>>,
    /**
     * An array of valid audiences used to check against the token's `aud` (audience) claim. 
     * The `aud` is the intended recipient of the token and is usually a string that is or contains the Application (client) ID of your application. 
     * Example: "CLIENT_ID" or "api://YOUR_CLIENT_ID"
     */
    validAudiences: Required<Array<string>>,
    /**
     * An array of valid algorithms used to check against the token's algorithm. 
     * Optional, defaults to RS256.
     */
    validAlgorithms?: Array<string>,
    /**
     * An array of valid types used to check against the token `typ` (type) header parameter value.
     * Optional, currently defaults to "JWT".
     */
    validTypes?: Array<string>,
    /**
     * JSON Web Key Set for token decryption.
     * Optional, can be created with jose.createLocalJWKSet(). Will default to retrieving keys from well-known endpoint.
     * Details: https://github.com/panva/jose/blob/main/docs/functions/jwks_local.createLocalJWKSet.md
     */
    issuerSigningKeys?: Array<JWK>,
    /**
     * Uri to retrieve the token signing keys.
     * Optional, will default to retrieving keys from well-known endpoint.
     * Details: https://github.com/panva/jose/blob/main/docs/functions/jwks_remote.createRemoteJWKSet.md
     */
    issuerSigningJwksUri?: string,
    /**
     * Boolean for whether tokens must have expiration value.
     * Optional, defaults to true.
     */
    requireExpirationTime?: boolean,
    /**
     * Boolean for whether tokens must be signed. 
     * Optional, defaults to true.
     */
    requireSignedTokens?: boolean,
    /**
     * Subject used to check against token's `sub` (subject) claim.
     * The `sub` claim is the principal that is the subject of the token and is usually a case-sensitive string.
     */
    subject?: string
    /**
     * Nonce used to check against an id token's nonce value to mitigate token replay attacks.
     * This is the nonce included in the authorization request to the IDP, and is usually a case-sensitive string.
     */
    nonce?: string,
    /**
     * Authorization code used to check against an id token's c_hash.
     */
    code?: string,
    /**
     * Access token used to check against an id token's at_hash.
     */
    accessTokenForAtHash?: string,
};

/**
 * Base validation parameters type used in validating tokens. 
 * Includes the same fields as {@link TokenValidationParameters}, with required fields set to defaults if not provided.
 */
export type BaseValidationParameters = Partial<TokenValidationParameters> & {
    /**
     * An array of valid issuers used to check against the token's `iss` (issuer) claim. 
     * The `iss` claim is the principal that issued the token and is usually a case-sensitive URL with the secure token service that constructs and returns the token, and your Directory (tenant) id.
     * If the token was issued by the v2.0 endpoint, the URI will end in /v2.0.
     * Id Token issuer example: "https://login.windows-ppe.net/TENANT_ID/v2.0"
     * Access token issuer example: "https://sts.windows.net/TENANT_ID/"
     */
    validIssuers: Required<Array<string>>,
    /**
     * An array of valid audiences used to check against the token's `aud` (audience) claim. 
     * The `aud` is the intended recipient of the token and is usually a string that is or contains the Application (client) ID of your application. 
     * Example: "CLIENT_ID" or "api://YOUR_CLIENT_ID"
     */
    validAudiences: Required<Array<string>>,
    /**
     * An array of valid algorithms used to check against the token's algorithm. 
     * Currently defaults to RS256.
     */
    validAlgorithms: Required<Array<string>>,
    /**
     * An array of valid types used to check against the token `typ` (type) header parameter value.
     * Currently defaults to "JWT".
     */
    validTypes: Required<Array<string>>,
    /**
     * Boolean for whether tokens must have expiration value.
     * Defaults to true.
     */
    requireExpirationTime: Required<boolean>,
    /**
     * Boolean for whether tokens must be signed. 
     * Defaults to true.
     */
    requireSignedTokens: Required<boolean>
};

/**
 * Function that sets default options when not explicity passed in token validation parameters
 *
 * @param {TokenValidationParameters} params Token validation parameters provided 
 * @returns {BaseValidationParameters} Validation parameters built with defaults
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
