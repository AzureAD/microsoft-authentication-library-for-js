/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { setPassword, getPassword, deletePassword } from "msal-keytar";
import { FilePersistence } from "./FilePersistence";
import { IPersistence } from "./IPersistence";
import { PersistenceError } from "../error/PersistenceError";

export class KeychainPersistence implements IPersistence {

    protected readonly serviceName;
    protected readonly accountName;
    private readonly filePersistence: FilePersistence;

    constructor(fileLocation: string, serviceName: string, accountName: string) {
        this.filePersistence = new FilePersistence(fileLocation);
        this.serviceName = serviceName;
        this.accountName = accountName;
    }

    public async save(contents: string): Promise<void> {
        try {
            await setPassword(this.serviceName, this.accountName, contents);
        } catch (err) {
            throw PersistenceError.createKeychainPersistenceError(err.code, err.message);
        }
        // Write dummy data to update file mtime
        await this.filePersistence.save("{}");
    }

    public async load(): Promise<string | null> {
        try{
            return await getPassword(this.serviceName, this.accountName);
        } catch(err){
            throw PersistenceError.createKeychainPersistenceError(err.code, err.message);
        }
    }

    public async delete(): Promise<boolean> {
        try {
            return await deletePassword(this.serviceName, this.accountName);
        } catch (err) {
            throw PersistenceError.createKeychainPersistenceError(err.code, err.message);
        }
    }

    public reloadNecessary(lastSync: number): boolean {
        return this.filePersistence.reloadNecessary(lastSync);
    }

    public getFilePath(): string {
        return this.filePersistence.getFilePath();
    }
}
