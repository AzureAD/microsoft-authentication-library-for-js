/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// TODO: Replace the any in this interface
export interface IPersistenceManager {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
}