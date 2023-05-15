/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Deserialized response object from server authorization code request.
 * - code: authorization code from server
 * - client_info: client info object
 * - state: OAuth2 request state
 * - error: error sent back in hash
 * - error: description
 */
export type ServerAuthorizationCodeResponse = {
    // Success case
    code?: string;
    client_info?: string;
    state?: string;
    cloud_instance_name?: string;
    cloud_instance_host_name?: string;
    cloud_graph_host_name?: string;
    msgraph_host?: string;
    // Error case
    error?: string;
    error_description?: string;
    suberror?: string;
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
    claims?: string;
    // Native Account ID
    accountId?: string;
};
