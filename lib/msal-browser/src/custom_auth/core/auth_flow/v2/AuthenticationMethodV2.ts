/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An authentication method offered by the server during a native auth V2 flow.
 */
export interface AuthenticationMethodV2 {
    /**
     * Server-assigned identifier for the method, used to build the challenge request.
     */
    id: string;

    /**
     * The kind of method, for example "email" or "password".
     */
    type: string;

    /**
     * A masked hint for the method's destination, for example "y****@g****.com".
     */
    hint?: string;
}
