// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DEFAULT_AUTH_ENDPOINT_PATH, DEFAULT_TOKEN_ENDPOINT_PATH } from '../DefaultConstants';
import { Authority } from './Authority';

export class AadAuthority extends Authority {
    constructor(authorityUrl: string, tenant?: string) {
        super(authorityUrl, tenant);
    }

    public get authorizationEndpoint(): string {
       return `${this.canonicalAuthority}${DEFAULT_AUTH_ENDPOINT_PATH}`;
    }

    public get tokenEndpoint(): string {
        return `${this.canonicalAuthority}${DEFAULT_TOKEN_ENDPOINT_PATH}`;
    }
}
