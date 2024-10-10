/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "./IPersistence.js";
import { FilePersistence } from "./FilePersistence.js";
import { PersistenceError } from "../error/PersistenceError.js";
import { Dpapi } from "../Dpapi.js";
import { DataProtectionScope } from "./DataProtectionScope.js";
import { Logger, LoggerOptions } from "@azure/msal-common/node";
import { dirname } from "path";
import { BasePersistence } from "./BasePersistence.js";
import { isNodeError } from "../utils/TypeGuards.js";

/**
 * Uses CryptProtectData and CryptUnprotectData on Windows to encrypt and decrypt file contents.
 *
 * scope: Scope of the data protection. Either local user or the current machine
 * optionalEntropy: Password or other additional entropy used to encrypt the data
 */
export class FilePersistenceWithDataProtection
    extends BasePersistence
    implements IPersistence
{
    private filePersistence: FilePersistence;
    private scope: DataProtectionScope;
    private optionalEntropy: Uint8Array | null;

    private constructor(
        filePersistence: FilePersistence,
        scope: DataProtectionScope,
        optionalEntropy?: string
    ) {
        super();
        this.scope = scope;
        this.optionalEntropy = optionalEntropy
            ? Buffer.from(optionalEntropy, "utf-8")
            : null;
        this.filePersistence = filePersistence;
    }

    public static async create(
        fileLocation: string,
        scope: DataProtectionScope,
        optionalEntropy?: string,
        loggerOptions?: LoggerOptions
    ): Promise<FilePersistenceWithDataProtection> {
        const filePersistence = await FilePersistence.create(
            fileLocation,
            loggerOptions
        );
        const persistence = new FilePersistenceWithDataProtection(
            filePersistence,
            scope,
            optionalEntropy
        );
        return persistence;
    }

    public async save(contents: string): Promise<void> {
        try {
            const encryptedContents = Dpapi.protectData(
                Buffer.from(contents, "utf-8"),
                this.optionalEntropy,
                this.scope.toString()
            );
            await this.filePersistence.saveBuffer(encryptedContents);
        } catch (err) {
            if (isNodeError(err)) {
                throw PersistenceError.createFilePersistenceWithDPAPIError(
                    err.message
                );
            } else {
                throw err;
            }
        }
    }

    public async load(): Promise<string | null> {
        try {
            const encryptedContents = await this.filePersistence.loadBuffer();
            if (
                typeof encryptedContents === "undefined" ||
                !encryptedContents ||
                0 === encryptedContents.length
            ) {
                this.filePersistence
                    .getLogger()
                    .info(
                        "Encrypted contents loaded from file were null or empty"
                    );
                return null;
            }
            return Dpapi.unprotectData(
                encryptedContents,
                this.optionalEntropy,
                this.scope.toString()
            ).toString();
        } catch (err) {
            if (isNodeError(err)) {
                throw PersistenceError.createFilePersistenceWithDPAPIError(
                    err.message
                );
            } else {
                throw err;
            }
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

    public createForPersistenceValidation(): Promise<FilePersistenceWithDataProtection> {
        const testCacheFileLocation = `${dirname(
            this.filePersistence.getFilePath()
        )}/test.cache`;
        return FilePersistenceWithDataProtection.create(
            testCacheFileLocation,
            DataProtectionScope.CurrentUser
        );
    }
}
