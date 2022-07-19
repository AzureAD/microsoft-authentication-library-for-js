/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
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

export type ExpressResponse = object;

export type ExpressNextFunction = (err?: Error) => void;
