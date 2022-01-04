/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../utils/Constants";

export type TokenValidationParameters = {
    rawTokenString: string,
    algorithm: Array<string>,
    issuer: string,
    audience?: string,
    jweKeyStore?: any,
    jwksUri?: string,
    subject?: string
    nonce?: string,
    scopes?: Array<string>,
    code?: string,
    accessToken?: string,
    tokenMustContainScopes?: Boolean // Default is intersect, can set to contain
};

export function buildTokenValidationParameters(params: TokenValidationParameters): TokenValidationParameters {
    const DEFAULT_VALIDATION_PARAMS = { // Are there defaults for these? Which ones should not have defaults?
        algorithm: ["RS256"],
        issuer: "",
        audience: "",
        jweKeyStore: "",
        jwksUri: Constants.DEFAULT_JWKS_URI
    };

    const DEFAULT_ID_TOKEN_PARAMS = {
        code: "",
        subject: "",
        nonce: ""
    };

    const DEFAULT_ACCESS_TOKEN_PARAMS = {
        accessToken: "",
        tokenMustContainScopes: false
    };

    const overlayedParams: TokenValidationParameters = {
        rawTokenString: params.rawTokenString,
        algorithm: params.algorithm || DEFAULT_VALIDATION_PARAMS.algorithm,
        issuer: params.issuer || DEFAULT_VALIDATION_PARAMS.issuer,
        audience: params.audience || DEFAULT_VALIDATION_PARAMS.audience,
        jweKeyStore: params.jweKeyStore || null,
        jwksUri: params.jwksUri || DEFAULT_VALIDATION_PARAMS.jwksUri,
        subject: params.subject || DEFAULT_ID_TOKEN_PARAMS.subject,
        nonce: params.nonce || DEFAULT_ID_TOKEN_PARAMS.nonce,
        scopes: params.scopes,
        code: params.code || DEFAULT_ID_TOKEN_PARAMS.code,
        accessToken: params.accessToken || DEFAULT_ACCESS_TOKEN_PARAMS.accessToken,
        tokenMustContainScopes: params.tokenMustContainScopes || DEFAULT_ACCESS_TOKEN_PARAMS.tokenMustContainScopes
    };

    return overlayedParams;
}