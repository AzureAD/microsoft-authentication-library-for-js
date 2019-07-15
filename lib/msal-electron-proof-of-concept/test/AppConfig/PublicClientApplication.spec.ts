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
        let msalApp: PublicClientApplication;
        let authError: AuthErrorBase;

        beforeEach(() => {
            msalApp = new PublicClientApplication(msalAuthConfig);
        });

        // No input scopes configures
        it('should throw ClientConfigurationError empty_input_scopes_error when no scopes are configured', () => {
            const emptyInputScopesErrorMessage = ClientConfigurationErrorMessage.scopesRequired;
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

        // Non-Array input scopes object
        it('should throw ClientConfigurationError nonarray_input_scopes_error when scopes object is not an array', () => {
            const nonArrayInputScopesErrorMessage = ClientConfigurationErrorMessage.nonArrayScopes;
            const invalidTokenRequest = {
                scopes: 'user.read',
            };

            try {
                // @ts-ignore
                msalApp.acquireToken(invalidTokenRequest);
            } catch (error) {
                authError = error;
            }

            expect(authError.errorCode).to.equal(nonArrayInputScopesErrorMessage.code);
            expect(authError.errorMessage).to.contain(nonArrayInputScopesErrorMessage.description);
            expect(authError.message).to.contain(nonArrayInputScopesErrorMessage.description);
            expect(authError.name).to.equal('ClientConfigurationError');
        });
    });
});
