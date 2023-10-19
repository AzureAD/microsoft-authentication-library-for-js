/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CacheManager,
    INetworkModule,
    Logger,
    UrlString,
} from "@azure/msal-common";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import {
    HttpMethod,
    MANAGED_IDENTITY_CLIENT_ID,
    MANAGED_IDENTITY_OBJECT_ID,
    MANAGED_IDENTITY_RESOURCE_ID,
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

// MSI Constants. Docs for MSI are available here https://docs.microsoft.com/azure/app-service/overview-managed-identity
export const APP_SERVICE_MSI_API_VERSION: string = "2019-08-01";

/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/AppServiceManagedIdentitySource.cs
 */
export class AppService extends BaseManagedIdentitySource {
    private _endpoint: string;
    private _secret: string;

    constructor(
        logger: Logger,
        cacheManager: CacheManager,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        endpoint: string,
        secret: string
    ) {
        super(logger, cacheManager, networkClient, cryptoProvider);

        this._endpoint = endpoint;
        this._secret = secret;
    }

    public static tryCreate(
        logger: Logger,
        cacheManager: CacheManager,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): AppService | null {
        const secret: string | undefined = process.env["IdentityHeader"];

        const [areEnvironmentVariablesValidated, endpoint] =
            validateEnvironmentVariables(
                process.env["IdentityEndpoint"] || undefined,
                secret,
                logger
            );

        return areEnvironmentVariablesValidated
            ? new AppService(
                  logger,
                  cacheManager,
                  networkClient,
                  cryptoProvider,
                  endpoint as string,
                  secret as string
              )
            : null;
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.POST,
                this._endpoint
            );

        request.headers[SECRET_HEADER_NAME] = this._secret;
        request.queryParameters["api-version"] = APP_SERVICE_MSI_API_VERSION;
        request.queryParameters["resource"] = resource;
        // bodyParamters calculated in BaseManagedIdentity.authenticateWithMSI

        switch (managedIdentityId.getIdType) {
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned client id to the request."
                );
                request.queryParameters[MANAGED_IDENTITY_CLIENT_ID] =
                    managedIdentityId.getId;
                break;

            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned resource id to the request."
                );
                request.queryParameters[MANAGED_IDENTITY_RESOURCE_ID] =
                    managedIdentityId.getId;
                break;

            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned object id to the request."
                );
                request.queryParameters[MANAGED_IDENTITY_OBJECT_ID] =
                    managedIdentityId.getId;
                break;
        }

        return request;
    }
}

const validateEnvironmentVariables = (
    endpoint: string | undefined,
    secret: string | undefined,
    logger: Logger
): [boolean, string | undefined] => {
    let endpointUrlString: string | undefined;

    // if either of the endpoint or secret environment variables are undefined, this MSI provider is unavailable.
    if (!endpoint || !secret) {
        logger.info(
            "[Managed Identity] App service managed identity is unavailable because one or both of the 'IdentityHeader' and 'IdentityEndpoint' environment variables are missing."
        );
        return [false, endpointUrlString];
    }

    try {
        endpointUrlString = new UrlString(endpoint).urlString;
    } catch (error) {
        logger.info(
            "[Managed Identity] App service managed identity is unavailable because the 'IdentityEndpoint' environment variable is malformed."
        );

        throw createManagedIdentityError(
            ManagedIdentityErrorCodes.urlParseError
        );
    }

    logger.info(
        `[Managed Identity] Environment variables validation passed for app service managed identity. Endpoint URI: ${endpointUrlString}. Creating App Service managed identity.`
    );
    return [true, endpointUrlString];
};
