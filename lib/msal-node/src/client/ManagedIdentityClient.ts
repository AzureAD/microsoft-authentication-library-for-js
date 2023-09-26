/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CacheManager,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DefaultStorageClass,
    INetworkModule,
    Logger,
    LoggerOptions,
    NetworkManager,
} from "@azure/msal-common";
import { ManagedIdentityIdType } from "../utils/Constants";
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

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityClient {
    private config: ManagedIdentityNodeConfiguration;
    private logger: Logger;
    private cacheManager: CacheManager;
    protected networkClient: INetworkModule;
    protected networkManager: NetworkManager;

    private isUserAssigned: boolean;
    private identitySource:
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds;

    /*
     * system assigned, user doesn't pass anything
     * user assigned, client id or resource id
     */

    constructor(configuration: ManagedIdentityConfiguration) {
        this.config = buildManagedIdentityConfiguration(configuration);

        this.logger = new Logger(
            this.config.system.loggerOptions as LoggerOptions,
            name,
            version
        );

        (this.cacheManager = new DefaultStorageClass(
            this.config.id,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            this.logger
        )),
            (this.networkClient = this.config.system
                .networkClient as INetworkModule);
        this.networkManager = new NetworkManager(
            this.networkClient,
            this.cacheManager
        );

        switch (this.config.resourceType) {
            case ManagedIdentityIdType.SYSTEM_ASSIGNED:
                this.isUserAssigned = false;
                break;
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.isUserAssigned = true;
                break;
            default:
                // TODO: throw error
                break;
        }

        this.identitySource = this.selectManagedIdentitySource();
    }

    /*
     * TODO: implement this method; currently is DOTNET implementation
     *
     * public async sendTokenRequestAsync(
     *     parameters: AcquireTokenForManagedIdentityParameters,
     *     cancellationToken: number
     * ): ManagedIdentityResponse {
     *     return await this.identitySource.authenticateAsync(
     *         parameters,
     *         cancellationToken
     *     );
     * }
     */

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
                    this.isUserAssigned
                ) ||
                AppService.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager
                ) ||
                CloudShell.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager,
                    this.isUserAssigned
                ) ||
                AzureArc.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager,
                    this.isUserAssigned
                ) ||
                Imds.tryCreate(
                    this.config,
                    this.logger,
                    this.cacheManager,
                    this.networkManager
                )
            );
        } catch (error) {
            // TODO: throw exception
            throw error;
        }
    }
}
