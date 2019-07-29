// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { UriUtils } from '../../Utils/UriUtils';

/**
 * @hidden
 */
export abstract class Authority {
    protected canonicalAuthority: string;
    private tenantId?: string;

    constructor(authorityUrl: string, tenantId?: string) {
        this.canonicalAuthority = UriUtils.canonicalizeUri(authorityUrl);
        this.tenantId = tenantId;
    }

    public abstract get authorizationEndpoint(): string;
    public abstract get tokenEndpoint(): string;
}
