/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * AuthResponse base type returned by MSAL library on success
 * - userRequestState: User given state
 * - scopes: consented scopes
 */
export type AuthResponse = {
    userRequestState: string;
};

/**
 * Builds a response that only sets state
 * @param responseState 
 */
export function buildResponseStateOnly(responseState: string) : AuthResponse {
    return {
        userRequestState: responseState
    };
}
