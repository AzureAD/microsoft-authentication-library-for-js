/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "./IPersistence";
import { FilePersistence } from "./FilePersistence";
import { PersistenceError } from "../error/PersistenceError";
import { Dpapi } from "../dpapi-addon/Dpapi";
import { DataProtectionScope } from "./DataProtectionScope";
import { Logger, LoggerOptions } from "@azure/msal-common";

/**
 * Uses CryptProtectData and CryptUnprotectData on Windows to encrypt and decrypt file contents.
 *
 * scope: Scope of the data protection. Either local user or the current machine
 * optionalEntropy: Password or other additional entropy used to encrypt the data
 */
export class FilePersistenceWithDataProtection implements IPersistence {

    private filePersistence: FilePersistence;
    private scope: DataProtectionScope;
    private optionalEntropy: Uint8Array;

    private constructor(scope: DataProtectionScope, optionalEntropy?: string) {
        this.scope = scope;
        this.optionalEntropy = optionalEntropy ? Buffer.from(optionalEntropy, "utf-8") : null;
    }

    public static async create(
        fileLocation: string,
        scope: DataProtectionScope,
        optionalEntropy?: string,
        loggerOptions?: LoggerOptions): Promise<FilePersistenceWithDataProtection> {

        const persistence = new FilePersistenceWithDataProtection(scope, optionalEntropy);
        persistence.filePersistence = await FilePersistence.create(fileLocation, loggerOptions);
        return persistence;
    }

    public async save(contents: string): Promise<void> {
        const TIMESTAMP_LABEL = "save -> FilePersistenceWithDataProtection";
        try {
            // eslint-disable-next-line no-console
            console.time(TIMESTAMP_LABEL);
            const encryptedContents = Dpapi.protectData(
                Buffer.from(contents, "utf-8"),
                this.optionalEntropy,
                this.scope.toString());
            await this.filePersistence.saveBuffer(encryptedContents);
            // eslint-disable-next-line no-console
            console.timeEnd(TIMESTAMP_LABEL);
        } catch (err) {
            throw PersistenceError.createFilePersistenceWithDPAPIError(err.message);
        }
    }

    public async load(): Promise<string | null> {
        const TIMESTAMP_LABEL = "load -> FilePersistenceWithDataProtection";
        try {
            // eslint-disable-next-line no-console
            console.time(TIMESTAMP_LABEL);
            const encryptedContents = await this.filePersistence.loadBuffer();
            if (typeof encryptedContents === "undefined" || !encryptedContents || 0 === encryptedContents.length) {
                this.filePersistence.getLogger().info("Encrypted contents loaded from file were null or empty");
                return null;
            }
            const data = Dpapi.unprotectData(
                encryptedContents,
                this.optionalEntropy,
                this.scope.toString()).toString();
            // eslint-disable-next-line no-console
            console.timeEnd(TIMESTAMP_LABEL);
            return data;
        } catch (err) {
            throw PersistenceError.createFilePersistenceWithDPAPIError(err.message);
        }
    }

    public async delete(): Promise<boolean> {
        return this.filePersistence.delete();
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
}
