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

/*
 * Class to initialize a managed identity and identify the service.
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ManagedIdentityClient.cs
 */
export class ManagedIdentityClient {
    private identitySource:
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ) {
        this.identitySource = this.selectManagedIdentitySource(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider
        );
    }

    public async sendManagedIdentityTokenRequest(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId,
        fakeAuthority: Authority,
        refreshAccessToken?: boolean
    ): Promise<AuthenticationResult> {
        return await this.identitySource.acquireTokenWithManagedIdentity(
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
        cryptoProvider: CryptoProvider
    ): ServiceFabric | AppService | CloudShell | AzureArc | Imds {
        const source =
            AppService.tryCreate(
                logger,
                nodeStorage,
                networkClient,
                cryptoProvider
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
