/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// app
import { MsalConfiguration, buildMsalConfiguration } from "../config/MsalConfiguration";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
// response
import { AuthResponse } from "../../response/AuthResponse";
// cache
import { ICacheStorage } from "../../cache/ICacheStorage";
// network
import { INetworkModule } from "../../network/INetworkModule";
// error
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
// utils
import { ICrypto } from "../../utils/crypto/ICrypto";

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
 * AuthModule class
 * 
 * Parent object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
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
        this.config = buildMsalConfiguration(configuration);

        // Initialize crypto
        this.crypto = this.config.cryptoInterface;

        // Initialize storage interface
        this.cacheStorage = this.config.storageInterface;

        // Set the network interface
        this.networkClient = this.config.networkInterface;
    }

    abstract async createLoginUrl(request: AuthenticationParameters): Promise<string>;
    abstract async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string>;

    handleFragmentResponse(hashFragment: string): AuthResponse {
        return null;
    }
}
