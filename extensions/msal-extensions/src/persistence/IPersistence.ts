/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface IPersistence {
    save(contents: string): Promise<void>;
    load(): Promise<string>;
    delete(): Promise<boolean>;
    reloadNecessary(lastSync: number): Promise<boolean>;
    getFilePath(): string;
}
