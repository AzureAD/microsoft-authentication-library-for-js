/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { promises as fs } from "fs";
import { dirname } from "path";
import { IPersistence } from "./IPersistence";
import { Constants } from "../utils/Constants";
import { PersistenceError } from "../error/PersistenceError";
import { Logger, LoggerOptions, LogLevel } from "@azure/msal-common";
import { BasePersistence } from "./BasePersistence";

/**
 * Reads and writes data to file specified by file location. File contents are not
 * encrypted.
 *
 * If file or directory has not been created, it FilePersistence.create() will create
 * file and any directories in the path recursively.
 */
export class FilePersistence extends BasePersistence implements IPersistence {

    private filePath: string;
    private logger: Logger;

    public static async create(fileLocation: string, loggerOptions?: LoggerOptions): Promise<FilePersistence> {
        const filePersistence = new FilePersistence();
        filePersistence.filePath = fileLocation;
        filePersistence.logger = new Logger(loggerOptions || FilePersistence.createDefaultLoggerOptions());
        await filePersistence.createCacheFile();
        return filePersistence;
    }

    public async save(contents: string): Promise<void> {
        try {
            await fs.writeFile(this.getFilePath(), contents, "utf-8");
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public async saveBuffer(contents: Uint8Array): Promise<void> {
        try {
            await fs.writeFile(this.getFilePath(), contents);
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public async load(): Promise<string | null> {
        try {
            return await fs.readFile(this.getFilePath(), "utf-8");
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public async loadBuffer(): Promise<Uint8Array> {
        try {
            return await fs.readFile(this.getFilePath());
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public async delete(): Promise<boolean> {
        try {
            await fs.unlink(this.getFilePath());
            return true;
        } catch (err) {
            if (err.code === Constants.ENOENT_ERROR) {
                // file does not exist, so it was not deleted
                this.logger.warning("Cache file does not exist, so it could not be deleted");
                return false;
            }
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public getFilePath(): string {
        return this.filePath;
    }

    public async reloadNecessary(lastSync: number): Promise<boolean> {
        return lastSync < await this.timeLastModified();
    }

    public getLogger(): Logger {
        return this.logger;
    }

    public createForPersistenceValidation(): Promise<FilePersistence> {
        const testCacheFileLocation = `${dirname(this.filePath)}/test.cache`;
        return FilePersistence.create(testCacheFileLocation);
    }

    private static createDefaultLoggerOptions(): LoggerOptions {
        return {
            loggerCallback: () => {
                // allow users to not set loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info
        };
    }

    private async timeLastModified(): Promise<number> {
        try {
            const stats = await fs.stat(this.filePath);
            return stats.mtime.getTime();
        } catch (err) {
            if (err.code === Constants.ENOENT_ERROR) {
                // file does not exist, so it's never been modified
                this.logger.verbose("Cache file does not exist");
                return 0;
            }
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    private async createCacheFile(): Promise<void> {
        await this.createFileDirectory();
        // File is created only if it does not exist
        const fileHandle = await fs.open(this.filePath, "a");
        await fileHandle.close();
        this.logger.info(`File created at ${this.filePath}`);
    }

    private async createFileDirectory(): Promise<void> {
        try {
            await fs.mkdir(dirname(this.filePath), {recursive: true});
        } catch (err) {
            if (err.code === Constants.EEXIST_ERROR) {
                this.logger.info(`Directory ${dirname(this.filePath)}  already exists`);
            } else {
                throw PersistenceError.createFileSystemError(err.code, err.message);
            }
        }
    }
}
