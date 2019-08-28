// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { AuthError } from '../../AppConfig/Error/AuthError';

/**
 * The TokenRequestError class handles errors
 * that happen during the Authorization Code Request.
 */
export class TokenRequestError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = 'TokenRequestError';
        Object.setPrototypeOf(this, TokenRequestError.prototype);
    }
}
