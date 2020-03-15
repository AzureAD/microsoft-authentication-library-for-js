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
import { AuthorityFactory } from "./../authority/AuthorityFactory";
import { Authority } from "./../authority/Authority";
import { Constants } from "./../utils/Constants";
import { ClientAuthError } from "./../error/ClientAuthError";
import { UrlGenerator } from "./../server/URLGenerator";

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
     * Creates a url for logging in a user. This will by default add scopes: openid, profile and offline_access. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request
     */
    async getAuthCodeUrl(request: AuthorizationCodeUrlParameters): Promise<string> {
        const authority: Authority = await this.setAuthority(request && request.authority);
        const urlMap: Map<string, string> = AuthorizationCodeUrlParameters.generateAuthCodeUrlParams(
            request,
            this.clientConfig
        );
        const url: string = UrlGenerator.createUrl(urlMap, authority);

        return url;
    }

    /**
     *
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
}
