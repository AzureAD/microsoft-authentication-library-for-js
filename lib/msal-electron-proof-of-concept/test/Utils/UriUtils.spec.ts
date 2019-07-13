// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { TEST_CONFIGURATION, TEST_URIS } from '../testConstants'; 
import { UriUtils } from '../../src/utils/uriUtils';

describe('uriUtils.ts class', () => {
    describe('#canonicalizeUri', () => {
        it('should return undefined if called with null object', () => {
            expect(UriUtils.canonicalizeUri(null)).to.be.undefined;
        });

        it('should return the same URI if called with a proper canonical URI', () => {
            expect(UriUtils.canonicalizeUri(TEST_URIS.DEFAULT_INSTANCE)).to.be.equal(TEST_URIS.DEFAULT_INSTANCE);
        });

        it('should add trailing forward slash to supplied URI when missing', () => {
            expect(UriUtils.canonicalizeUri(TEST_URIS.DEFAULT_INSTANCE_NO_SLASH)).to.be.equal(TEST_URIS.DEFAULT_INSTANCE);
        });

        it('should downcase supplied URI when capitalized', () => {
            expect(UriUtils.canonicalizeUri(TEST_URIS.DEFAULT_INSTANCE_UPCASE)).to.be.equal(TEST_URIS.DEFAULT_INSTANCE);
        });
    });
});
