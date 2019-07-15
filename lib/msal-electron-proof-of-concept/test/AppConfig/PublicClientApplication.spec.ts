// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { PublicClientApplication } from '../../src';
import { AuthErrorBase } from '../../src/AppConfig/Error/AuthError';
import { ClientConfigurationError, ClientConfigurationErrorMessage } from '../../src/AppConfig/Error/ClientConfigurationError';
import { TEST_VALID_AUTH_CONFIGURATION } from '../testConstants';

describe('PublicClientApplication.ts class', () => {
    // Test MSAL config params
    const msalAuthConfig = TEST_VALID_AUTH_CONFIGURATION;

    describe('#acquireToken', () => {
        // Client Configuration tests
        it('should throw ClientConfigurationError empty_input_scopes_error when no scopes are configured', () => {
            const msalApp = new PublicClientApplication(msalAuthConfig);
            const emptyInputScopesErrorMessage = ClientConfigurationErrorMessage.scopesRequired;
            let authError: AuthErrorBase;
            try {
                msalApp.acquireToken({});
            } catch (error) {
                authError = error;
            }

            expect(authError.errorCode).to.equal(emptyInputScopesErrorMessage.code);
            expect(authError.errorMessage).to.contain(emptyInputScopesErrorMessage.description);
            expect(authError.message).to.contain(emptyInputScopesErrorMessage.description);
            expect(authError.name).to.equal('ClientConfigurationError');
        });
    });
});
