// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { UriError } from '../../src/Utils/Error/UriError';
import { UriUtils } from '../../src/Utils/UriUtils';
import { TEST_CONFIGURATION, TEST_URIS } from '../testConstants';

describe('uriUtils.ts class', () => {
    describe('#canonicalizeUri', () => {
        it('should throw UriError if called with null object', () => {
            const invalidCanonicalizeUriCall = () => {
                return UriUtils.canonicalizeUri(null);
            };
            expect(invalidCanonicalizeUriCall).to.throw(UriError);
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
