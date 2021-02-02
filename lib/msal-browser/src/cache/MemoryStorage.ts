/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IWindowStorage } from "./IWindowStorage";

export class MemoryStorage implements IWindowStorage {

    private cache: Map<string, string>;

    constructor() {
        this.cache = new Map<string, string>();
    }

    getItem(key: string): string | null {
        return this.cache.get(key) || null;
    }

    setItem(key: string, value: string): void {
        this.cache.set(key, value);
    }

    removeItem(key: string): void {
        this.cache.delete(key);
    }

    getKeys(): string[] {
        const cacheKeys: string[] = [];
        this.cache.forEach((value: string, key: string) => {
            cacheKeys.push(key);
        });
        return cacheKeys;
    }

    containsKey(key: string): boolean {
        return this.cache.has(key);
    }

    clear() :void {
        this.cache.clear();
    }
}
