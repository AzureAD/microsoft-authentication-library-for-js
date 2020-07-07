/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../utils/Constants";

export class RequestThumbprint {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier?: string;

    constructor(clientId: string, authority: string, scopes: Array<string>, homeAccountIdentifier?: string) {
        this.clientId = clientId;
        this.authority = authority;
        this.scopes = scopes;
        this.homeAccountIdentifier = homeAccountIdentifier;
    }

    public generateStorageKey(): string {
        return `${Constants.THROTTLE_PREFIX}.${JSON.stringify(this)}`
    }
}