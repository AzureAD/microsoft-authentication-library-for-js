/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { setPassword, getPassword, deletePassword } from "keytar";
import { FilePersistence } from "./FilePersistence";
import { IPersistence } from "./IPersistence";
import { PersistenceError } from "../error/PersistenceError";
import { Logger, LoggerOptions } from "@azure/msal-common";
import { dirname } from "path";
import { BasePersistence } from "./BasePersistence";

/**
 * Uses reads and writes passwords to macOS keychain
 *
 * serviceName: Identifier used as key for whatever value is stored
 * accountName: Account under which password should be stored
 */
export class KeychainPersistence extends BasePersistence implements IPersistence {

    protected readonly serviceName;
    protected readonly accountName;
    private filePersistence: FilePersistence;

    private constructor(serviceName: string, accountName: string) {
        super();
        this.serviceName = serviceName;
        this.accountName = accountName;
    }

    public static async create(
        fileLocation: string,
        serviceName: string,
        accountName: string,
        loggerOptions?: LoggerOptions): Promise<KeychainPersistence> {

        const persistence = new KeychainPersistence(serviceName, accountName);
        persistence.filePersistence = await FilePersistence.create(fileLocation, loggerOptions);
        return persistence;
    }

    public async save(contents: string): Promise<void> {
        try {
            await setPassword(this.serviceName, this.accountName, contents);
        } catch (err) {
            throw PersistenceError.createKeychainPersistenceError(err.message);
        }
        // Write dummy data to update file mtime
        await this.filePersistence.save("{}");
    }

    public async load(): Promise<string | null> {
        try{
            return await getPassword(this.serviceName, this.accountName);
        } catch(err){
            throw PersistenceError.createKeychainPersistenceError(err.message);
        }
    }

    public async delete(): Promise<boolean> {
        try {
            await this.filePersistence.delete();
            return await deletePassword(this.serviceName, this.accountName);
        } catch (err) {
            throw PersistenceError.createKeychainPersistenceError(err.message);
        }
    }

    public async reloadNecessary(lastSync: number): Promise<boolean> {
        return this.filePersistence.reloadNecessary(lastSync);
    }

    public getFilePath(): string {
        return this.filePersistence.getFilePath();
    }

    public getLogger(): Logger {
        return this.filePersistence.getLogger();
    }
   
    public createForPersistenceValidation(): Promise<KeychainPersistence> {
        const testCacheFileLocation = `${dirname(this.filePersistence.getFilePath())}/test.cache`;
        return KeychainPersistence.create(testCacheFileLocation, "persistenceValidationServiceName", "persistencValidationAccountName");
    }
}
