/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common/node";
import { ManagedIdentityId } from "../../config/ManagedIdentityId.js";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters.js";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource.js";
import { CryptoProvider } from "../../crypto/CryptoProvider.js";
import {
    HttpMethod,
    METADATA_HEADER_NAME,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentityIdType,
    ManagedIdentityQueryParameters,
    ManagedIdentitySourceNames,
    MSI_V1_MIN_VERSION,
} from "../../utils/Constants.js";
import { NodeStorage } from "../../cache/NodeStorage.js";

// IMDS constants. Docs for IMDS are available here https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/how-to-use-vm-token#get-a-token-using-http
const IMDS_TOKEN_PATH: string = "/metadata/identity/oauth2/token";
const DEFAULT_IMDS_ENDPOINT: string = `http://169.254.169.254${IMDS_TOKEN_PATH}`;

// Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ImdsManagedIdentitySource.cs
export class Imds extends BaseManagedIdentitySource {
    private identityEndpoint: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        identityEndpoint: string
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.identityEndpoint = identityEndpoint;
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): Imds {
        let validatedIdentityEndpoint: string;

        if (
            process.env[
                ManagedIdentityEnvironmentVariableNames
                    .AZURE_POD_IDENTITY_AUTHORITY_HOST
            ]
        ) {
            logger.info(
                `[Managed Identity] Environment variable ${
                    ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST
                } for ${ManagedIdentitySourceNames.IMDS} returned endpoint: ${
                    process.env[
                        ManagedIdentityEnvironmentVariableNames
                            .AZURE_POD_IDENTITY_AUTHORITY_HOST
                    ]
                }`
            );
            validatedIdentityEndpoint = Imds.getValidatedEnvVariableUrlString(
                ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST,
                `${
                    process.env[
                        ManagedIdentityEnvironmentVariableNames
                            .AZURE_POD_IDENTITY_AUTHORITY_HOST
                    ]
                }${IMDS_TOKEN_PATH}`,
                ManagedIdentitySourceNames.IMDS,
                logger
            );
        } else {
            logger.info(
                `[Managed Identity] Unable to find ${ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST} environment variable for ${ManagedIdentitySourceNames.IMDS}, using the default endpoint.`
            );
            validatedIdentityEndpoint = DEFAULT_IMDS_ENDPOINT;
        }

        return new Imds(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            validatedIdentityEndpoint
        );
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.GET,
                this.identityEndpoint
            );

        request.headers[METADATA_HEADER_NAME] = "true";

        request.queryParameters[ManagedIdentityQueryParameters.API_VERSION] =
            MSI_V1_MIN_VERSION;
        request.queryParameters[ManagedIdentityQueryParameters.RESOURCE] =
            resource;

        if (
            managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED
        ) {
            request.queryParameters[
                this.getManagedIdentityUserAssignedIdQueryParameterKey(
                    managedIdentityId.idType
                )
            ] = managedIdentityId.id;
        }

        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity

        return request;
    }
}
