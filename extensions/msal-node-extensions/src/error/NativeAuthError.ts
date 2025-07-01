/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/node";

export class NativeAuthError extends AuthError {
    public statusCode: number;
    public tag: number;

    constructor(
        errorStatus: string,
        errorContext: string,
        errorCode: number,
        errorTag: number
    ) {
        super(errorStatus, errorContext);
        this.name = "NativeAuthError";
        this.statusCode = errorCode;
        this.tag = errorTag;
        Object.setPrototypeOf(this, NativeAuthError.prototype);
    }
}
