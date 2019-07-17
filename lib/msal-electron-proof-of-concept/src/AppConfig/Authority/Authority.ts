// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { UriUtils } from '../../Utils/UriUtils';

/**
 * @hidden
 */
export abstract class Authority {
    private canonicalAuthority: string;
    private tenantId: string;

    constructor(authorityUrl: string, tenantId?: string) {
        this.canonicalAuthority = UriUtils.canonicalizeUri(authorityUrl);
        this.tenantId = tenantId;
    }

    public get tenant(): string {
        return this.tenantId;
    }
}
