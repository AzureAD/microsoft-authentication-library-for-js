// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { ApplicationConfiguration } from '../../src/index';

describe('ApplicationConfiguration.ts', () => {
    // Test MSAL config params
    const MSAL_CLIENT_ID = '0813e1d1-ad72-46a9-8665-399bba48c201';
    let msalConfig;

    describe('#constructor', () => {
        beforeEach(() => {
            msalConfig = {
                clientId: MSAL_CLIENT_ID,
            };
        });

        it('sets correct clientId and other auth options to null when called with only clientId in auth config object', () => {
            const appConfig = new ApplicationConfiguration(msalConfig);
            expect(appConfig.authOptions.clientId).to.equal(MSAL_CLIENT_ID);
            expect(appConfig.authOptions.authority).to.be.undefined;
            expect(appConfig.authOptions.redirectUri).to.be.undefined;
        });
    });

});
