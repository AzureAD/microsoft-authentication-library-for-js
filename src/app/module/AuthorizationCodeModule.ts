/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// inheritance
import { AuthModule } from "./AuthModule";
import { MsalConfiguration } from "../MsalConfiguration";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class AuthorizationCodeModule extends AuthModule {
    
    constructor(configuration: MsalConfiguration) {
        super(configuration);
    }

    async createLoginUrl(): Promise<string> {
        throw new Error("Method not implemented.");
    }    
    
    async createAcquireTokenUrl(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async acquireToken(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
