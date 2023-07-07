/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Options for the OIDC protocol mode.
 */
export type OIDCOptions = {
    serverResponseType?: ServerResponseType;
    defaultScopes?: Array<string>;
};

export const ServerResponseType = {
    QUERY: "query",
    HASH: "hash",
} as const;
export type ServerResponseType = typeof ServerResponseType[keyof typeof ServerResponseType];
