/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Client network interface to send requests.
 * @hidden
 */

export interface INetworkModule {
    sendRequestAsync(url: string, method: string, enableCaching?:boolean): Promise<any>
}
