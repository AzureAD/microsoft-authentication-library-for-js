/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { setPassword, getPassword } from "msal-keytar";
import { IPersistence } from "./IPersistence";
import { FilePersistence } from "./FilePersistence";

export class FilePersistenceWithDataProtection implements IPersistence {

    protected readonly serviceName = "msal-extensions";

    private readonly filePersistence: FilePersistence;

    constructor(fileLocation: string) {
        this.filePersistence = new FilePersistence(fileLocation);
    }

    public async save(contents: string): Promise<void> {
        await setPassword(this.serviceName, this.filePersistence.getFilePath(), contents);
    }

    public async load(): Promise<string | null> {
         return await getPassword(this.serviceName, this.filePersistence.getFilePath());
    }

    public async delete(): Promise<boolean> {
        return this.filePersistence.delete();
    }

    public reloadNecessary(lastSync: number): boolean {
        return this.filePersistence.reloadNecessary(lastSync);
    }

    public getFilePath(): string {
        return this.filePersistence.getFilePath();
    }
}
