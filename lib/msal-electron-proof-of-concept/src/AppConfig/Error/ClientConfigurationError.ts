import { AuthErrorBase } from './AuthError';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

/**
 * The ClientConfigurationMessage object holds all
 * the code-description pairs for their respective
 * ClientConfigurationError type.
 */

export const ClientConfigurationErrorMessage = {
    scopesRequired: {
        code: 'empty_input_scopes_error',
        description: 'Scopes are required to obtain an access token.',
    },
};

/**
 * The ClientConfigurationError class handles errors
 * that result from incorrect configuration
 * for ClientApplication objects in the authorization
 * flow.
 */
export class ClientConfigurationError extends AuthErrorBase {
    static createScopesRequiredError(scopes: any): ClientConfigurationError {
        const errorMessage = ClientConfigurationErrorMessage.scopesRequired;
        return new ClientConfigurationError(errorMessage.code,
            `${errorMessage.description} Given value: ${scopes}`);
    }

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = 'ClientConfigurationError';
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }
}
