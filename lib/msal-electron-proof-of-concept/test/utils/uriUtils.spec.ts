// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { expect } from 'chai';
import * as Mocha from 'mocha';

import { UriUtils } from '../../src/utils/uriUtils';

describe('uriUtils.ts class', () => {
    describe('#canonicalizeUri', () => {
        it('should return undefined if called with null object', () => {
            expect(UriUtils.canonicalizeUri(null)).to.be.undefined;
        });
    });
});
