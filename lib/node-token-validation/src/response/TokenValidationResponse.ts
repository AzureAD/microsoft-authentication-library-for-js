/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JWTHeaderParameters, JWTPayload } from "jose";

export type TokenValidationResponse = {
    protectedHeader?: JWTHeaderParameters;
    payload?: JWTPayload;
    token?: string;
    tokenType?: string;
};
