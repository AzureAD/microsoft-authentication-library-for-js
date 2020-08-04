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
    code?: string;
    client_info?: string;
    state?: string;
    error?: string,
    error_description?: string;
    suberror?: string;
};
