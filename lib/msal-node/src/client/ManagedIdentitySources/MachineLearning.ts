/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common/node";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource.js";
import {
    HttpMethod,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
    ManagedIdentityIdType,
    ManagedIdentityQueryParameters,
    ManagedIdentityHeaders,
} from "../../utils/Constants.js";
import { CryptoProvider } from "../../crypto/CryptoProvider.js";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters.js";
import { ManagedIdentityId } from "../../config/ManagedIdentityId.js";
import { NodeStorage } from "../../cache/NodeStorage.js";

const MACHINE_LEARNING_MSI_API_VERSION: string = "2017-09-01";

export class MachineLearning extends BaseManagedIdentitySource {
    private msiEndpoint: string;
    private secret: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        disableInternalRetries: boolean,
        msiEndpoint: string,
        secret: string
    ) {
        super(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            disableInternalRetries
        );

        this.msiEndpoint = msiEndpoint;
        this.secret = secret;
    }

    public static getEnvironmentVariables(): Array<string | undefined> {
        const msiEndpoint: string | undefined =
            process.env[ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT];

        const secret: string | undefined =
            process.env[ManagedIdentityEnvironmentVariableNames.MSI_SECRET];

        return [msiEndpoint, secret];
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        disableInternalRetries: boolean
    ): MachineLearning | null {
        const [msiEndpoint, secret] = MachineLearning.getEnvironmentVariables();

        // if either of the MSI endpoint or MSI secret variables are undefined, this MSI provider is unavailable.
        if (!msiEndpoint || !secret) {
            logger.info(
                `[Managed Identity] ${ManagedIdentitySourceNames.MACHINE_LEARNING} managed identity is unavailable because one or both of the '${ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT}' and '${ManagedIdentityEnvironmentVariableNames.MSI_SECRET}' environment variables are not defined.`
            );
            return null;
        }

        const validatedMsiEndpoint: string =
            MachineLearning.getValidatedEnvVariableUrlString(
                ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT,
                msiEndpoint,
                ManagedIdentitySourceNames.MACHINE_LEARNING,
                logger
            );

        logger.info(
            `[Managed Identity] Environment variables validation passed for ${ManagedIdentitySourceNames.MACHINE_LEARNING} managed identity. Endpoint URI: ${validatedMsiEndpoint}. Creating ${ManagedIdentitySourceNames.MACHINE_LEARNING} managed identity.`
        );

        return new MachineLearning(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            disableInternalRetries,
            msiEndpoint,
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
                this.msiEndpoint
            );

        request.headers[ManagedIdentityHeaders.METADATA_HEADER_NAME] = "true";
        request.headers[ManagedIdentityHeaders.ML_AND_SF_SECRET_HEADER_NAME] =
            this.secret;

        request.queryParameters[ManagedIdentityQueryParameters.API_VERSION] =
            MACHINE_LEARNING_MSI_API_VERSION;
        request.queryParameters[ManagedIdentityQueryParameters.RESOURCE] =
            resource;

        if (
            managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED
        ) {
            request.queryParameters[
                this.getManagedIdentityUserAssignedIdQueryParameterKey(
                    managedIdentityId.idType,
                    false, // isIMDS
                    true // uses2017API
                )
            ] = managedIdentityId.id;
        }

        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity

        return request;
    }
}
