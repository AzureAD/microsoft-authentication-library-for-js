/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MsalConfiguration } from "../MsalConfiguration";
import { ICrypto } from "../../utils/crypto/ICrypto";
import { ICacheStorage } from "../../cache/ICacheStorage";
import { INetworkModule } from "../../network/INetworkModule";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";

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

    // Application config
    protected config: MsalConfiguration;
    
    // Crypto Interface
    protected crypto: ICrypto;

    // Storage Interface
    protected cacheStorage: ICacheStorage;

    // Network Interface
    protected networkClient: INetworkModule;

    constructor(configuration: MsalConfiguration) {
        // Set the configuration
        this.config = configuration;

        // Initialize crypto
        this.crypto = this.config.cryptoInterface;

        // Initialize storage interface
        this.cacheStorage = this.config.storageInterface;

        // Set the network interface
        this.networkClient = this.config.networkInterface;
    }

    abstract async createLoginUrl(): Promise<string>;
    abstract async createAcquireTokenUrl(): Promise<string>;

    handleFragmentResponse(hashFragment: string): void {
        return;
    }

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        if (this.config.auth.redirectUri) {
            if (typeof this.config.auth.redirectUri === "function") {
                return this.config.auth.redirectUri();
            }
            return this.config.auth.redirectUri;
        } else {
            throw ClientConfigurationError.createRedirectUriEmptyError();
        }
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        if (this.config.auth.postLogoutRedirectUri) {
            if (typeof this.config.auth.postLogoutRedirectUri === "function") {
                return this.config.auth.postLogoutRedirectUri();
            }
            return this.config.auth.postLogoutRedirectUri;
        } else {
            throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
        }
    }

}
