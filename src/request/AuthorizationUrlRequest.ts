/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";

/**
 * @type AuthorizationUrlRequest: Request object passed by user to retrieve a Code from the server (first leg of authorization code grant flow)
 */
export type AuthorizationUrlRequest = {
    /**
     * The redirect URI where authentication responses can be received by your application. It
     * must exactly match one of the redirect URIs registered in the Azure portal.
     */
    redirectUri: string;

    /**
     * Scopes the application is requesting access to.
     */
    scopes: Array<string>;

    /**
     * Scopes for a different resource when the user needs consent upfront
     */
    extraScopesToConsent?: Array<string>;

    /**
     * Url of the authority which the application acquires tokens from
     */
    authority?: string;

    /**
     * Specifies the method that should be used to send the authentication result to your app.
     * Can be query, form_post, or fragment. If no value is passed in, it defaults to query.
     */
    responseMode?: string;

    /**
     * Used to secure authorization code grant via Proof of Key for Code Exchange (PKCE).
     * For more information, see the PKCE RCF:https://tools.ietf.org/html/rfc7636
     */
    codeChallenge?: string;

    /**
     * The method used to encode the code verifier for the code challenge parameter. Can be one
     * of plain or S256. If excluded, code challenge is assumed to be plaintext. For more
     * information, see the PKCE RCF: https://tools.ietf.org/html/rfc7636
     */
    codeChallengeMethod?: string;

    /**
     * A value included in the request that is also returned in the token response. A randomly
     * generated unique value is typically used for preventing cross site request forgery attacks.
     * The state is also used to encode information about the user's state in the app before the
     * authentication request occurred.
     */
    state?: string;

    /**
     * Indicates the type of user interaction that is required.
     */
    prompt?: string;

    /**
     * Can be used to pre-fill the username/email address field of the sign-in page for the user,
     * if you know the username/email address ahead of time. Often apps use this parameter during
     * re-authentication, having already extracted the username from a previous sign-in using the
     * preferred_username claim.
     */
    loginHint?: string;

    /**
     * Provides a hint about the tenant or domain that the user should use to sign in. The value
     * of the domain hint is a registered domain for the tenant.
     * TODO: Name this as "extraQueryParameters"
     */
    domainHint?: string;

    /**
     * string to string map of custom query parameters
     */
    extraQueryParameters?: StringDict;

    /**
     * In cases where Azure AD tenant admin has enabled conditional access policies, and the
     * policy has not been met, exceptions will contain claims that need to be consented to.
     */
    claims?: string;

    /**
     *  A value included in the request that is also returned in the token response. A randomly
     *  generated unique value is typically used for preventing cross site request forgery attacks.
     */
    nonce?: string;

    /**
     * Unique GUID set per request to trace a request end-to-end for telemetry purposes
     */
    correlationId?: string;
};
