/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JWTHeaderParameters, JWTPayload } from "jose";

/**
 * Response object for token validation responses
 */
export type TokenValidationResponse = {
    /**
     * Header of JWT token
     */
    protectedHeader?: JWTHeaderParameters;
    /**
     * Payload of JWT token
     */
    payload?: JWTPayload;
    /**
     * Original token sent in for validation
     */
    token?: string;
    /**
     * Type of token, defaults to JWT
     */
    tokenType?: string;
};
