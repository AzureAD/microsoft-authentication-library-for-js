/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * http methods
 */
export enum HttpMethod {
    GET = "get",
    POST = "post",
}

/**
 * Constants used for region discovery
 */
export const REGION_ENVIRONMENT_VARIABLE = "REGION_NAME";

/**
 * Constant used for PKCE
 */
export const RANDOM_OCTET_SIZE = 32;

/**
 * Constants used in PKCE
 */
export const Hash = {
    SHA256: "sha256",
};

/**
 * Constants for encoding schemes
 */
export const CharSet = {
    CV_CHARSET:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",
};

/**
 * Cache Constants
 */
export const CACHE = {
    FILE_CACHE: "fileCache",
    EXTENSION_LIB: "extenstion_library",
};

/**
 * Constants
 */
export const Constants = {
    MSAL_SKU: "msal.js.node",
    JWT_BEARER_ASSERTION_TYPE: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
};

/**
 * API Codes for Telemetry purposes.
 * Before adding a new code you must claim it in the MSAL Telemetry tracker as these number spaces are shared across all MSALs
 * 0-99 Silent Flow
 * 600-699 Device Code Flow
 * 800-899 Auth Code Flow
 */
export enum ApiId {
    acquireTokenSilent = 62,
    acquireTokenByUsernamePassword = 371,
    acquireTokenByDeviceCode = 671,
    acquireTokenByClientCredential = 771,
    acquireTokenByCode = 871,
    acquireTokenByRefreshToken = 872
}

/**
 * JWT  constants
 */
export const JwtConstants = {
    ALGORITHM: "alg",
    RSA_256: "RS256",
    X5T: "x5t", 
    X5C: "x5c",
    AUDIENCE: "aud",
    EXPIRATION_TIME: "exp",
    ISSUER: "iss",
    SUBJECT: "sub",
    NOT_BEFORE: "nbf",
    JWT_ID: "jti",
};
