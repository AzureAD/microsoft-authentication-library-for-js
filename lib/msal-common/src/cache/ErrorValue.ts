/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export class ErrorValue {
    error: string;
    errorDescription: string;
    errorCodes: string;         // delimited by " "
    throttleTime: string;       // in ms

    constructor(error: string, errorDescripton: string, errorCodes: string, throttleTime: string) {
        this.error = error;
        this.errorDescription = errorDescripton;
        this.errorCodes = errorCodes;
        this.throttleTime = throttleTime;
    }
}
