// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

/**
 * Base Utility error class thrown by MSAL Electron
 */

export class UtilityErrorBase extends Error {
    errorCode: string;
    errorMessage: string;

    constructor(errorCode: string, errorMessage?: string) {
        super(errorMessage);
        Object.setPrototypeOf(this, UtilityErrorBase.prototype);

        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.name = 'UtilityError';
    }
}
