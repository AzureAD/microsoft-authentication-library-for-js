/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthError } from "./CustomAuthError.js";

export class GetCurrentAccountError extends CustomAuthError {
    constructor(error: string, message: string, correlationId?: string) {
        super(error, message, correlationId);
        Object.setPrototypeOf(this, GetCurrentAccountError.prototype);
    }
}

export const NoSignedInAccountFound = "no_signed_in_account_found";
