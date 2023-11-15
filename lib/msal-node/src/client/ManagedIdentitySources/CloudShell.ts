/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger, UrlString } from "@azure/msal-common";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import {
    MANAGED_IDENTITY_MSI_ENDPOINT,
    HttpMethod,
} from "../../utils/Constants";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";
import { NodeStorage } from "../../cache/NodeStorage";

export class CloudShell extends BaseManagedIdentitySource {
    private endpoint: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        endpoint: string
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.endpoint = endpoint;
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): CloudShell | null {
        const [areEnvironmentVariablesValidated, endpoint]: [
            boolean,
            string | undefined
        ] = validateEnvironmentVariables(
            process.env[MANAGED_IDENTITY_MSI_ENDPOINT] || undefined,
            logger
        );

        return areEnvironmentVariablesValidated
            ? new CloudShell(
                  logger,
                  nodeStorage,
                  networkClient,
                  cryptoProvider,
                  endpoint as string
              )
            : null;
    }

    public createRequest(): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.POST,
                this.endpoint
            );

        request.headers["ContentType"] = "application/x-www-form-urlencoded";
        request.headers["Metadata"] = "true";
        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity

        return request;
    }
}

const validateEnvironmentVariables = (
    endpoint: string | undefined,
    logger: Logger
): [boolean, string | undefined] => {
    let endpointUrlString: string | undefined;

    // if ONLY the env var MSI_ENDPOINT is set the Msi type is CloudShell
    if (!endpoint) {
        logger.info(
            `[Managed Identity] Cloud Shell managed identity is unavailable because the 'MANAGED_IDENTITY_MSI_ENDPOINT' environment variable is missing.`
        );
        return [false, undefined];
    }

    try {
        endpointUrlString = new UrlString(endpoint).urlString;
    } catch (error) {
        logger.info(
            `[Managed Identity] Cloud Shell managed identity is unavailable because the 'MANAGED_IDENTITY_MSI_ENDPOINT' environment variable is malformed.`
        );

        throw createManagedIdentityError(
            ManagedIdentityErrorCodes.urlParseError
        );
    }

    logger.info(
        `[Managed Identity] Environment variables validation passed for Cloud Shell managed identity. Endpoint URI: ${endpointUrlString}. Creating Cloud Shell managed identity.`
    );
    return [true, endpointUrlString];
};
