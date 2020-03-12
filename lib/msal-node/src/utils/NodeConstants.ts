/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * http methods
 */
export enum method {
    GET = 'get',
    POST = 'post',
}

/**
 * Constants used in PKCE
 */
export const PKCEConstants = {
    RANDOM_OCTET_SIZE: 32,
    CV_CHARSET:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~',
    SHA256: 'sha256',
};
