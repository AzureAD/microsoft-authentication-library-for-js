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
    AZURE_ARC_SECRET_FILE_MAX_SIZE_BYTES,
    HttpMethod,
    METADATA_HEADER_NAME,
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentityIdType,
    ManagedIdentitySourceNames,
    RESOURCE_BODY_OR_QUERY_PARAMETER_NAME,
} from "../../utils/Constants";
import { NodeStorage } from "../../cache/NodeStorage";
import { readFileSync, statSync } from "fs";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import path from "path";

export const ARC_API_VERSION: string = "2019-11-01";

export const SUPPORTED_AZURE_ARC_PLATFORMS = {
    win32: `${process.env["ProgramData"]}\\AzureConnectedMachineAgent\\Tokens\\`,
    linux: "/var/opt/azcmagent/tokens/",
};

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

    public static getEnvironmentVariables(): Array<string | undefined> {
        const identityEndpoint: string | undefined =
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];
        const imdsEndpoint: string | undefined =
            process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT];

        return [identityEndpoint, imdsEndpoint];
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        managedIdentityId: ManagedIdentityId
    ): AzureArc | null {
        const [identityEndpoint, imdsEndpoint] =
            AzureArc.getEnvironmentVariables();

        // if either of the identity or imds endpoints are undefined, this MSI provider is unavailable.
        if (!identityEndpoint || !imdsEndpoint) {
            logger.info(
                `[Managed Identity] ${ManagedIdentitySourceNames.AZURE_ARC} managed identity is unavailable because one or both of the '${ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' and '${ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT}' environment variables are not defined.`
            );
            return null;
        }

        const validatedIdentityEndpoint: string =
            AzureArc.getValidatedEnvVariableUrlString(
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
                identityEndpoint,
                ManagedIdentitySourceNames.AZURE_ARC,
                logger
            );
        // remove trailing slash
        validatedIdentityEndpoint.endsWith("/")
            ? validatedIdentityEndpoint.slice(0, -1)
            : validatedIdentityEndpoint;

        AzureArc.getValidatedEnvVariableUrlString(
            ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT,
            imdsEndpoint,
            ManagedIdentitySourceNames.AZURE_ARC,
            logger
        );

        logger.info(
            `[Managed Identity] Environment variables validation passed for ${ManagedIdentitySourceNames.AZURE_ARC} managed identity. Endpoint URI: ${validatedIdentityEndpoint}. Creating ${ManagedIdentitySourceNames.AZURE_ARC} managed identity.`
        );

        if (
            managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED
        ) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.unableToCreateAzureArc
            );
        }

        return new AzureArc(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            identityEndpoint
        );
    }

    public createRequest(resource: string): ManagedIdentityRequestParameters {
        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.GET,
                this.identityEndpoint.replace("localhost", "127.0.0.1")
            );

        request.headers[METADATA_HEADER_NAME] = "true";

        request.queryParameters[API_VERSION_QUERY_PARAMETER_NAME] =
            ARC_API_VERSION;
        request.queryParameters[RESOURCE_BODY_OR_QUERY_PARAMETER_NAME] =
            resource;

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

            const secretFilePath = wwwAuthHeader.split("Basic realm=")[1];

            // throw an error if the managed identity application is not being run on Windows or Linux
            if (
                !SUPPORTED_AZURE_ARC_PLATFORMS.hasOwnProperty(process.platform)
            ) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.platformNotSupported
                );
            }

            // get the expected Windows or Linux file path)
            const expectedSecretFilePath: string =
                SUPPORTED_AZURE_ARC_PLATFORMS[process.platform as string];

            // throw an error if the file in the file path is not a .key file
            const fileName: string = path.basename(secretFilePath);
            if (!fileName.endsWith(".key")) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidFileExtension
                );
            }

            /*
             * throw an error if the file path from the www-authenticate header does not match the
             * expected file path for the platform (Windows or Linux) the managed identity application
             * is running on
             */
            if (expectedSecretFilePath + fileName !== secretFilePath) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidFilePath
                );
            }

            let secretFileSize;
            // attempt to get the secret file's size, in bytes
            try {
                secretFileSize = await statSync(secretFilePath).size;
            } catch (e) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.unableToReadSecretFile
                );
            }
            // throw an error if the secret file's size is greater than 4096 bytes
            if (secretFileSize > AZURE_ARC_SECRET_FILE_MAX_SIZE_BYTES) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidSecret
                );
            }

            // attempt to read the contents of the secret file
            let secret;
            try {
                secret = readFileSync(secretFilePath, "utf-8");
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
