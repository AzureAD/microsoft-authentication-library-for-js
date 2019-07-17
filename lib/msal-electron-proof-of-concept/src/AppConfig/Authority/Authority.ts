// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { UriUtils } from '../../Utils/UriUtils';

/**
 * @hidden
 */
export abstract class Authority {
    private canonicalAuthority: string;

    constructor(authorityUrl: string) {
        this.canonicalAuthority = UriUtils.canonicalizeUri(authorityUrl);
    }
}
