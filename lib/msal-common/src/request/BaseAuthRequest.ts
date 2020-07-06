/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type BaseAuthRequest = {
    /**
     * Scopes the application is requesting access to.
     */
    scopes: Array<string>;

    /**
     * Url of the authority which the application acquires tokens from. Defaults to
     * https://login.microsoftonline.com/common. If using the same authority for all request, authority should set
     * on client application object and not request, to avoid resolving authority endpoints multiple times.
     */
    authority?: string;

    /**
     * Unique GUID set per request to trace a request end-to-end for telemetry purposes
     */
    correlationId?: string;
};
