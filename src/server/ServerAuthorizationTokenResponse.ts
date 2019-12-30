/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerError } from "../error/ServerError";

/**
 * Deserialized response object from server authorization code request.
 * - 
 */
export type ServerAuthorizationTokenResponse = {
    // Success
    token_type?: string;
    scope?: string;
    expires_in?: number;
    ext_expires_in?: number;
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    // Error
    error?: string;
    error_description?: string;
    error_codes?: Array<string>;
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
};

export function validateServerAuthorizationTokenResponse(serverResponse: ServerAuthorizationTokenResponse): void {
    // Check for error
    if (serverResponse.error || serverResponse.error_description) {
        const errString = `${serverResponse.error_codes} - [${serverResponse.timestamp}]: ${serverResponse.error_description} - Correlation ID: ${serverResponse.correlation_id} - Trace ID: ${serverResponse.trace_id}`;
        throw new ServerError(serverResponse.error, errString);
    }
}
