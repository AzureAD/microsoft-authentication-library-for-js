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
import { RetryTracker } from "../utils/RetryTracker";

/*
 * Class to initialize a managed identity and identify the service.
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ManagedIdentityClient.cs
 */
export class ManagedIdentityClient {
    private logger: Logger;
    private nodeStorage: NodeStorage;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;
    private retryTracker: RetryTracker;

    static identitySource:
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds
        | undefined;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        retryTracker: RetryTracker
    ) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
        this.retryTracker = retryTracker;
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
                    this.retryTracker,
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

    /**
     * Tries to create a managed identity source for all sources
     * @returns the managed identity Source
     */
    private selectManagedIdentitySource(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        retryTracker: RetryTracker,
        managedIdentityId: ManagedIdentityId
    ): ServiceFabric | AppService | CloudShell | AzureArc | Imds {
        const source =
            ServiceFabric.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                retryTracker,
                managedIdentityId
            ) ||
            AppService.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                retryTracker
            ) ||
            CloudShell.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                retryTracker,
                managedIdentityId
            ) ||
            AzureArc.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                retryTracker,
                managedIdentityId
            ) ||
            Imds.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider,
                retryTracker
            );
        if (!source) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.unableToCreateSource
            );
        }
        return source;
    }
}
