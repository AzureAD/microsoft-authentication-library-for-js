/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NativeAuthError } from "./NativeAuthError.js";

export class GetAccessTokenError extends NativeAuthError {
    constructor(error: string, message: string, correlationId?: string) {
        super(error, message, correlationId);
        Object.setPrototypeOf(this, GetAccessTokenError.prototype);
    }
}

export const InvalidScopes = "invalid_scopes";
