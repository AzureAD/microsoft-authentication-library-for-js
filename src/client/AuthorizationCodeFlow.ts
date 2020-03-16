/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import {
    AuthorizationClientConfiguration,
    buildAuthorizationClientConfiguration
} from "../config/AuthorizationClientConfiguration";
import { AuthorizationCodeUrlParameters } from "./../request/AuthorizationCodeUrlParameters";
import { AuthorizationCodeParameters } from "./../request/AuthorizationCodeParameters";
import { AuthorityFactory } from "./../authority/AuthorityFactory";
import { Authority } from "./../authority/Authority";
import { Constants } from "./../utils/Constants";
import { ClientAuthError } from "./../error/ClientAuthError";
import { ServerParamsGenerator } from "../server/ServerParamsGenerator";

/**
 *
 * AuthorizationCodeFlow class
 *
 * Object instance which will construct requests to send to and handle responses
 * from the Microsoft STS using the authorization code flow.
 */
export class AuthorizationCodeFlow extends BaseClient {

    // Application config
    private clientConfig: AuthorizationClientConfiguration;

    constructor(configuration: AuthorizationClientConfiguration) {
        // Implement base module
        super({
            systemOptions: configuration.systemOptions,
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        // Implement defaults in config
        this.clientConfig = buildAuthorizationClientConfiguration(configuration);

        // Initialize default authority instance
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(
            this.clientConfig.auth.authority || Constants.DEFAULT_AUTHORITY,
            this.networkClient
        );
    }

    /**
     * Creates a url for logging in a user.
     *  - scopes added by default: openid, profile and offline_access.
     *  - performs validation of the request parameters.
     *  - Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     *
     * @param request
     */
    async getAuthCodeUrl(request: AuthorizationCodeUrlParameters): Promise<string> {
        const authority: Authority = await this.setAuthority(request && request.authority);
        const urlMap: Map<string, string> = AuthorizationCodeUrlParameters.generateAuthCodeUrlParams(
            request,
            this.clientConfig
        );
        const url: string = ServerParamsGenerator.createUrl(urlMap, authority);
        return url;
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the authorization_code_grant
     * @param request
     */
    async acquireTokenByCode(request: AuthorizationCodeParameters): Promise<string> {

        const tokenEndpoint: Authority = await this.setAuthority(request && request.authority);
        const acquiredTokenResponse = this.tokenRequest(tokenEndpoint, request);
        return acquiredTokenResponse;

        // add response_handler here to send the response
    }

    /**
     * @param authority
     */
    private async setAuthority(authority: string): Promise<Authority> {
        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority = authority
            ? AuthorityFactory.createInstance(authority, this.networkClient)
            : this.defaultAuthorityInstance;

        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }

        return acquireTokenAuthority;
    }

    /**
     *
     * @param tokenEndPoint
     * @param body
     * @param headers
     */
    private async tokenRequest(tokenEndPoint: Authority, request: AuthorizationCodeParameters): Promise<string> {
        // generate the params
        const urlMap: Map<string, string> = AuthorizationCodeParameters.generateAuthCodeParams(
            request,
            this.clientConfig
        );

        // generate body and headers for the POST request and perform token request
        const headers: Map<string, string> = new Map<string, string>();
        let acquiredTokenResponse;
        try {
            acquiredTokenResponse = this.networkClient.sendPostRequestAsync<string>(
                tokenEndPoint.canonicalAuthority,
                {
                    body: ServerParamsGenerator.createUrl(urlMap, tokenEndPoint),
                    headers: ServerParamsGenerator.createHeaders(headers)
                }
            );
            return acquiredTokenResponse;
        } catch (error) {
            console.log(error.response.data);
            return error.response.data;
        }
    }
}
