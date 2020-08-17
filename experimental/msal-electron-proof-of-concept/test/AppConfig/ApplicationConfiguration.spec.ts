// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { ApplicationConfiguration } from '../../src/index';
import { TEST_CONFIGURATION, TEST_VALID_AUTH_CONFIGURATION } from '../testConstants';

describe('ApplicationConfiguration.ts', () => {
    let msalConfig;

    describe('#constructor', () => {
        beforeEach(() => {
            msalConfig = {
                clientId: TEST_VALID_AUTH_CONFIGURATION.clientId,
            };
        });

        it('sets correct default configuration when only client ID is passed in', () => {
            const appConfig = new ApplicationConfiguration(msalConfig);
            expect(appConfig.authOptions.clientId).to.equal(TEST_VALID_AUTH_CONFIGURATION.clientId);
            expect(appConfig.authOptions.authority).to.equal(TEST_VALID_AUTH_CONFIGURATION.authority);
            expect(appConfig.authOptions.redirectUri).to.equal(TEST_VALID_AUTH_CONFIGURATION.redirectUri);
        });
    });

});
