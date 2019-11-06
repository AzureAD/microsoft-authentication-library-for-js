/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "../MsalConfiguration";
// authority
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { ServerRequestParameters } from "../../request/server_request/ServerRequestParameters";
// response
import { AuthResponse } from "../../response/AuthResponse";
// utils
import { UrlString } from "../../url/UrlString";
import { HashParser } from "../HashParser";
import { CacheUtils } from "../../utils/CacheUtils";
import { AuthModule } from "./AuthModule";
import { CryptoUtils } from "../../utils/CryptoUtils";

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

    async createLoginUrl(request: import("../..").AuthenticationParameters): Promise<string> {
        const pkceCodes = await this.crypto.generatePKCECodes();
        console.log(`PKCE Codes: ${JSON.stringify(pkceCodes)}`);
        return null;
    }

    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    handleResponse(hash: string): AuthResponse {
        throw new Error("Method not implemented.");
    }

}
