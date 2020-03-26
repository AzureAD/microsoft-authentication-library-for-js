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
import { Constants } from "../utils/Constants";
import {ClientAuthError} from "../error/ClientAuthError";
import {RequestUtils} from "../utils/RequestUtils";

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
 * BaseClient class
 *
 * Parent object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 *
 */
export abstract class BaseClient {

    // Logger object
    public logger: Logger;

    // Application config
    protected config: Configuration;

    // Crypto Interface
    protected cryptoObj: ICrypto;

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
        this.cryptoObj = this.config.cryptoInterface;

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

        // TODO expensive to resolve authority endpoints everytime.
        const authority: Authority = authorityString
            ? AuthorityFactory.createInstance(authorityString, this.networkClient)
            : this.defaultAuthorityInstance;

        try {
            await authority.resolveEndpointsAsync();
        } catch (error) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(error);
        }

        return authority;
    }

    /**
     * Creates default headers for requests to token endpoint
     */
    protected createDefaultTokenRequestHeaders(): Map<string, string> {
        const headers = new Map<string, string>();
        RequestUtils.addContentTypeHeader(headers);
        RequestUtils.addLibrarydataHeaders(headers);
        return headers;
    }

    /**
     * Http post to token endpoint
     * @param tokenEndpoint
     * @param queryString
     * @param headers
     */
    protected async executePostToTokenEndpoint(
        tokenEndpoint: string,
        queryString: string,
        headers: Map<string, string> ): Promise<string> {

        return this.networkClient.sendPostRequestAsync<string>(
            tokenEndpoint,
            {
                body: queryString,
                headers: headers,
            });
    }
}
