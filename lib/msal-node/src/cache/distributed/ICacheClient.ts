/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ICacheClient {
    get(key: string): Promise<string>
    set(key: string, value: string): Promise<string>
}
