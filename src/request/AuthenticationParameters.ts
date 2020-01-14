/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Account } from "../auth/Account";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientRequestParameters } from "./ClientRequestParameters";

/**
 * AuthenticationParameters passed by user to retrieve a token from the server.
 * - scopes: requested token scopes
 * - resource: requested resource uri
 * - extraScopesToConsent: additional scopes to consent 
 * - prompt: the value of the OAuth prompt parameter
 * - extraQueryParameters: string to string map of custom query parameters
 * - claimsRequest: stringified claims object to request additional claims in a token
 * - authority: authority to request tokens from
 * - userRequestState: state parameter to ensure request/response integrity
 * - correlationId: custom correlationId given by user
 * - account: Account object to perform SSO
 * - sid: session id for SSO
 * - loginHint: login hint for SSO
 */
export type AuthenticationParameters = ClientRequestParameters & {
    extraScopesToConsent?: Array<string>;
    prompt?: string;
    claimsRequest?: string;
    userRequestState?: string;
    account?: Account;
    sid?: string;
    loginHint?: string;
};

/**
 * Function which validates claims request passed in by the user.
 * @param request 
 */
export function validateClaimsRequest(request: AuthenticationParameters): void {
    if (!request.claimsRequest) {
        return;
    }
    try {
        JSON.parse(request.claimsRequest);
    } catch (e) {
        throw ClientConfigurationError.createClaimsRequestParsingError(e);
    }

    // TODO: More validation will be added when the server team tells us how they have actually implemented claims
}
