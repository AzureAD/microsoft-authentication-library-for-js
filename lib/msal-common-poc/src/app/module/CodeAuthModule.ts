/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "../MsalConfiguration";
import { AuthModule } from "./AuthModule";


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
export class CodeAuthModule extends AuthModule {

    constructor(configuration: MsalConfiguration) {
        super(configuration);
    }

    createLoginUrl(request: import("../..").AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    createAcquireTokenUrl(request: import("../..").AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    handleResponse(hash: string): import("../..").AuthResponse {
        throw new Error("Method not implemented.");
    }

}
