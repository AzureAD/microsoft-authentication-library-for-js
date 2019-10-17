/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ICacheStorage {
    setItem(key: string, value: string): void,
    getItem(key: string): string,
    removeItem(key: string): void,
    containsKey(key: string): boolean,
    getKeys(): string[],
    clear(): void
}
