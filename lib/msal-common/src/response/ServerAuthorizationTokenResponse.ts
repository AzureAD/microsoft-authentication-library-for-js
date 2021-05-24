/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Unbound (Bearer) Token Response: Deserialized response object from server authorization code request.
 * - token_type: Indicates the token type value. The only type that Azure AD supports is Bearer.
 * - scope: The scopes that the access_token is valid for.
 * - expires_in: How long the access token is valid (in seconds).
 * - refresh_in: Duration afer which a token should be renewed, regardless of expiration.
 * - ext_expires_in: How long the access token is valid (in seconds) if the server isn't responding.
 * - access_token: The requested access token. The app can use this token to authenticate to the secured resource, such as a web API.
 * - refresh_token: An OAuth 2.0 refresh token. The app can use this token acquire additional access tokens after the current access token expires.
 * - id_token: A JSON Web Token (JWT). The app can decode the segments of this token to request information about the user who signed in.
 *
 * Bound Refresh Token response: Encrypted response object from server authorization code request.
 * - response_jwe: Token response object encrypted using symmetric key derived from the session key.
 * - session_key_jwe: Object containing session key to be used for key derivation, encrypted using the Session Transport Key's pulbic key.
 * - kid: Session Transport Key public key hash used to match the Bound Refresh Token to its corresponding Session Transport Key and Session Key.
 * 
 * In case of error:
 * - error: An error code string that can be used to classify types of errors that occur, and can be used to react to errors.
 * - error_description: A specific error message that can help a developer identify the root cause of an authentication error.
 * - error_codes: A list of STS-specific error codes that can help in diagnostics.
 * - timestamp: The time at which the error occurred.
 * - trace_id: A unique identifier for the request that can help in diagnostics.
 * - correlation_id: A unique identifier for the request that can help in diagnostics across components.
 */
export type ServerAuthorizationTokenResponse = {
    // Raw token response in case of success
    token_type?: string;
    scope?: string;
    expires_in?: number;
    refresh_in?: number;
    ext_expires_in?: number;
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    client_info?: string;
    foci?: string
    // Bound Refresh Token Response in case of success
    response_jwe?: string;
    session_key_jwe?: string;
    kid?: string;
    // Error
    error?: string;
    error_description?: string;
    error_codes?: Array<string>;
    suberror?: string;
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
};
