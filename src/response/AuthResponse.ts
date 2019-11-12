/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type AuthResponse = {
    state: string;
};

export function buildResponseStateOnly(responseState: string) : AuthResponse {
    return {
        state: responseState
    };
}
