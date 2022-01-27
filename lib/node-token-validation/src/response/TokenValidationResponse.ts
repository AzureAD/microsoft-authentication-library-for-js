/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JWSHeaderParameters, JWTPayload } from "jose";

export type TokenValidationResponse = {
    protectedHeader?: JWSHeaderParameters;
    payload?: JWTPayload;
    token?: string;
    tokenType?: string;
};
