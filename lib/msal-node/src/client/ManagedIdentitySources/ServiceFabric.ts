/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger, UrlString } from "@azure/msal-common";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import {
    HttpMethod,
    MANAGED_IDENTITY_ENDPOINT,
    MANAGED_IDENTITY_HEADER,
    MANAGED_IDENTITY_SERVER_THUMBPRINT,
    MANAGED_IDENTITY_CLIENT_ID,
    MANAGED_IDENTITY_OBJECT_ID,
    MANAGED_IDENTITY_RESOURCE_ID,
    MANAGED_IDENTITY_API_VERSION,
    MANAGED_IDENTITY_RESOURCE,
    ManagedIdentityIdType,
    SECRET_HEADER_NAME,
} from "../../utils/Constants";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";
import { NodeStorage } from "../../cache/NodeStorage";

const SERVICE_FABRIC_MSI_API_VERSION: string = "2019-07-01-preview";

export class ServiceFabric extends BaseManagedIdentitySource {
    private endpoint: string;
    private identityHeader: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        endpoint: string,
        identityHeader: string
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.endpoint = endpoint;
        this.identityHeader = identityHeader;
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): ServiceFabric | null {
        const [areEnvironmentVariablesValidated, endpoint, identityHeader]: [
            boolean,
            string | undefined,
            string | undefined
        ] = validateEnvironmentVariables(
            process.env[MANAGED_IDENTITY_ENDPOINT] || undefined,
            process.env[MANAGED_IDENTITY_HEADER] || undefined,
            process.env[MANAGED_IDENTITY_SERVER_THUMBPRINT] || undefined,
            logger
        );

        return areEnvironmentVariablesValidated
            ? new ServiceFabric(
                  logger,
                  nodeStorage,
                  networkClient,
                  cryptoProvider,
                  endpoint as string,
                  identityHeader as string
              )
            : null;
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(HttpMethod.GET, this.endpoint);

        request.headers[SECRET_HEADER_NAME] = this.identityHeader;
        request.queryParameters[MANAGED_IDENTITY_API_VERSION] =
            SERVICE_FABRIC_MSI_API_VERSION;
        request.queryParameters[MANAGED_IDENTITY_RESOURCE] = resource;
        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity

        switch (managedIdentityId.idType) {
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned client id to the request."
                );
                request.queryParameters[MANAGED_IDENTITY_CLIENT_ID] =
                    managedIdentityId.id;
                break;

            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned resource id to the request."
                );
                request.queryParameters[MANAGED_IDENTITY_RESOURCE_ID] =
                    managedIdentityId.id;
                break;

            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned object id to the request."
                );
                request.queryParameters[MANAGED_IDENTITY_OBJECT_ID] =
                    managedIdentityId.id;
                break;
        }

        return request;
    }
}

const validateEnvironmentVariables = (
    endpoint: string | undefined,
    header: string | undefined,
    thumbPrint: string | undefined,
    logger: Logger
): [boolean, string | undefined, string | undefined] => {
    let endpointUrlString: string | undefined;

    if (
        !validateVariable(endpoint, logger) ||
        !validateVariable(header, logger) ||
        !validateVariable(thumbPrint, logger)
    ) {
        return [false, undefined, undefined];
    }

    try {
        endpointUrlString = new UrlString(endpoint as string).urlString;
    } catch (error) {
        logger.info(
            `[Managed Identity] Service Fabric managed identity is unavailable because the 'MANAGED_IDENTITY_MSI_ENDPOINT' environment variable is malformed.`
        );

        throw createManagedIdentityError(
            ManagedIdentityErrorCodes.urlParseError
        );
    }

    logger.info(
        `[Managed Identity] Environment variables validation passed for Cloud Shell managed identity. Endpoint URI: ${endpointUrlString}. Creating Cloud Shell managed identity.`
    );
    return [true, endpointUrlString, header];
};

const validateVariable = (
    variable: string | undefined,
    logger: Logger
): boolean => {
    if (!variable) {
        logger.info(
            `[Managed Identity] Service Fabric managed identity is unavailable because the '${variable}' environment variable is missing.`
        );
        return false;
    }
    return true;
};
