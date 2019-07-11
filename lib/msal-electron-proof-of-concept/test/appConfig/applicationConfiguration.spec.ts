// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { ApplicationConfiguration, buildApplicationConfiguration } from '../../src/index';

describe('ApplicationConfiguration.ts', () => {
    // Test URIs
    const TEST_REDIRECT_URI = 'test://auth';

    // Test MSAL config params
    const MSAL_CLIENT_ID = '0813e1d1-ad72-46a9-8665-399bba48c201';
    let msalConfig: ApplicationConfiguration;

    describe('#buildApplicationConfiguration()', () => {
        beforeEach(() => {
            msalConfig = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                },
            };
        });

        it('sets correct clientId and other auth options to null when called with only clientId in auth config object', () => {
            const appConfig = buildApplicationConfiguration(msalConfig);
            expect(appConfig.auth.clientId).to.equal(MSAL_CLIENT_ID);
            expect(appConfig.auth.authority).to.be.null;
            expect(appConfig.auth.redirectUri).to.be.null;
        });
    });

});
