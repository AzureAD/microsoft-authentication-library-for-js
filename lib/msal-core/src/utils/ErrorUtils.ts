/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthCache } from "../cache/AuthCache";
import { AuthError } from "../error/AuthError";
/**
 * @hidden
 */
export class ErrorUtils {

    static errorHandler(storage: AuthCache, errorFunc: AuthError): AuthError {
        storage.resetTempCacheItems();
        return errorFunc;
    }
}
