/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Bound Token response: Encrypted response object from server authorization code request.
 * - response_jwe: Token response object encrypted using symmetric key derived from the session key.
 * - session_key_jwe: Object containing session key to be used for key derivation, encrypted using the Session Transport Key's pulbic key.
 * 
 * In case of error:
 * - error: An error code string that can be used to classify types of errors that occur, and can be used to react to errors.
 * - error_description: A specific error message that can help a developer identify the root cause of an authentication error.
 * - error_codes: A list of STS-specific error codes that can help in diagnostics.
 * - timestamp: The time at which the error occurred.
 * - trace_id: A unique identifier for the request that can help in diagnostics.
 * - correlation_id: A unique identifier for the request that can help in diagnostics across components.
 */
export type BoundServerAuthorizationTokenResponse = {
    response_jwe: string;
    session_key_jwe: string;
};
