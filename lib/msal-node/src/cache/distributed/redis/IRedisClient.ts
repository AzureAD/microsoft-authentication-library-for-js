/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// TODO: Replace the any in this interface
export interface IRedisClient {
    get(key: string, callback: (err: Error | undefined, data: any) => void): Promise<any>
    set(key: string, value: any, callback: (err: Error | undefined, data: any) => void): Promise<void>
}
