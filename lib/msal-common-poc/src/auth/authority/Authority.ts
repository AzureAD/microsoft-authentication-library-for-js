/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export enum AuthorityType {
    Aad,
    Adfs,
    B2C
}

/**
 * @hidden
 */
export abstract class Authority {

    authorizationEndpoint: string;

    constructor(authority: string) {
        
    }
}
