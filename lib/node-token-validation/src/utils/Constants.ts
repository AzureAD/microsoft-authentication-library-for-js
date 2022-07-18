/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const Constants = {
    DEFAULT_AUTHORITY: "https://login.microsoftonline.com/common/",
    EMPTY_STRING: ""
};

/**
 * HTTP method constants
 */
export enum HttpMethod {
    GET = "get",
    POST = "post",
}

/**
 * JWT constants
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

/**
 * Token Types
 */
export const TokenType = {
    JWT: "JWT"
};

/**
 * HTTP status code constants
 * 
 * HTTP status codes are used when checking network responses for errors.
 * Status codes indicating request timeout or service unavailable will result in retrying the network request.
 */
export enum HttpStatusCode {
    RequestTimeout = 408,
    ServiceUnavailable = 503
}
