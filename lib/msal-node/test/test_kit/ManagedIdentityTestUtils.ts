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
}

export class ManagedIdentityNetworkClient implements INetworkModule {
    private clientId: string;
    private resource: string | undefined;

    constructor(clientId: string, resource?: string | undefined) {
        this.clientId = clientId;
        this.resource = resource || undefined;
    }

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
                    client_id: this.clientId,
                    expires_on: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 3, // 3 hours
                    resource: (
                        this.resource || MANAGED_IDENTITY_RESOURCE
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
                    client_id: this.clientId,
                    expires_on: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 3, // 3 hours
                    resource: (
                        this.resource || MANAGED_IDENTITY_RESOURCE
                    ).replace("/.default", ""),
                    token_type: AuthenticationScheme.BEARER,
                } as ManagedIdentityTokenResponse,
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
            headers["WWW-Authenticate"] = wwwAuthenticateHeader;
        }

        return {
            status:
                status ||
                (wwwAuthenticateHeader
                    ? HttpStatus.UNAUTHORIZED
                    : HttpStatus.CLIENT_ERROR_RANGE_START),
            body: {
                message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                correlationId: DEFAULT_MANAGED_IDENTITY_ID,
            } as ManagedIdentityTokenResponse,
            headers,
        } as NetworkResponse<T>;
    }

    sendGetRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions,
        _cancellationToken?: number
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

    sendPostRequestAsync<T>(
        _url: string,
        _options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, _reject) => {
            resolve({
                status: HttpStatus.CLIENT_ERROR_RANGE_START,
                body: {
                    message: MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
                    correlationId: DEFAULT_MANAGED_IDENTITY_ID,
                } as ManagedIdentityTokenResponse,
            } as NetworkResponse<T>);
        });
    }
}
