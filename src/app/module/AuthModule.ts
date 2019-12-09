/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// app
import { ModuleConfiguration, buildModuleConfiguration } from "../config/ModuleConfiguration";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
// response
import { AuthResponse } from "../../response/AuthResponse";
// cache
import { ICacheStorage } from "../../cache/ICacheStorage";
// network
import { INetworkModule } from "../../network/INetworkModule";
// utils
import { ICrypto } from "../../utils/crypto/ICrypto";
import { Account } from "../../auth/Account";
import { Authority } from "../../auth/authority/Authority";
import { PersistentCacheKeys } from "../../utils/Constants";
import { StringUtils } from "../../utils/StringUtils";
import { IdToken } from "../../auth/IdToken";
import { buildClientInfo } from "../../auth/ClientInfo";

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
    private config: ModuleConfiguration;
    
    // Crypto Interface
    protected cryptoObj: ICrypto;

    // Storage Interface
    protected cacheStorage: ICacheStorage;

    // Network Interface
    protected networkClient: INetworkModule;

    // Account object
    protected account: Account;

    // Default authority object
    protected defaultAuthorityInstance: Authority;

    constructor(configuration: ModuleConfiguration) {
        // Set the configuration
        this.config = buildModuleConfiguration(configuration);

        // Initialize crypto
        this.cryptoObj = this.config.cryptoInterface;

        // Initialize storage interface
        this.cacheStorage = this.config.storageInterface;

        // Set the network interface
        this.networkClient = this.config.networkInterface;
    }

    // #region URL Creation

    abstract async createLoginUrl(request: AuthenticationParameters): Promise<string>;
    abstract async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string>;

    // #endregion

    // #region Response Handling

    public handleFragmentResponse(hashFragment: string): AuthResponse {
        return null;
    }

    // #endregion
    
    // #region Getters and Setters

    getAccount(): Account {
        if (this.account) {
            return this.account;
        }

        // Get id token and client info from cache
        const rawIdToken = this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN);
        const rawClientInfo = this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO);

        if(!StringUtils.isEmpty(rawIdToken) && !StringUtils.isEmpty(rawClientInfo)) {
            const idToken = new IdToken(rawIdToken, this.cryptoObj);
            const clientInfo = buildClientInfo(rawClientInfo, this.cryptoObj);

            this.account = Account.createAccount(idToken, clientInfo, this.cryptoObj);
            return this.account;
        }

        // if login is not yet done, return null
        return null;
    }

    // #endregion
}
