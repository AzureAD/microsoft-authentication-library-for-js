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
    LoggerOptions,
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

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private managedIdentityId: ManagedIdentityId;
    private config: ManagedIdentityNodeConfiguration;
    private logger: Logger;
    private cacheManager: CacheManager;
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

        const networkClient: INetworkModule = this.config.system.networkClient;
        this.networkManager = new NetworkManager(
            networkClient,
            this.cacheManager
        );

        this.identitySource = this.selectManagedIdentitySource();
    }

    // TODO: implement this method
    public async acquireToken(
        request: ManagedIdentityRequest
    ): Promise<AuthenticationResult | null> {
        //
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
            return (
                // parameters are based on DOTNET implementations
                ServiceFabric.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager,
                    this.managedIdentityId
                ) ||
                AppService.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager,
                    this.managedIdentityId
                ) ||
                CloudShell.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager,
                    this.managedIdentityId
                ) ||
                AzureArc.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager,
                    this.managedIdentityId
                ) ||
                Imds.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.managedIdentityId
                )
            );
        } catch (error) {
            // TODO: throw exception
            throw error;
        }
    }
}
