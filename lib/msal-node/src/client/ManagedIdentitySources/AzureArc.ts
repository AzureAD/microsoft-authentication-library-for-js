/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    ClientAuthErrorCodes,
    createClientAuthError,
    HttpStatus,
    INetworkModule,
    NetworkResponse,
    NetworkRequestOptions,
    Logger,
    ServerAuthorizationTokenResponse,
} from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";
import {
    API_VERSION_QUERY_PARAMETER_NAME,
    AUTHORIZATION_HEADER_NAME,
    HttpMethod,
    METADATA_HEADER_NAME,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentityIdType,
    ManagedIdentitySourceNames,
    RESOURCE_QUERY_PARAMETER_NAME,
} from "../../utils/Constants";
import { NodeStorage } from "../../cache/NodeStorage";
import { readFileSync } from "fs";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";

export const ARC_API_VERSION: string = "2019-11-01";

/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/AzureArcManagedIdentitySource.cs
 */
export class AzureArc extends BaseManagedIdentitySource {
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
    ): AzureArc | null {
        const imdsEndpoint: string | undefined =
            process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT];

        const [areEnvironmentVariablesValidated, identityEndpoint]: [
            boolean,
            string | undefined
        ] = validateEnvironmentVariables(
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ] || undefined,
            imdsEndpoint,
            logger
        );

        return areEnvironmentVariablesValidated
            ? new AzureArc(
                  logger,
                  nodeStorage,
                  networkClient,
                  cryptoProvider,
                  identityEndpoint as string
              )
            : null;
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        if (
            managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED
        ) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.unableToCreateAzureArc
            );
        }

        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.GET,
                this.identityEndpoint.replace("localhost", "127.0.0.1")
            );

        request.headers[METADATA_HEADER_NAME] = "true";

        request.queryParameters[API_VERSION_QUERY_PARAMETER_NAME] =
            ARC_API_VERSION;
        request.queryParameters[RESOURCE_QUERY_PARAMETER_NAME] = resource;

        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity

        return request;
    }

    public async getServerTokenResponseAsync(
        originalResponse: NetworkResponse<ManagedIdentityTokenResponse>,
        networkClient: INetworkModule,
        networkRequest: ManagedIdentityRequestParameters,
        networkRequestOptions: NetworkRequestOptions
    ): Promise<ServerAuthorizationTokenResponse> {
        let retryResponse:
            | NetworkResponse<ManagedIdentityTokenResponse>
            | undefined;

        if (originalResponse.status === HttpStatus.UNAUTHORIZED) {
            const wwwAuthHeader: string =
                originalResponse.headers["www-authenticate"];
            if (!wwwAuthHeader) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing
                );
            }
            if (!wwwAuthHeader.includes("Basic realm=")) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat
                );
            }

            const secretFile = wwwAuthHeader.split("Basic realm=")[1];
            let secret;
            try {
                secret = readFileSync(secretFile, "utf-8");
            } catch (e) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.unableToReadSecretFile
                );
            }
            const authHeaderValue = `Basic ${secret}`;

            this.logger.info(
                `[Managed Identity] Adding authorization header to the request.`
            );
            networkRequest.headers[AUTHORIZATION_HEADER_NAME] = authHeaderValue;

            try {
                retryResponse =
                    await networkClient.sendGetRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            } catch (error) {
                if (error instanceof AuthError) {
                    throw error;
                } else {
                    throw createClientAuthError(
                        ClientAuthErrorCodes.networkError
                    );
                }
            }
        }

        return this.getServerTokenResponse(retryResponse || originalResponse);
    }
}

const validateEnvironmentVariables = (
    identityEndpoint: string | undefined,
    imdsEndpoint: string | undefined,
    logger: Logger
): [boolean, string | undefined] => {
    // if either of the identity or imds endpoints are undefined, this MSI provider is unavailable.
    if (!identityEndpoint || !imdsEndpoint) {
        logger.info(
            `[Managed Identity] ${ManagedIdentitySourceNames.AZURE_ARC} managed identity is unavailable because one or both of the '${ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' and '${ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT}' environment variables are not defined.`
        );
        return [false, undefined];
    }

    const validatedIdentityEndpoint: string =
        AzureArc.getValidatedEnvVariableUrlString(
            ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
            identityEndpoint,
            ManagedIdentitySourceNames.AZURE_ARC,
            logger
        );

    AzureArc.getValidatedEnvVariableUrlString(
        ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT,
        imdsEndpoint,
        ManagedIdentitySourceNames.AZURE_ARC,
        logger
    );

    logger.info(
        `[Managed Identity] Environment variables validation passed for ${ManagedIdentitySourceNames.AZURE_ARC} managed identity. Endpoint URI: ${validatedIdentityEndpoint}. Creating ${ManagedIdentitySourceNames.AZURE_ARC} managed identity.`
    );
    return [
        true,
        // remove trailing slash
        validatedIdentityEndpoint.endsWith("/")
            ? validatedIdentityEndpoint.slice(0, -1)
            : validatedIdentityEndpoint,
    ];
};
