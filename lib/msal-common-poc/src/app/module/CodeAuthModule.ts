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
import { AuthorizationCodeRequestParameters } from "../../request/server_request/AuthorizationCodeRequestParameters";
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
        // Initialize authority or use default, and perform discovery endpoint check
        let acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        acquireTokenAuthority = await acquireTokenAuthority.resolveEndpointsAsync();

        // Set the account object to the current session
        request.account = this.getAccount();

        // Create and validate request parameters
        const requestParameters = new AuthorizationCodeRequestParameters(
            acquireTokenAuthority,
            this.config.auth.clientId,
            request,
            true,
            false,
            this.getAccount(),
            this.getRedirectUri(),
            this.crypto
        );

        requestParameters.appendExtraScopes();

        if (!requestParameters.isSSOParam(request.account)) {
            // TODO: Add ADAL Token SSO
        }

        // if the user sets the login start page - angular only??
        const loginStartPage = window.location.href;

        // Update entries for start of request event
        CacheUtils.updateCacheEntries(this.cacheStorage, requestParameters, request.account, loginStartPage);

        // populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
        requestParameters.populateQueryParams();

        // Construct and return navigation url
        return requestParameters.createNavigateUrl();
    }

    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    handleResponse(hash: string): AuthResponse {
        throw new Error("Method not implemented.");
    }

}
