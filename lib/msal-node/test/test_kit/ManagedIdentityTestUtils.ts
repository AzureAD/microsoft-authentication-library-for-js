/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
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
    static getManagedIdentityNetworkClient(clientId: string) {
        return new (class CustomHttpClient implements INetworkModule {
            sendGetRequestAsync<T>(
                _url: string,
                _options?: NetworkRequestOptions,
                _cancellationToken?: number
            ): Promise<NetworkResponse<T>> {
                console.log("Get Method not implemented.");
                throw new Error("Get Method not implemented.");
            }

            sendPostRequestAsync<T>(
                _url: string,
                _options?: NetworkRequestOptions
            ): Promise<NetworkResponse<T>> {
                return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                    resolve({
                        status: 200,
                        body: {
                            client_id: clientId,
                            expires_on: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                            resource: MANAGED_IDENTITY_RESOURCE,
                            access_token: TEST_TOKENS.ACCESS_TOKEN,
                        },
                    } as NetworkResponse<T>);
                });
            }
        })();
    }
}
