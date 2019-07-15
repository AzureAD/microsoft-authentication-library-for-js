// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

/**
 * General error class thrown by MSAL Electron
 */

export class AuthErrorBase extends Error {
    errorCode: string;
    errorMessage: string;

    constructor(errorCode: string, errorMessage?: string) {
        super(errorMessage);
        Object.setPrototypeOf(this, AuthErrorBase.prototype);

        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.name = 'AuthError';
    }
}
