/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Express.js request object used in in {@link validateTokenMiddleware}.
 */
export type ExpressRequest = {
    headers: {
        authorization?: string
    },
    body?: {
        access_token?: string
    },
    session?: {
        protectedResources?: object
    }
};

/**
 * Express.js response object used in {@link validateTokenMiddleware}.
 */
export type ExpressResponse = object;

/**
 * Express.js next function used in {@link validateTokenMiddleware}.
 */
export type ExpressNextFunction = (err?: Error) => void;
