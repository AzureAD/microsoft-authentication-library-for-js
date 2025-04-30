/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * InitializeApplicationRequest: Request object passed by user to initialize application
 *
 * - correlationId              - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - isBroker                   - Boolean flag indicating whether the application is acting as a broker.
 */
export type InitializeApplicationRequest = {
    correlationId?: string;
    isBroker?: boolean;
};
