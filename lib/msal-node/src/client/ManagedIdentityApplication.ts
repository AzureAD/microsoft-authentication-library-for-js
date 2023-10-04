/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    CacheManager,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DefaultStorageClass,
    INetworkModule,
    Logger,
    NetworkManager,
} from "@azure/msal-common";
import { ServiceFabric } from "./ManagedIdentitySources/ServiceFabric";
import { AppService } from "./ManagedIdentitySources/AppService";
import { CloudShell } from "./ManagedIdentitySources/CloudShell";
import { AzureArc } from "./ManagedIdentitySources/AzureArc";
import { Imds } from "./ManagedIdentitySources/Imds";
import {
    ManagedIdentityConfiguration,
    ManagedIdentityNodeConfiguration,
    buildManagedIdentityConfiguration,
} from "../config/Configuration";
import { version, name } from "../packageMetadata.js";
import { ManagedIdentityRequest } from "../request/ManagedIdentityRequest";
import { ManagedIdentityId } from "../config/ManagedIdentityId";
import { CryptoProvider } from "../crypto/CryptoProvider";

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private managedIdentityId: ManagedIdentityId;
    private config: ManagedIdentityNodeConfiguration;
    protected readonly cryptoProvider: CryptoProvider;
    private logger: Logger;
    private cacheManager: CacheManager;
    private networkClient: INetworkModule;
    private networkManager: NetworkManager;

    private identitySource:
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds;

    constructor(
        managedIdentityId: ManagedIdentityId,
        configuration?: ManagedIdentityConfiguration
    ) {
        this.config = buildManagedIdentityConfiguration(configuration || {});
        this.managedIdentityId = managedIdentityId;

        this.cryptoProvider = new CryptoProvider();

        this.logger = new Logger(
            this.config.system.loggerOptions,
            name,
            version
        );

        this.cacheManager = new DefaultStorageClass(
            this.managedIdentityId.id,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            this.logger
        );

        this.networkClient = this.config.system.networkClient;
        this.networkManager = new NetworkManager(
            this.networkClient,
            this.cacheManager
        );

        this.identitySource = this.selectManagedIdentitySource();
    }

    // TODO: implement this method
    public async acquireToken(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId
    ): Promise<AuthenticationResult | null> {
        /*
         * TODO: check forceRefresh flag
         * TODO: check cache
         */

        return await this.identitySource.authenticateWithMSI(
            managedIdentityRequest,
            managedIdentityId
        );
    }

    /**
     * Tries to create a managed identity source for all sources
     * @param request the managed identity request
     * @returns the managed identity Source
     */
    // TODO: update return type
    private selectManagedIdentitySource():
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds {
        try {
            const source = AppService.tryCreate(
                this.logger,
                this.cacheManager,
                this.networkClient,
                this.networkManager,
                this.cryptoProvider
            );

            /*
             * ||
             *  ServiceFabric.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  // *** AppService goes here ***
             *  CloudShell.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  AzureArc.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  Imds.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  )
             */

            if (!source) {
                // TODO: implement better error
                throw "Unable to create a source";
            }
            return source;
        } catch (error) {
            // TODO: throw exception
            throw error;
        }
    }
}
