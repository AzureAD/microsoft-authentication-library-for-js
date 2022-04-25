/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JWTHeaderParameters, JWTPayload } from "jose";

/**
 * Response object for token validation responses
 * - protectedHeader: Header of JWT token
 * - payload: Payload of JWT token
 * - token: Original token sent in for validation
 * - tokenType: Type of token, defaults to JWT
 */
export type TokenValidationResponse = {
    protectedHeader?: JWTHeaderParameters;
    payload?: JWTPayload;
    token?: string;
    tokenType?: string;
};
