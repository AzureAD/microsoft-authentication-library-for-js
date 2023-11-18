/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";
import {
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
} from "./StringConstants";
import { DEFAULT_MANAGED_IDENTITY_ID } from "../../src/utils/Constants";
import { ManagedIdentityTokenResponse } from "../../src/response/ManagedIdentityTokenResponse";

export class ManagedIdentityTestUtils {
    static isAppService(): boolean {
        return (
            // !! converts to boolean
            !!process.env["IDENTITY_ENDPOINT"] &&
            !!process.env["IDENTITY_HEADER"]
        );
    }

    static isAzureArc(): boolean {
        return (
            // !! converts to boolean
            !!process.env["IDENTITY_ENDPOINT"] && !!process.env["IMDS_ENDPOINT"]
        );
    }

    static isIMDS(): boolean {
        return !ManagedIdentityTestUtils.isAppService();
    }

    static getManagedIdentityNetworkClient(
        clientId: string,
        resource?: string
    ) {
        return new (class CustomHttpClient implements INetworkModule {
            sendGetRequestAsync<T>(
                _url: string,
                _options?: NetworkRequestOptions,
                _cancellationToken?: number
            ): Promise<NetworkResponse<T>> {
                return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                    resolve({
                        status: 200,
                        body: {
                            access_token: TEST_TOKENS.ACCESS_TOKEN,
                            client_id: clientId,
                            expires_on:
                                TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 3, // 3 hours
                            resource: (
                                resource || MANAGED_IDENTITY_RESOURCE
                            ).replace("/.default", ""),
                            token_type: AuthenticationScheme.BEARER,
                        } as ManagedIdentityTokenResponse,
                    } as NetworkResponse<T>);
                });
            }

            sendPostRequestAsync<T>(
                _url: string,
                _options?: NetworkRequestOptions
            ): Promise<NetworkResponse<T>> {
                return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                    resolve({
                        status: 200,
                        body: {
                            access_token: TEST_TOKENS.ACCESS_TOKEN,
                            client_id: clientId,
                            expires_on:
                                TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 3, // 3 hours
                            resource: (
                                resource || MANAGED_IDENTITY_RESOURCE
                            ).replace("/.default", ""),
                            token_type: AuthenticationScheme.BEARER,
                        } as ManagedIdentityTokenResponse,
                    } as NetworkResponse<T>);
                });
            }
        })();
    }

    static getManagedIdentityNetworkErrorClient() {
        return new (class CustomHttpClient implements INetworkModule {
            sendGetRequestAsync<T>(
                _url: string,
                _options?: NetworkRequestOptions,
                _cancellationToken?: number
            ): Promise<NetworkResponse<T>> {
                return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                    resolve({
                        status: 400,
                        body: {
                            message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                            correlationId: DEFAULT_MANAGED_IDENTITY_ID,
                        } as ManagedIdentityTokenResponse,
                    } as NetworkResponse<T>);
                });
            }

            sendPostRequestAsync<T>(
                _url: string,
                _options?: NetworkRequestOptions
            ): Promise<NetworkResponse<T>> {
                return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                    resolve({
                        status: 400,
                        body: {
                            message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                            correlationId: DEFAULT_MANAGED_IDENTITY_ID,
                        } as ManagedIdentityTokenResponse,
                    } as NetworkResponse<T>);
                });
            }
        })();
    }

    static getManagedIdentityNetworkAzure401Client() {
        return new Azure401CustomHttpClient();
    }
}

export class Azure401CustomHttpClient implements INetworkModule {
    sendGetRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions,
        _cancellationToken?: number
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: 401,
                body: {
                    message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                    correlationId: DEFAULT_MANAGED_IDENTITY_ID,
                } as ManagedIdentityTokenResponse,
                headers: {
                    "WWW-Authenticate":
                        "Basic realm=lib/msal-node/test/test_kit/AzureArcSecret.key",
                } as Record<string, string>,
            } as NetworkResponse<T>);
        });
    }

    sendPostRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        throw Error("not implemented");
    }
}
