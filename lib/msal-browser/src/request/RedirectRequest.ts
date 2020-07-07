/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationUrlRequest } from "@azure/msal-common";

/**
 * @type RedirectRequest: Request object passed by user to retrieve a Code from the
 * server (first leg of authorization code grant flow)
 */
export type RedirectRequest = AuthorizationUrlRequest & {
    /**
     * The page that should be returned to after loginRedirect or acquireTokenRedirect. This should only be used
     * if this is different from the redirectUri and will default to the page that initiates the request.
     * When the navigateToLoginRequestUrl config option is set to false this parameter will be ignored.
     */
    redirectStartPage?: string;
};
