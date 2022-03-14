/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type ExpressRequest = {
    session?: {
        protectedResources?: object
    },
    headers?: {
        authorization?: string
    },
    body?: {
        access_token?: string
    }
};

export type ExpressResponse = object;

export type ExpressNextFunction = (err?: Error) => void;
