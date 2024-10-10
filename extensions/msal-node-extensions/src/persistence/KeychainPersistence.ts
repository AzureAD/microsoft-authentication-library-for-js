/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import keytar from "keytar";
import { FilePersistence } from "./FilePersistence.js";
import { IPersistence } from "./IPersistence.js";
import { PersistenceError } from "../error/PersistenceError.js";
import { Logger, LoggerOptions } from "@azure/msal-common/node";
import { dirname } from "path";
import { BasePersistence } from "./BasePersistence.js";
import { isNodeError } from "../utils/TypeGuards.js";

/**
 * Uses reads and writes passwords to macOS keychain
 *
 * serviceName: Identifier used as key for whatever value is stored
 * accountName: Account under which password should be stored
 */
export class KeychainPersistence
    extends BasePersistence
    implements IPersistence
{
    protected readonly serviceName;
    protected readonly accountName;
    private filePersistence: FilePersistence;

    private constructor(
        filePersistence: FilePersistence,
        serviceName: string,
        accountName: string
    ) {
        super();
        this.filePersistence = filePersistence;
        this.serviceName = serviceName;
        this.accountName = accountName;
    }

    public static async create(
        fileLocation: string,
        serviceName: string,
        accountName: string,
        loggerOptions?: LoggerOptions
    ): Promise<KeychainPersistence> {
        const filePersistence = await FilePersistence.create(
            fileLocation,
            loggerOptions
        );
        const persistence = new KeychainPersistence(
            filePersistence,
            serviceName,
            accountName
        );
        return persistence;
    }

    public async save(contents: string): Promise<void> {
        try {
            await keytar.setPassword(
                this.serviceName,
                this.accountName,
                contents
            );
        } catch (err) {
            if (isNodeError(err)) {
                throw PersistenceError.createKeychainPersistenceError(
                    err.message
                );
            } else {
                throw err;
            }
        }
        // Write dummy data to update file mtime
        await this.filePersistence.save("{}");
    }

    public async load(): Promise<string | null> {
        try {
            return await keytar.getPassword(this.serviceName, this.accountName);
        } catch (err) {
            if (isNodeError(err)) {
                throw PersistenceError.createKeychainPersistenceError(
                    err.message
                );
            } else {
                throw err;
            }
        }
    }

    public async delete(): Promise<boolean> {
        try {
            await this.filePersistence.delete();
            return await keytar.deletePassword(
                this.serviceName,
                this.accountName
            );
        } catch (err) {
            if (isNodeError(err)) {
                throw PersistenceError.createKeychainPersistenceError(
                    err.message
                );
            } else {
                throw err;
            }
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
        const testCacheFileLocation = `${dirname(
            this.filePersistence.getFilePath()
        )}/test.cache`;
        return KeychainPersistence.create(
            testCacheFileLocation,
            "persistenceValidationServiceName",
            "persistencValidationAccountName"
        );
    }
}
