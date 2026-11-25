/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An authentication method that can be registered for the current account.
 */
export interface AuthenticationMethodRegistrationV2 {
    type: string;
    channels?: readonly string[];
    enrollHref: string;
}
