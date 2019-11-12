/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// inheritance
import { AuthModule } from "./AuthModule";
import { MsalPublicClientConfiguration } from "../MsalPublicClientConfiguration";
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
import { TokenResponse } from "../../response/TokenResponse";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class AuthorizationCodeModule extends AuthModule {
    
    constructor(configuration: MsalPublicClientConfiguration) {
        super(configuration);
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }    
    
    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async acquireToken(request: TokenExchangeParameters): Promise<TokenResponse> {
        throw new Error("Method not implemented.");
    }
}
