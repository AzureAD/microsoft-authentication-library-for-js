/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    HttpStatus,
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
    TimeUtils,
} from "@azure/msal-common";
import {
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_ID,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
} from "./StringConstants";
import { ManagedIdentityTokenResponse } from "../../src/response/ManagedIdentityTokenResponse";
import { ManagedIdentityRequestParams } from "../../src";
import { ManagedIdentityConfiguration } from "../../src/config/Configuration";
import { mockAuthenticationResult } from "../utils/TestConstants";

const EMPTY_HEADERS: Record<string, string> = {};

export class ManagedIdentityNetworkClient implements INetworkModule {
    private clientId: string;
    private resource: string | undefined;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    sendGetRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions,
        _timeout?: number
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: HttpStatus.SUCCESS,
                body: {
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    client_id: this.clientId,
                    expires_on:
                        TimeUtils.nowSeconds() +
                        TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 3, // 3 hours in the future
                    resource: MANAGED_IDENTITY_RESOURCE.replace(
                        "/.default",
                        ""
                    ),
                    token_type: AuthenticationScheme.BEARER,
                } as ManagedIdentityTokenResponse,
                headers: EMPTY_HEADERS,
            } as NetworkResponse<T>);
        });
    }

    sendPostRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: HttpStatus.SUCCESS,
                body: {
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    client_id: this.clientId,
                    expires_on:
                        TimeUtils.nowSeconds() +
                        TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 3, // 3 hours in the future
                    resource: (
                        this.resource || MANAGED_IDENTITY_RESOURCE
                    ).replace("/.default", ""),
                    token_type: AuthenticationScheme.BEARER,
                } as ManagedIdentityTokenResponse,
                headers: EMPTY_HEADERS,
            } as NetworkResponse<T>);
        });
    }
}

export class ManagedIdentityNetworkErrorClient implements INetworkModule {
    private wwwAuthenticateHeader: string | undefined;
    private status: number | undefined;

    constructor(wwwAuthenticateHeader?: string, status?: number) {
        this.wwwAuthenticateHeader = wwwAuthenticateHeader || undefined;
        this.status = status || undefined;
    }

    getSendGetRequestAsyncReturnObject<T>(
        wwwAuthenticateHeader: string | undefined,
        status?: number | undefined
    ): NetworkResponse<T> {
        const headers: Record<string, string> = {};
        if (wwwAuthenticateHeader) {
            headers["www-authenticate"] = wwwAuthenticateHeader;
        }

        return {
            status:
                status ||
                (wwwAuthenticateHeader
                    ? HttpStatus.UNAUTHORIZED
                    : HttpStatus.BAD_REQUEST),
            body: {
                message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                correlationId: mockAuthenticationResult.correlationId,
            } as ManagedIdentityTokenResponse,
            headers,
        } as NetworkResponse<T>;
    }

    sendGetRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions,
        _timeout?: number
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve(
                this.getSendGetRequestAsyncReturnObject(
                    this.wwwAuthenticateHeader,
                    this.status
                )
            );
        });
    }

    sendGetRequestForRetryAsync<T>(
        errorResponse: ManagedIdentityTokenResponse,
        // optional retry-after header
        headers?: Record<string, string>,
        httpStatusCode?: HttpStatus
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: httpStatusCode || HttpStatus.SERVER_ERROR,
                body: errorResponse,
                headers: headers || EMPTY_HEADERS,
            } as NetworkResponse<T>);
        });
    }

    sendPostRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: HttpStatus.BAD_REQUEST,
                body: {
                    message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                    correlationId: mockAuthenticationResult.correlationId,
                } as ManagedIdentityTokenResponse,
                headers: EMPTY_HEADERS,
            } as NetworkResponse<T>);
        });
    }
}

export const managedIdentityRequestParams: ManagedIdentityRequestParams = {
    resource: MANAGED_IDENTITY_RESOURCE,
};

export const networkClient: ManagedIdentityNetworkClient =
    new ManagedIdentityNetworkClient(MANAGED_IDENTITY_RESOURCE_ID);

export const userAssignedClientIdConfig: ManagedIdentityConfiguration = {
    system: {
        networkClient,
    },
    managedIdentityIdParams: {
        userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
    },
};

export const systemAssignedConfig: ManagedIdentityConfiguration = {
    system: {
        networkClient,
        // managedIdentityIdParams will be omitted for system assigned
    },
};
