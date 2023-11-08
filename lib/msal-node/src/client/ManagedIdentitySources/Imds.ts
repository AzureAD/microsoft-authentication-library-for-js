/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheManager, INetworkModule, Logger } from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import {
    HttpMethod,
    MANAGED_IDENTITY_CLIENT_ID,
    MANAGED_IDENTITY_OBJECT_ID,
    MANAGED_IDENTITY_RESOURCE_ID,
    METADATA_HEADER_NAME,
    ManagedIdentityIdType,
} from "../../utils/Constants";

// IMDS constants. Docs for IMDS are available here https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/how-to-use-vm-token#get-a-token-using-http
const DEFAULT_IMDS_ENDPOINT: string =
    "http://169.254.169.254/metadata/identity/oauth2/token";
const IMDS_TOKEN_PATH: string = "/metadata/identity/oauth2/token";
const IMDS_API_VERSION: string = "2018-02-01";

// Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ImdsManagedIdentitySource.cs
export class Imds extends BaseManagedIdentitySource {
    private endpoint: string;

    constructor(
        logger: Logger,
        cacheManager: CacheManager,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        endpoint: string
    ) {
        super(logger, cacheManager, networkClient, cryptoProvider);

        this.endpoint = endpoint;
    }

    public static tryCreate(
        logger: Logger,
        cacheManager: CacheManager,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): Imds {
        let endpoint: string;

        if (process.env["AZURE_POD_IDENTITY_AUTHORITY_HOST"]) {
            logger.info(
                `[Managed Identity] Environment variable AZURE_POD_IDENTITY_AUTHORITY_HOST for IMDS returned endpoint: ${process.env["AZURE_POD_IDENTITY_AUTHORITY_HOST"]}`
            );
            endpoint = `${process.env["AZURE_POD_IDENTITY_AUTHORITY_HOST"]}${IMDS_TOKEN_PATH}`;
        } else {
            logger.info(
                "[Managed Identity] Unable to find AZURE_POD_IDENTITY_AUTHORITY_HOST environment variable for IMDS, using the default endpoint."
            );
            endpoint = DEFAULT_IMDS_ENDPOINT;
        }

        return new Imds(
            logger,
            cacheManager,
            networkClient,
            cryptoProvider,
            endpoint
        );
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(HttpMethod.GET, this.endpoint);

        request.headers[METADATA_HEADER_NAME] = "true";
        request.queryParameters["api-version"] = IMDS_API_VERSION;
        request.queryParameters["resource"] = resource;
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
