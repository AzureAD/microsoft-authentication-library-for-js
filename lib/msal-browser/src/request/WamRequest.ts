/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict, BaseAuthRequest } from "@azure/msal-common";

export type WamRequest = Omit<BaseAuthRequest, "authenticationScheme|shrClaims|resourceRequestMethod|resourceRequestUri"> & {
    clientId: string;
    redirectUri: string;
    correlationId: string;
    nonce: string;
    accountId?: string; // WAM specific account id used for identification of WAM account. This can be any broker-id eventually
    state?: string;
    prompt?: string;
    domainHint?: string;
    loginHint?: string;
    sid?: string;
    extendedExpiryToken?: boolean;
    instanceAware?: boolean;
    extraParameters?: StringDict;
};
