/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    Authority,
    ClientAuthErrorCodes,
    Constants,
    HeaderNames,
    INetworkModule,
    Logger,
    NetworkRequestOptions,
    NetworkResponse,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    TimeUtils,
    createClientAuthError,
    AuthenticationResult,
    UrlString,
} from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { ManagedIdentityRequest } from "../../request/ManagedIdentityRequest";
import { HttpMethod, ManagedIdentityIdType } from "../../utils/Constants";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";
import { NodeStorage } from "../../cache/NodeStorage";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";

/**
 * Managed Identity User Assigned Id Query Parameter Names
 */
export const ManagedIdentityUserAssignedIdQueryParameterNames = {
    MANAGED_IDENTITY_CLIENT_ID: "client_id",
    MANAGED_IDENTITY_OBJECT_ID: "object_id",
    MANAGED_IDENTITY_RESOURCE_ID: "mi_res_id",
} as const;
export type ManagedIdentityUserAssignedIdQueryParameterNames =
    (typeof ManagedIdentityUserAssignedIdQueryParameterNames)[keyof typeof ManagedIdentityUserAssignedIdQueryParameterNames];

export abstract class BaseManagedIdentitySource {
    protected logger: Logger;
    private nodeStorage: NodeStorage;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
    }

    abstract createRequest(
        request: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters;

    public async getServerTokenResponseAsync(
        response: NetworkResponse<ManagedIdentityTokenResponse>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _networkClient: INetworkModule,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _networkRequest: ManagedIdentityRequestParameters,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _networkRequestOptions: NetworkRequestOptions
    ): Promise<ServerAuthorizationTokenResponse> {
        return this.getServerTokenResponse(response);
    }

    public getServerTokenResponse(
        response: NetworkResponse<ManagedIdentityTokenResponse>
    ): ServerAuthorizationTokenResponse {
        let refreshIn, expiresIn: number | undefined;
        if (response.body.expires_on) {
            expiresIn = response.body.expires_on - TimeUtils.nowSeconds();

            // compute refresh_in as 1/2 of expires_in, but only if expires_in > 2h
            if (expiresIn > 2 * 3600) {
                refreshIn = expiresIn / 2;
            }
        }

        const serverTokenResponse: ServerAuthorizationTokenResponse = {
            status: response.status,

            // success
            access_token: response.body.access_token,
            expires_in: expiresIn,
            scope: response.body.resource,
            token_type: response.body.token_type,
            refresh_in: refreshIn,

            // error
            error: response.body.message,
            correlation_id: response.body.correlationId,
        };

        return serverTokenResponse;
    }

    public async acquireTokenWithManagedIdentity(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId,
        fakeAuthority: Authority,
        refreshAccessToken?: boolean
    ): Promise<AuthenticationResult> {
        const networkRequest: ManagedIdentityRequestParameters =
            this.createRequest(
                managedIdentityRequest.resource,
                managedIdentityId
            );

        const headers: Record<string, string> = networkRequest.headers;
        headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;

        const networkRequestOptions: NetworkRequestOptions = { headers };

        if (Object.keys(networkRequest.bodyParameters).length) {
            networkRequestOptions.body =
                networkRequest.computeParametersBodyString();
        }

        const reqTimestamp = TimeUtils.nowSeconds();
        let response: NetworkResponse<ManagedIdentityTokenResponse>;
        try {
            // Sources that send POST requests: Cloud Shell
            if (networkRequest.httpMethod === HttpMethod.POST) {
                response =
                    await this.networkClient.sendPostRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
                // Sources that send GET requests: App Service, Azure Arc, IMDS, Service Fabric
            } else {
                response =
                    await this.networkClient.sendGetRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            } else {
                throw createClientAuthError(ClientAuthErrorCodes.networkError);
            }
        }

        const responseHandler = new ResponseHandler(
            managedIdentityId.id,
            this.nodeStorage,
            this.cryptoProvider,
            this.logger,
            null,
            null
        );

        const serverTokenResponse: ServerAuthorizationTokenResponse =
            await this.getServerTokenResponseAsync(
                response,
                this.networkClient,
                networkRequest,
                networkRequestOptions
            );

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            refreshAccessToken
        );

        // caches the token
        return responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            fakeAuthority,
            reqTimestamp,
            managedIdentityRequest
        );
    }

    public getManagedIdentityUserAssignedIdQueryParameterKey(
        managedIdentityIdType: ManagedIdentityIdType
    ): string {
        switch (managedIdentityIdType) {
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned client id to the request."
                );
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID;

            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned resource id to the request."
                );
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID;

            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned object id to the request."
                );
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_OBJECT_ID;
            default:
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                );
        }
    }

    public static getValidatedEnvVariableUrlString = (
        envVariableStringName: string,
        envVariable: string,
        sourceName: string,
        logger: Logger
    ): string => {
        try {
            return new UrlString(envVariable).urlString;
        } catch (error) {
            logger.info(
                `[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable is malformed.`
            );

            throw createManagedIdentityError(
                ManagedIdentityErrorCodes
                    .MsiEnvironmentVariableUrlMalformedErrorCodes[
                    envVariableStringName
                ]
            );
        }
    };
}
