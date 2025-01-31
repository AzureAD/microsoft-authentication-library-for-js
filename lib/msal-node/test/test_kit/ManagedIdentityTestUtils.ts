/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    HttpStatus,
    INetworkModule,
    NetworkResponse,
    TimeUtils,
} from "@azure/msal-common";
import {
    MANAGED_IDENTITY_NETWORK_REQUEST_500_ERROR,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_ID,
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
} from "./StringConstants.js";
import { ManagedIdentityTokenResponse } from "../../src/response/ManagedIdentityTokenResponse.js";
import { ManagedIdentityRequestParams } from "../../src/request/ManagedIdentityRequestParams.js";
import { ManagedIdentityConfiguration } from "../../src/config/Configuration.js";

const EMPTY_HEADERS: Record<string, string> = {};

export class ManagedIdentityNetworkClient implements INetworkModule {
    private clientId: string;
    private resource: string | undefined;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    // App Service, Azure Arc, Imds, Service Fabric
    sendGetRequestAsync<T>(): Promise<NetworkResponse<T>> {
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

    // Cloud Shell
    sendPostRequestAsync<T>(): Promise<NetworkResponse<T>> {
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
    private errorResponse: ManagedIdentityTokenResponse;
    private headers: Record<string, string>;
    private status: number;

    constructor(
        errorResponse?: ManagedIdentityTokenResponse,
        headers?: Record<string, string>,
        status?: number
    ) {
        // default to 500 error
        this.errorResponse =
            errorResponse || MANAGED_IDENTITY_NETWORK_REQUEST_500_ERROR;
        this.headers = headers || EMPTY_HEADERS;
        this.status = status || HttpStatus.SERVER_ERROR;
    }

    // App Service, Azure Arc, Imds, Service Fabric
    sendGetRequestAsync<T>(): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: this.status,
                body: this.errorResponse,
                headers: this.headers,
            } as NetworkResponse<T>);
        });
    }

    // Cloud Shell
    sendPostRequestAsync<T>(): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: this.status,
                body: this.errorResponse,
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

export const userAssignedResourceIdConfig: ManagedIdentityConfiguration = {
    system: {
        networkClient,
    },
    managedIdentityIdParams: {
        userAssignedResourceId: MANAGED_IDENTITY_RESOURCE_ID,
    },
};

export const systemAssignedConfig: ManagedIdentityConfiguration = {
    system: {
        networkClient,
        // managedIdentityIdParams will be omitted for system assigned
    },
};
