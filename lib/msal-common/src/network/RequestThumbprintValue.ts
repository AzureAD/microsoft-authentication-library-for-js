/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../utils/Constants";

export class RequestThumbprintValue {
    // Unix-time value representing the expiration of the throttle
    throttleTime: number;
    // Information provided by the server
    error?: string;
    errorCodes?: Array<string>;
    errorMessage?: string;
    subError?: string;

    constructor(throttleTime: number, error?: string, errorCodes?: Array<string>, errorMessage?: string, subError?: string) {
        this.throttleTime = throttleTime;
        this.error = error;
        this.errorCodes = errorCodes;
        this.errorMessage = errorMessage;
        this.subError = subError;
    }

    public generateStorageValue(): string {
        return `${Constants.THROTTLE_PREFIX}.${JSON.stringify(this)}`
    }
}