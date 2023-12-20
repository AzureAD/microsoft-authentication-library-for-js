/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { NodeStorage } from "../../cache/NodeStorage";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import {
    HttpMethod,
    METADATA_HEADER_NAME,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
    RESOURCE_BODY_OR_QUERY_PARAMETER_NAME,
} from "../../utils/Constants";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";

/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/CloudShellManagedIdentitySource.cs
 */
export class CloudShell extends BaseManagedIdentitySource {
    private msiEndpoint: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        msiEndpoint: string,
        systemAssigned: boolean
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.msiEndpoint = msiEndpoint;

        if (!systemAssigned) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.unableToCreateCloudShell
            );
        }
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        systemAssigned: boolean
    ): CloudShell | null {
        const [areEnvironmentVariablesValidated, msiEndpoint]: [
            boolean,
            string | undefined
        ] = validateEnvironmentVariables(
            process.env[ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT],
            logger
        );

        return areEnvironmentVariablesValidated
            ? new CloudShell(
                  logger,
                  nodeStorage,
                  networkClient,
                  cryptoProvider,
                  msiEndpoint as string,
                  systemAssigned
              )
            : null;
    }

    public createRequest(resource: string): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.POST,
                this.msiEndpoint
            );

        request.headers[METADATA_HEADER_NAME] = "true";

        request.bodyParameters[RESOURCE_BODY_OR_QUERY_PARAMETER_NAME] =
            resource;

        return request;
    }
}

const validateEnvironmentVariables = (
    msiEndpoint: string | undefined,
    logger: Logger
): [boolean, string | undefined] => {
    /*
     * if either of the identity endpoint, identity header, or identity server thumbprint
     * environment variables are undefined, this MSI provider is unavailable.
     */
    if (!msiEndpoint) {
        logger.info(
            `[Managed Identity] ${ManagedIdentitySourceNames.CLOUD_SHELL} managed identity is unavailable because the '${ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT} environment variable is not defined.`
        );
        return [false, undefined];
    }

    const validatedMsiEndpoint: string =
        CloudShell.getValidatedEnvVariableUrlString(
            ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT,
            msiEndpoint,
            ManagedIdentitySourceNames.CLOUD_SHELL,
            logger
        );

    logger.info(
        `[Managed Identity] Environment variables validation passed for ${ManagedIdentitySourceNames.CLOUD_SHELL} managed identity. Endpoint URI: ${validatedMsiEndpoint}. Creating ${ManagedIdentitySourceNames.CLOUD_SHELL} managed identity.`
    );
    return [true, validatedMsiEndpoint];
};
