/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Configuration, buildConfiguration } from "../config/Configuration";
import { ICacheStorage } from "../cache/ICacheStorage";
import { CacheHelpers } from "../cache/CacheHelpers";
import { INetworkModule } from "../network/INetworkModule";
import { ICrypto } from "../crypto/ICrypto";
import { Account } from "../account/Account";
import { Authority } from "../authority/Authority";
import { Logger } from "../logger/Logger";
import { AuthorityFactory } from "../authority/AuthorityFactory";
import {AADServerParamKeys, Constants, HeaderNames} from "../utils/Constants";
import {ClientAuthError} from "../error/ClientAuthError";
import {NetworkResponse} from "../network/NetworkManager";
import {ServerAuthorizationTokenResponse} from "../server/ServerAuthorizationTokenResponse";

/**
 * Base application class which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 */
export abstract class BaseClient {

    // Logger object
    public logger: Logger;

    // Application config
    protected config: Configuration;

    // Crypto Interface
    protected cryptoUtils: ICrypto;

    // Storage Interface
    protected cacheStorage: ICacheStorage;

    // Network Interface
    protected networkClient: INetworkModule;

    // Helper API object for running cache functions
    protected cacheManager: CacheHelpers;

    // Account object
    protected account: Account;

    // Default authority object
    protected defaultAuthorityInstance: Authority;

    protected constructor(configuration: Configuration) {
        // Set the configuration
        this.config = buildConfiguration(configuration);

        // Initialize the logger
        this.logger = new Logger(this.config.loggerOptions);

        // Initialize crypto
        this.cryptoUtils = this.config.cryptoInterface;

        // Initialize storage interface
        this.cacheStorage = this.config.storageInterface;

        // Initialize storage helper object
        this.cacheManager = new CacheHelpers(this.cacheStorage);

        // Set the network interface
        this.networkClient = this.config.networkInterface;

        // Default authority instance.
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(
            this.config.authOptions.authority || Constants.DEFAULT_AUTHORITY,
            this.networkClient
        );
    }

    /**
     * Create authority instance if not set already, resolve well-known-endpoint
     * @param authorityString
     */
    protected async createAuthority(authorityString: string): Promise<Authority> {

        // TODO expensive to resolve authority endpoints every time.
        const authority: Authority = authorityString
            ? AuthorityFactory.createInstance(authorityString, this.networkClient)
            : this.defaultAuthorityInstance;

        await authority.resolveEndpointsAsync().catch(error => {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(error);
        });

        return authority;
    }

    /**
     * Creates default headers for requests to token endpoint
     */
    protected createDefaultTokenRequestHeaders(): Map<string, string> {

        const headers = this.createDefaultLibraryHeaders();
        headers.set(HeaderNames.CONTENT_TYPE, Constants.URL_FORM_CONTENT_TYPE);

        return headers;
    }

    /**
     * addLibraryData
     */
    protected createDefaultLibraryHeaders(): Map<string, string> {
        const headers = new Map<string, string>();
        // client info headers
        headers.set(`${AADServerParamKeys.X_CLIENT_SKU}`, this.config.clientInfo.sku);
        headers.set(`${AADServerParamKeys.X_CLIENT_VER}`, this.config.clientInfo.version);
        headers.set(`${AADServerParamKeys.X_CLIENT_OS}`, this.config.clientInfo.os);
        headers.set(`${AADServerParamKeys.X_CLIENT_CPU}`, this.config.clientInfo.cpu);

        return headers;
    }

    /**
     * Http post to token endpoint
     * @param tokenEndpoint
     * @param queryString
     * @param headers
     */
    protected executePostToTokenEndpoint(
        tokenEndpoint: string,
        queryString: string,
        headers: Map<string, string> ): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {

        return this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(
            tokenEndpoint,
            {
                body: queryString,
                headers: headers,
            });
    }
}
