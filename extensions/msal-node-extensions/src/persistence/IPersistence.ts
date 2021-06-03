/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";

export interface IPersistence {
    save(contents: string): Promise<void>;
    load(): Promise<string | null>;
    delete(): Promise<boolean>;
    reloadNecessary(lastSync: number): Promise<boolean>;
    getFilePath(): string;
    getLogger(): Logger;
    verifyPersistence(): Promise<boolean>;
    createForPersistenceValidation(): Promise<IPersistence>;
}
