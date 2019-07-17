import { Authority } from './Authority';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class AadAuthority extends Authority {
    constructor(authorityUrl: string) {
        super(authorityUrl);
    }
}
