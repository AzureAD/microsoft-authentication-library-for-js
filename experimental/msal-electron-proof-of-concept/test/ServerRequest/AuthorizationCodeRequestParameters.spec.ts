// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';
import * as url from 'url';

import { AadAuthority } from '../../src/AppConfig/Authority/AadAuthority';
import { AuthorizationCodeRequestParameters } from '../../src/ServerRequest/AuthorizationCodeRequestParameters';
import { TEST_CONFIGURATION, TEST_CRYPTO_PARAMS, TEST_ENDPOINT_URIS, TEST_URIS } from '../testConstants';

describe('AuthorizationCodeRequestParameters.ts class', () => {
    describe('#buildRequestUrl', () => {
        it('should build a correct authorization code request navigate URL from the given parameters', () => {
            const authorityInstance = new AadAuthority(TEST_CONFIGURATION.validAuthority);
            // Build Server Authorization Request
            const authCodeRequestParameters = new AuthorizationCodeRequestParameters(
                authorityInstance,
                TEST_CONFIGURATION.MSAL_CLIENT_ID,
                TEST_URIS.REDIRECT_URI,
                TEST_CONFIGURATION.scopes,
                TEST_CRYPTO_PARAMS.state,
                TEST_CRYPTO_PARAMS.PKCECodeChallenge
            );
            const navigateUrl = authCodeRequestParameters.buildRequestUrl();
            const parsedUrl = url.parse(navigateUrl, true);
            const queryParams = parsedUrl.query;
            const rebuiltAuthorityUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;

            expect(rebuiltAuthorityUrl).to.be.equal(TEST_ENDPOINT_URIS.AAD_AUTHORIZATION_ENDPOINT);
            expect(queryParams.client_id).to.be.equal(TEST_CONFIGURATION.MSAL_CLIENT_ID);
            expect(queryParams.redirect_uri).to.be.equal(TEST_URIS.REDIRECT_URI);
            expect(queryParams.scope).to.be.equal(TEST_CONFIGURATION.spaceSeparatedScopes);
            expect(queryParams.state).to.be.equal(TEST_CRYPTO_PARAMS.state);
            expect(queryParams.code_challenge).to.be.equal(TEST_CRYPTO_PARAMS.PKCECodeChallenge);
        });
    });
});
