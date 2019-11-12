/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * @ignore
 * Data type to hold information about state returned from the server
 */
export type ResponseStateInfo = {
    state: string;
    stateMatch: boolean;
};

/**
 * CodeAuthModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export abstract class AuthModule {
    constructor() {

    }

    abstract async createLoginUrl(): Promise<string>;
    abstract async createAcquireTokenUrl(): Promise<string>;

    handleResponse(): void {
        return;
    }
}
