/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { setPassword, getPassword } from "msal-keytar";
import { IPersistence } from "./IPersistence";
import { FilePersistence } from "./FilePersistence";
import { PersistenceError } from "../error/PersistenceError";

export class FilePersistenceWithDataProtection implements IPersistence {

    protected readonly serviceName;
    private readonly filePersistence: FilePersistence;

    constructor(fileLocation: string, serviceName?: string) {
        this.serviceName = serviceName;
        this.filePersistence = new FilePersistence(fileLocation);
    }

    public async save(contents: string): Promise<void> {
        try{
            await setPassword(this.serviceName, this.filePersistence.getFilePath(), contents);
        } catch(err) {
            throw PersistenceError.createFilePersistenceWithDPAPIError(err.code, err.message);
        }
    }

    public async load(): Promise<string | null> {
        try{
            return await getPassword(this.serviceName, this.filePersistence.getFilePath());
        } catch(err) {
            throw PersistenceError.createFilePersistenceWithDPAPIError(err.code, err.message);
        }
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
