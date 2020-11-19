// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { AuthError } from './AuthError';

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
    nonArrayScopes: {
        code: 'nonarray_input_scopes_error',
        description: 'Scopes cannot be passed as non-array.',
    },
    emptyScopesArray: {
        code: 'empty_input_scopes_array_error',
        description: 'Scopes cannot be passed as empty array.',
    },
};

/**
 * The ClientConfigurationError class handles errors
 * that result from incorrect configuration
 * for ClientApplication objects in the authorization
 * flow.
 */
export class ClientConfigurationError extends AuthError {
    static createEmptyScopesArrayError(scopes: any): ClientConfigurationError {
        const errorMessage = ClientConfigurationErrorMessage.emptyScopesArray;
        return this.buildClientConfigurationScopesError(errorMessage, scopes);
    }

    static createScopesRequiredError(scopes: any): ClientConfigurationError {
        const errorMessage = ClientConfigurationErrorMessage.scopesRequired;
        return this.buildClientConfigurationScopesError(errorMessage, scopes);

    }

    static createScopesNonArrayError(scopes: any): ClientConfigurationError {
        const errorMessage = ClientConfigurationErrorMessage.nonArrayScopes;
        return this.buildClientConfigurationScopesError(errorMessage, scopes);
    }

    private static buildClientConfigurationScopesError(errorMessage, scopes: string[]): ClientConfigurationError {
        return new ClientConfigurationError(errorMessage.code,
            `${errorMessage.description} Given value: ${scopes}`);
    }

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = 'ClientConfigurationError';
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }
}
