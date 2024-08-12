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
import {
    accessSync,
    constants as fsConstants,
    readFileSync,
    statSync,
} from "fs";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import path from "path";

export const ARC_API_VERSION: string = "2019-11-01";
export const DEFAULT_AZURE_ARC_IDENTITY_ENDPOINT: string =
    "http://127.0.0.1:40342/metadata/identity/oauth2/token";
const HIMDS_EXECUTABLE_HELPER_STRING = "N/A: himds executable exists";

type FilePathMap = {
    win32: string;
    linux: string;
};

export const SUPPORTED_AZURE_ARC_PLATFORMS: FilePathMap = {
    win32: `${process.env["ProgramData"]}\\AzureConnectedMachineAgent\\Tokens\\`,
    linux: "/var/opt/azcmagent/tokens/",
};

export const AZURE_ARC_FILE_DETECTION: FilePathMap = {
    win32: `${process.env["ProgramFiles"]}\\AzureConnectedMachineAgent\\himds.exe`,
    linux: "/opt/azcmagent/bin/himds",
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
        let identityEndpoint: string | undefined =
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];
        let imdsEndpoint: string | undefined =
            process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT];

        // if either of the identity or imds endpoints are undefined, check if the himds executable exists
        if (!identityEndpoint || !imdsEndpoint) {
            // get the expected Windows or Linux file path of the himds executable
            const fileDetectionPath: string =
                AZURE_ARC_FILE_DETECTION[process.platform as keyof FilePathMap];
            try {
                /*
                 * check if the himds executable exists and its permissions allow it to be read
                 * returns undefined if true, throws an error otherwise
                 */
                accessSync(
                    fileDetectionPath,
                    fsConstants.F_OK | fsConstants.R_OK
                );

                identityEndpoint = DEFAULT_AZURE_ARC_IDENTITY_ENDPOINT;
                imdsEndpoint = HIMDS_EXECUTABLE_HELPER_STRING;
            } catch (err) {
                /*
                 * do nothing
                 * accessSync returns undefined on success, and throws an error on failure
                 */
            }
        }

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

        // if either of the identity or imds endpoints are undefined (even after himds file detection)
        if (!identityEndpoint || !imdsEndpoint) {
            logger.info(
                `[Managed Identity] ${ManagedIdentitySourceNames.AZURE_ARC} managed identity is unavailable through environment variables because one or both of '${ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' and '${ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT}' are not defined. ${ManagedIdentitySourceNames.AZURE_ARC} managed identity is also unavailable through file detection.`
            );

            return null;
        }

        // check if the imds endpoint is set to the default for file detection
        if (imdsEndpoint === HIMDS_EXECUTABLE_HELPER_STRING) {
            logger.info(
                `[Managed Identity] ${ManagedIdentitySourceNames.AZURE_ARC} managed identity is available through file detection. Defaulting to known ${ManagedIdentitySourceNames.AZURE_ARC} endpoint: ${DEFAULT_AZURE_ARC_IDENTITY_ENDPOINT}. Creating ${ManagedIdentitySourceNames.AZURE_ARC} managed identity.`
            );
        } else {
            // otherwise, both the identity and imds endpoints are defined without file detection; validate them

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
        }

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

            // get the expected Windows or Linux file path
            const expectedSecretFilePath: string =
                SUPPORTED_AZURE_ARC_PLATFORMS[
                    process.platform as keyof FilePathMap
                ];

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
