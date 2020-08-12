/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * http methods
 */
export enum HttpMethod {
    GET = 'get',
    POST = 'post',
}

/**
 * Constant used for PKCE
 */
export const RANDOM_OCTET_SIZE = 32;

/**
 * Constants used in PKCE
 */
export const Hash = {
    SHA256: 'sha256',
};

/**
 * Constants for encoding schemes
 */
export const CharSet = {
    CV_CHARSET:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~',
};

/**
 * Cache Constants
 */
export const CACHE = {
    FILE_CACHE: 'fileCache',
    EXTENSION_LIB: 'extenstion_library',
};

/**
 * Constants
 */
export const Constants = {
    MSAL_SKU: 'msal.js.node',
    JWT_BEARER_ASSERTION_TYPE: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
};

/**
 * JWT  constants
 */
export const JwtConstants = {
    ALGORITHM: 'alg',
    RSA_256: 'RS256',
    X5T: 'x5t', 
    AUDIENCE: 'aud',
    EXPIRATION_TIME: 'exp',
    ISSUER: "iss",
    SUBJECT: "sub",
    NOT_BEFORE: "nbf",
    JWT_ID: "jti",
} 
