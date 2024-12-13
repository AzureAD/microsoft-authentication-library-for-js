/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class NativeAuthError extends Error {
    constructor(
        public error: string,
        public errorDescription?: string,
        public correlationId?: string
    ) {
        super(`${error}: ${errorDescription ?? ""}`);
        Object.setPrototypeOf(this, NativeAuthError.prototype);
    }
}
