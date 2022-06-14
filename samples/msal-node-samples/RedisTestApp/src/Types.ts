/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    TokenClaims
} from "@azure/msal-common";

import {
    AccountInfo,
    AuthorizationUrlRequest,
    AuthorizationCodeRequest,
    IPartitionManager,
} from "@azure/msal-node";

declare global {
    namespace Express {
        interface Request {
            partitionManager?: IPartitionManager
        }
    }
}

// extending express Request object
declare module "express-session" {
    interface SessionData {
        authCodeRequest: AuthorizationUrlRequest;
        tokenRequest: AuthorizationCodeRequest;
        account: AccountInfo;
        nonce: string;
        isAuthenticated?: boolean;
        resources?: {
            [resource: string]: Resource;
        };
    }
}

export type AuthCodeParams = {
    authority: string;
    scopes: string[];
    state: string;
    redirect: string;
    prompt?: string;
    account?: AccountInfo;
};

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

export type IdTokenClaims = TokenClaims & {
    aud?: string,
}