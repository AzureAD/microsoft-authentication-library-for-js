/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NativeAuthError } from "./NativeAuthError.js";

export class InvalidArgumentError extends NativeAuthError {
    constructor(argName: string, correlationId?: string) {
        const errorDescription = `The argument '${argName}' is invalid.`;

        super("invalid_argument", errorDescription, correlationId);
        Object.setPrototypeOf(this, InvalidArgumentError.prototype);
    }
}
