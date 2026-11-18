/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An authentication method that can be registered for the current account.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export interface AuthenticationMethodRegistrationV2 {
    type: string;
    channels?: readonly string[];
    enrollHref: string;
}
