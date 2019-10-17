/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "../auth/authority/Authority";

export class ServerRequestParameters {

    authorityInstance: Authority;
    
    constructor(a: string) {
        console.log(a);
    }

}
