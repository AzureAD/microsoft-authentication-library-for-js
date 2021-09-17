/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "@azure/msal-common";

export type WamRequest = {
    clientId: string;
    authority: string;
    redirectUri: string;
    scopes: string;
    correlationId: string;
    prompt: string;
    nonce: string;
    accountId?: string; // WAM specific account id used for identification of WAM account. This can be any broker-id eventually
    claims?: string;
    state?: string;
    domainHint?: string;
    loginHint?: string;
    sid?: string;
    extendedExpiryToken?: boolean;
    instanceAware?: boolean;
    extraParameters?: StringDict;
};
