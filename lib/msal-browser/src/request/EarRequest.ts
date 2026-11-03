/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CommonAuthorizationUrlRequest } from "@azure/msal-common/browser";

/**
 * Browser-owned EAR selection retained across navigation. Contains no private key material.
 * @internal
 */
export type EarRequest = CommonAuthorizationUrlRequest & {
    asymmetricEar?: {
        version: 1;
        keyId: string;
        apv: string;
    };
};
