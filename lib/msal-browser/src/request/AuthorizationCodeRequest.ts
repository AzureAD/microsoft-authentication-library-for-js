/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationCodeRequest,
    StoreInCache,
} from "@azure/msal-common";

export type AuthorizationCodeRequest = Partial<
    Omit<
        CommonAuthorizationCodeRequest,
        | "code"
        | "enableSpaAuthorizationCode"
        | "requestedClaimsHash"
        | "storeInCache"
    >
> & {
    code?: string;
    nativeAccountId?: string;
    cloudGraphHostName?: string;
    msGraphHost?: string;
    cloudInstanceHostName?: string;
    storeInCache?: StoreInCache;
};
