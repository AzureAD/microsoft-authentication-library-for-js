/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * InitializeApplicationRequest: Request object passed by user to initialize application
 *
 * - correlationId              - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - appId                      - Unique identifier for the application for multi-instance detection comprised of client id and, if available, channel id.
 */
export type InitializeApplicationRequest = {
    correlationId?: string;
    appId?: string;
};
