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

export enum HttpStatus {
    SUCCESS_RANGE_START = 200,
    SUCCESS_RANGE_END = 299,
    REDIRECT = 302,
    CLIENT_ERROR_RANGE_START = 400,
    CLIENT_ERROR_RANGE_END = 499,
    SERVER_ERROR_RANGE_START = 500,
    SERVER_ERROR_RANGE_END = 599
}

export enum ProxyStatus {
    SUCCESS_RANGE_START = 200,
    SUCCESS_RANGE_END = 299,
    SERVER_ERROR = 500
}

/**
 * Constants
 */
export const Constants = {
    AUTHORIZATION_PENDING: "authorization_pending",
};
