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
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
} from "./StringConstants";

export class ManagedIdentityTestUtils {
    static isAppService(): boolean {
        return (
            // !! converts to boolean
            !!process.env["IDENTITY_ENDPOINT"] &&
            !!process.env["IDENTITY_HEADER"]
        );
    }

    static isIMDS(): boolean {
        return !ManagedIdentityTestUtils.isAppService();
    }

    static getManagedIdentityNetworkClient(clientId: string) {
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
                            expires_on: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                            resource: MANAGED_IDENTITY_RESOURCE,
                            token_type: AuthenticationScheme.BEARER,
                        },
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
                            expires_on: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                            resource: MANAGED_IDENTITY_RESOURCE,
                            token_type: AuthenticationScheme.BEARER,
                        },
                    } as NetworkResponse<T>);
                });
            }
        })();
    }
}
