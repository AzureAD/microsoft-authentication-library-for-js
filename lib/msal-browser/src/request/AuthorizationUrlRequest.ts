/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "@azure/msal-common";

/**
 * This type is deprecated and will be removed on the next major version update
 */
export type AuthorizationUrlRequest = Omit<
    CommonAuthorizationUrlRequest,
    "state" | "nonce" | "requestedClaimsHash" | "nativeBroker"
> & {
    state: string;
    nonce: string;
};
