/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError.js";
import * as JoseHeaderErrorCodes from "./JoseHeaderErrorCodes.js";
export { JoseHeaderErrorCodes };

/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export class JoseHeaderError extends AuthError {
    constructor(
        errorCode: string,
        correlationId: string,
        errorMessage?: string
    ) {
        super(errorCode, correlationId, errorMessage);
        this.name = "JoseHeaderError";

        Object.setPrototypeOf(this, JoseHeaderError.prototype);
    }
}

/** Returns JoseHeaderError object */
export function createJoseHeaderError(
    code: string,
    correlationId: string
): JoseHeaderError {
    return new JoseHeaderError(code, correlationId);
}
