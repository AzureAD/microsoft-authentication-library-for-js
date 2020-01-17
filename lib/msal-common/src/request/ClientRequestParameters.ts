/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringDict } from "../utils/MsalTypes";

/**
 * ClientRequestParameters passed by user to retrieve a token from the server.
 * - scopes: requested token scopes
 * - resource: requested resource uri
 * - extraQueryParameters: string to string map of custom query parameters
 * - authority: authority to request tokens from
 * - correlationId: custom correlationId given by user
 */
export type ClientRequestParameters = {
    scopes?: Array<string>;
    resource?: string;
    extraQueryParameters?: StringDict;
    authority?: string;
    correlationId?: string;
};
