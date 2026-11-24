/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An authentication method offered by the server during a native auth V2 flow.
 */
export interface AuthenticationMethodV2 {
    id: string;
    type: string;
    hint?: string;
    challengeHref: string;
}
