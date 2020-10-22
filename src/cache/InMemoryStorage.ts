/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IWindowStorage } from "./IWindowStorage";

export class InMemoryStorage implements IWindowStorage {

    private cache: Record<string, string>;

    constructor() {
        this.cache = {};
    }

    getItem(key: string): string {
        return this.cache[key];
    }

    setItem(key: string, value: string): void {
        this.cache[key] = value;
    }

    removeItem(key: string): void {
        delete this.cache[key];
    }

    getKeys(): string[] {
        return Object.keys(this.cache);
    }

    containsItem(key: string): boolean {
        return this.cache.hasOwnProperty(key);
    }
}
