/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { NodeStorage } from "../../cache/NodeStorage";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import {
    API_VERSION_QUERY_PARAMETER_NAME,
    HttpMethod,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentityIdType,
    ManagedIdentitySourceNames,
    RESOURCE_QUERY_PARAMETER_NAME,
    SERVICE_FABRIC_SECRET_HEADER_NAME,
} from "../../utils/Constants";

// MSI Constants. Docs for MSI are available here https://docs.microsoft.com/azure/app-service/overview-managed-identity
const SERVICE_FABRIC_MSI_API_VERSION: string = "2019-07-01-preview";

/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ServiceFabricManagedIdentitySource.cs
 */
export class ServiceFabric extends BaseManagedIdentitySource {
    private identityEndpoint: string;
    private identityHeader: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        identityEndpoint: string,
        identityHeader: string,
        systemAssigned: boolean
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.identityEndpoint = identityEndpoint;
        this.identityHeader = identityHeader;

        if (!systemAssigned) {
            logger.warning(
                `[Managed Identity] ${ManagedIdentitySourceNames.SERVICE_FABRIC} user assigned managed identity is configured in the cluster, not during runtime. See also: https://learn.microsoft.com/en-us/azure/service-fabric/configure-existing-cluster-enable-managed-identity-token-service.`
            );
        }
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        systemAssigned: boolean
    ): ServiceFabric | null {
        const identityHeader: string | undefined =
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
            ];

        const [areEnvironmentVariablesValidated, identityEndpoint]: [
            boolean,
            string | undefined
        ] = validateEnvironmentVariables(
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ],
            identityHeader,
            process.env[
                ManagedIdentityEnvironmentVariableNames
                    .IDENTITY_SERVER_THUMBPRINT
            ] || undefined,
            logger
        );

        return areEnvironmentVariablesValidated
            ? new ServiceFabric(
                  logger,
                  nodeStorage,
                  networkClient,
                  cryptoProvider,
                  identityEndpoint as string,
                  identityHeader as string,
                  systemAssigned
              )
            : null;
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

        request.headers[SERVICE_FABRIC_SECRET_HEADER_NAME] =
            this.identityHeader;

        request.queryParameters[API_VERSION_QUERY_PARAMETER_NAME] =
            SERVICE_FABRIC_MSI_API_VERSION;
        request.queryParameters[RESOURCE_QUERY_PARAMETER_NAME] = resource;

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

const validateEnvironmentVariables = (
    identityEndpoint: string | undefined,
    identityHeader: string | undefined,
    identityServerThumbprint: string | undefined,
    logger: Logger
): [boolean, string | undefined] => {
    /*
     * if either of the identity endpoint, identity header, or identity server thumbprint
     * environment variables are undefined, this MSI provider is unavailable.
     */
    if (!identityEndpoint || !identityHeader || !identityServerThumbprint) {
        logger.info(
            `[Managed Identity] ${ManagedIdentitySourceNames.SERVICE_FABRIC} managed identity is unavailable because one or all of the '${ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER}', '${ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' or '${ManagedIdentityEnvironmentVariableNames.IDENTITY_SERVER_THUMBPRINT}' environment variables are not defined.`
        );
        return [false, undefined];
    }

    const validatedIdentityEndpoint: string =
        ServiceFabric.getValidatedEnvVariableUrlString(
            ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
            identityEndpoint,
            ManagedIdentitySourceNames.SERVICE_FABRIC,
            logger
        );

    logger.info(
        `[Managed Identity] Environment variables validation passed for ${ManagedIdentitySourceNames.SERVICE_FABRIC} managed identity. Endpoint URI: ${validatedIdentityEndpoint}. Creating ${ManagedIdentitySourceNames.SERVICE_FABRIC} managed identity.`
    );
    return [true, validatedIdentityEndpoint];
};
