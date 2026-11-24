/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "@azure/msal-common/browser";

/**
 * RedirectRequest: Request object passed by user to retrieve a Code from the
 * server (first leg of authorization code grant flow) with a full page redirect.
 */
export type RedirectRequest = Partial<
    Omit<
        CommonAuthorizationUrlRequest,
        | "responseMode"
        | "scopes"
        | "earJwk"
        | "asymmetricEar"
        | "codeChallenge"
        | "codeChallengeMethod"
        | "platformBroker"
    >
> & {
    /**
     * Array of scopes the application is requesting access to.
     */
    scopes: Array<string>;
    /**
     * The page that should be returned to after loginRedirect or acquireTokenRedirect. This should only be used if this is different from the redirectUri and will default to the page that initiates the request. When the navigateToLoginRequestUrl config option is set to false this parameter will be ignored.
     * Must be an application-controlled, trusted destination. Validate query parameters and other input that your application does not fully control before using them as the destination.
     * For navigation within your app, validate that the resolved URL uses HTTPS and matches your application's origin.
     */
    redirectStartPage?: string;
};
