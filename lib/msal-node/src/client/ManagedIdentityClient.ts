/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Authority,
    INetworkModule,
    Logger,
    AuthenticationResult,
} from "@azure/msal-common";
import { AppService } from "./ManagedIdentitySources/AppService";
import { AzureArc } from "./ManagedIdentitySources/AzureArc";
import { CloudShell } from "./ManagedIdentitySources/CloudShell";
import { Imds } from "./ManagedIdentitySources/Imds";
import { ServiceFabric } from "./ManagedIdentitySources/ServiceFabric";
import { CryptoProvider } from "../crypto/CryptoProvider";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../error/ManagedIdentityError";
import { ManagedIdentityRequest } from "../request/ManagedIdentityRequest";
import { ManagedIdentityId } from "../config/ManagedIdentityId";
import { NodeStorage } from "../cache/NodeStorage";
import { BaseManagedIdentitySource } from "./ManagedIdentitySources/BaseManagedIdentitySource";
import { AzureIdentitySdkManagedIdentitySourceNames } from "../utils/Constants";

/*
 * Class to initialize a managed identity and identify the service.
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ManagedIdentityClient.cs
 */
export class ManagedIdentityClient {
    private logger: Logger;
    private nodeStorage: NodeStorage;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

    private static identitySource?: BaseManagedIdentitySource;
    public static azureIdentitySdkManagedIdentitySourceNames?: AzureIdentitySdkManagedIdentitySourceNames;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
    }

    public async sendManagedIdentityTokenRequest(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId,
        fakeAuthority: Authority,
        refreshAccessToken?: boolean
    ): Promise<AuthenticationResult> {
        if (!ManagedIdentityClient.identitySource) {
            ManagedIdentityClient.identitySource =
                this.selectManagedIdentitySource(
                    this.logger,
                    this.nodeStorage,
                    this.networkClient,
                    this.cryptoProvider,
                    managedIdentityId
                );
        }

        return ManagedIdentityClient.identitySource.acquireTokenWithManagedIdentity(
            managedIdentityRequest,
            managedIdentityId,
            fakeAuthority,
            refreshAccessToken
        );
    }

    private allEnvironmentVariablesAreDefined(
        environmentVariables: Array<string | undefined>
    ): boolean {
        return Object.values(environmentVariables).every(
            (environmentVariable) => {
                return environmentVariable !== undefined;
            }
        );
    }

    /**
     * Determine the Managed Identity Source based on available environment variables. This API is consumed by ManagedIdentityApplication's getManagedIdentitySource.
     * @returns AzureIdentitySdkManagedIdentitySourceNames - Azure Identity SDK defined identifiers for the Managed Identity Sources
     */
    public getManagedIdentitySource(): AzureIdentitySdkManagedIdentitySourceNames {
        ManagedIdentityClient.azureIdentitySdkManagedIdentitySourceNames =
            this.allEnvironmentVariablesAreDefined(
                ServiceFabric.getEnvironmentVariables()
            )
                ? AzureIdentitySdkManagedIdentitySourceNames.SERVICE_FABRIC
                : this.allEnvironmentVariablesAreDefined(
                      AppService.getEnvironmentVariables()
                  )
                ? AzureIdentitySdkManagedIdentitySourceNames.APP_SERVICE
                : this.allEnvironmentVariablesAreDefined(
                      CloudShell.getEnvironmentVariables()
                  )
                ? AzureIdentitySdkManagedIdentitySourceNames.CLOUD_SHELL
                : this.allEnvironmentVariablesAreDefined(
                      AzureArc.getEnvironmentVariables()
                  )
                ? AzureIdentitySdkManagedIdentitySourceNames.ARC
                : AzureIdentitySdkManagedIdentitySourceNames.DEFAULT_TO_VM;

        return ManagedIdentityClient.azureIdentitySdkManagedIdentitySourceNames;
    }

    /**
     * Tries to create a managed identity source for all sources
     * @returns the managed identity Source
     */
    private selectManagedIdentitySource(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        managedIdentityId: ManagedIdentityId
    ): BaseManagedIdentitySource {
        const source =
            ServiceFabric.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                managedIdentityId
            ) ||
            AppService.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider
            ) ||
            CloudShell.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                managedIdentityId
            ) ||
            AzureArc.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                managedIdentityId
            ) ||
            Imds.tryCreate(logger, nodeStorage, networkClient, cryptoProvider);
        if (!source) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.unableToCreateSource
            );
        }
        return source;
    }
}
