/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common/node";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource.js";
import {
    HttpMethod,
    API_VERSION_QUERY_PARAMETER_NAME,
    RESOURCE_BODY_OR_QUERY_PARAMETER_NAME,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
    ManagedIdentityIdType,
    METADATA_HEADER_NAME,
    MACHINE_LEARNING_AND_SERVICE_FABRIC_SECRET_HEADER_NAME,
} from "../../utils/Constants.js";
import { CryptoProvider } from "../../crypto/CryptoProvider.js";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters.js";
import { ManagedIdentityId } from "../../config/ManagedIdentityId.js";
import { NodeStorage } from "../../cache/NodeStorage.js";

const MACHINE_LEARNING_MSI_API_VERSION: string = "2017-09-01";

// search for all App Service

export class MachineLearning extends BaseManagedIdentitySource {
    private identityEndpoint: string;
    private secret: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        identityEndpoint: string,
        secret: string
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.identityEndpoint = identityEndpoint;
        this.secret = secret;
    }

    public static getEnvironmentVariables(): Array<string | undefined> {
        const identityEndpoint: string | undefined =
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];

        const secret: string | undefined =
            process.env[ManagedIdentityEnvironmentVariableNames.MSI_SECRET];

        return [identityEndpoint, secret];
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): MachineLearning | null {
        const [identityEndpoint, secret] =
            MachineLearning.getEnvironmentVariables();

        // if either of the identity endpoint or MSI secret variables are undefined, this MSI provider is unavailable.
        if (!identityEndpoint || !secret) {
            logger.info(
                `[Managed Identity] ${ManagedIdentitySourceNames.MACHINE_LEARNING} managed identity is unavailable because one or both of the '${ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER}' and '${ManagedIdentityEnvironmentVariableNames.MSI_SECRET}' environment variables are not defined.`
            );
            return null;
        }

        const validatedIdentityEndpoint: string =
            MachineLearning.getValidatedEnvVariableUrlString(
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
                identityEndpoint,
                ManagedIdentitySourceNames.MACHINE_LEARNING,
                logger
            );

        logger.info(
            `[Managed Identity] Environment variables validation passed for ${ManagedIdentitySourceNames.MACHINE_LEARNING} managed identity. Endpoint URI: ${validatedIdentityEndpoint}. Creating ${ManagedIdentitySourceNames.MACHINE_LEARNING} managed identity.`
        );

        return new MachineLearning(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            identityEndpoint,
            secret
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
        request.headers[
            MACHINE_LEARNING_AND_SERVICE_FABRIC_SECRET_HEADER_NAME
        ] = this.secret;

        request.queryParameters[API_VERSION_QUERY_PARAMETER_NAME] =
            MACHINE_LEARNING_MSI_API_VERSION;
        request.queryParameters[RESOURCE_BODY_OR_QUERY_PARAMETER_NAME] =
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
