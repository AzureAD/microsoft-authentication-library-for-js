/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "./IPersistence";
import { FilePersistence } from "./FilePersistence";
import { PersistenceError } from "../error/PersistenceError";
import { Dpapi } from "../dpapi/Dpapi";
import { DataProtectionScope } from "./DataProtectionScope";

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

    constructor(scope: DataProtectionScope, optionalEntropy?: string) {
        this.scope = scope;
        this.optionalEntropy = optionalEntropy ? Buffer.from(optionalEntropy, "utf-8") : null;
    }

    public static async create(
        fileLocation: string,
        scope: DataProtectionScope,
        optionalEntropy?: string): Promise<FilePersistenceWithDataProtection> {

        const persistence = new FilePersistenceWithDataProtection(scope, optionalEntropy);
        persistence.filePersistence = await FilePersistence.create(fileLocation);
        return persistence;
    }

    public async save(contents: string): Promise<void> {
        try {
            const encryptedContents = Dpapi.protectData(
                Buffer.from(contents, "utf-8"),
                this.optionalEntropy,
                this.scope.toString());
            await this.filePersistence.saveBuffer(encryptedContents);
        } catch (err) {
            throw PersistenceError.createFilePersistenceWithDPAPIError(err.code, err.message);
        }
    }

    public async load(): Promise<string | null> {
        try {
            const encryptedContents = await this.filePersistence.loadBuffer();
            // TODO use MSAL common util instead
            if (typeof encryptedContents === "undefined" || !encryptedContents || 0 === encryptedContents.length) {
                return null;
            }
            return Dpapi.unprotectData(
                encryptedContents,
                this.optionalEntropy,
                this.scope.toString()).toString();
        } catch (err) {
            throw PersistenceError.createFilePersistenceWithDPAPIError(err.code, err.message);
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
}
