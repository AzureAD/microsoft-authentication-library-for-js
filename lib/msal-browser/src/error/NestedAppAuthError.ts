/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import { unsupportedMethod } from "./NativeAuthErrorCodes.js";

export class NestedAppAuthError extends AuthError {
    constructor(
        errorCode: string,
        correlationId: string,
        errorMessage?: string
    ) {
        super(errorCode, correlationId, errorMessage);

        Object.setPrototypeOf(this, NestedAppAuthError.prototype);
        this.name = "NestedAppAuthError";
    }

    public static createUnsupportedError(
        correlationId?: string
    ): NestedAppAuthError {
        /*
         * Some controller stubs (perf callbacks, getPerformanceClient, getRedirectResponse)
         * have no request param and thus no correlationId to forward
         */
        return new NestedAppAuthError(unsupportedMethod, correlationId || "");
    }
}
