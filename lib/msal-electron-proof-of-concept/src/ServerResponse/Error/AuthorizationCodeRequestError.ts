// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { AuthError } from '../../AppConfig/Error/AuthError';

/**
 * The AuthorizationCodeRequestErrorMessage object holds all
 * the code-description pairs for their respective
 * AuthorizationCodeRequestError type.
 */

export const AuthorizationCodeRequestErrorMessage = {
    accessDenied: {
        code: 'auth_code_access_denied_error',
        description: 'Access was denied by the authorization server.',
    },
    nonMatchingState: {
        code: 'auth_code_non_matching_state_error',
        description: 'The state ID on auth code response does not match the state ID sent'
    }
};

/**
 * The AuthorizationCodeRequestError class handles errors
 * that happen during the Authorization Code Request.
 */
export class AuthorizationCodeRequestError extends AuthError {
    static createAuthCodeAccessDeniedError(error_description: string): AuthorizationCodeRequestError {
        const errorMessage = AuthorizationCodeRequestErrorMessage.accessDenied;
        return new AuthorizationCodeRequestError(errorMessage.code, error_description);
    }

    static createNonMatchingStateError() {
        const errorMessage = AuthorizationCodeRequestErrorMessage.nonMatchingState;
        return new AuthorizationCodeRequestError(errorMessage.code, errorMessage.description);
    }

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = 'AuthorizationCodeRequestError';
        Object.setPrototypeOf(this, AuthorizationCodeRequestError.prototype);
    }
}
