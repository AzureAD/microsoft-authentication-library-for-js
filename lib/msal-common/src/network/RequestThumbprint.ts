/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ShrOptions } from "../crypto/SignedHttpRequest.js";
import { AuthenticationScheme } from "../utils/Constants.js";

/**
 * Type representing a unique request thumbprint.
 */
export type RequestThumbprint = {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier?: string;
    claims?: string;
    authenticationScheme?: AuthenticationScheme;
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    shrClaims?: string;
    sshKid?: string;
    shrOptions?: ShrOptions;
};
