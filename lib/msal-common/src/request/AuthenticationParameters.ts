/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MsalAccount } from "../auth/MsalAccount";
import { StringDict } from "../utils/MsalTypes";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

/**
 * AuthenticationParameters passed by user to retrieve a token from the server.
 * - scopes: requested token scopes
 * - extraScopesToConsent: additional scopes to consent 
 * - prompt: the value of the OAuth prompt parameter
 * - extraQueryParameters: string to string map of custom query parameters
 * - claimsRequest: stringified claims object to request additional claims in a token
 * - authority: authority to request tokens from
 * - state: state parameter to ensure request/response integrity
 * - correlationId: custom correlationId given by user
 * - account: Account object to perform SSO
 * - sid: session id for SSO
 * - loginHint: login hint for SSO
 * - forceRefresh: Forces silent requests to make network calls if true
 */
export type AuthenticationParameters = {
    scopes?: Array<string>;
    extraScopesToConsent?: Array<string>;
    prompt?: string;
    extraQueryParameters?: StringDict;
    claimsRequest?: string;
    authority?: string;
    state?: string;
    correlationId?: string;
    account?: MsalAccount;
    sid?: string;
    loginHint?: string;
    forceRefresh?: boolean;
};

/**
 * Function which validates claims request passed in by the user.
 * @param request 
 */
export function validateClaimsRequest(request: AuthenticationParameters) {
    if (!request.claimsRequest) {
        return;
    }
    let claims;
    try {
        claims = JSON.parse(request.claimsRequest);
    } catch (e) {
        throw ClientConfigurationError.createClaimsRequestParsingError(e);
    }

    // TODO: More validation will be added when the server team tells us how they have actually implemented claims
}
