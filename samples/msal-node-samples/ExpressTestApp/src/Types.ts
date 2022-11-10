/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    AuthorizationUrlRequest,
    AuthorizationCodeRequest,
} from "@azure/msal-node";

// extending express Request object
declare module "express-session" {
    interface SessionData {
        authCodeRequest: AuthorizationUrlRequest;
        tokenRequest: AuthorizationCodeRequest;
        account: AccountInfo;
        csrfToken: string;
        tokenCache: string
        isAuthenticated?: boolean;
        resources?: {
            [resource: string]: Resource;
        };
    }
}

export type Resource = {
    callingPageRoute: string,
    endpoint: string,
    scopes: string[]
}

export type Credentials = {
    clientId: string,
    tenantId: string,
    clientSecret: string
}

export type Settings = {
    homePageRoute: string,
    redirectUri: string,
    postLogoutRedirectUri: string
}

export type AppSettings = {
    credentials: Credentials,
    settings: Settings,
    resources: {
        [resource: string]: Resource
    },
    policies: any,
    protected: any,
}
