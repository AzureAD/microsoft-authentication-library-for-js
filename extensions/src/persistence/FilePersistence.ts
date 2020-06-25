/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { writeFile, readFile, unlink, stat, mkdir, close, open } from "fs";
import { promisify } from "util";
import { dirname } from "path";
import { IPersistence } from "./IPersistence";
import { Constants } from "../utils/Constants";
import { PersistenceError } from "../error/PersistenceError";

export class FilePersistence implements IPersistence {

    private filePath: string;

    public static async create(fileLocation: string): Promise<FilePersistence> {
        const filePersistence = new FilePersistence();
        filePersistence.filePath = fileLocation;
        await filePersistence.createCacheFile();
        return filePersistence;
    }

    public async save(contents: string): Promise<void> {
        const writeFilePromise = promisify(writeFile);
        try {
            await writeFilePromise(this.getFilePath(), contents, "utf-8");
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public async saveBuffer(contents: Uint8Array): Promise<void> {
        const writeFilePromise = promisify(writeFile);
        try {
            await writeFilePromise(this.getFilePath(), contents);
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    public async load(): Promise<string> {
        const readFilePromise = promisify(readFile);
        try {
            return await readFilePromise(this.getFilePath(), "utf-8");
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    };

    public async loadBuffer(): Promise<Uint8Array> {
        const readFilePromise = promisify(readFile);
        try {
            return await readFilePromise(this.getFilePath());
        } catch (err) {
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    };

    public async delete(): Promise<boolean> {
        const deleteFilePromise = promisify(unlink);
        try {
            await deleteFilePromise(this.getFilePath());
            return true;
        } catch (err) {
            if (err.code == Constants.ENOENT_ERROR) {
                // file does not exist, so it was not deleted
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

    private async timeLastModified(): Promise<number> {
        try {
            const statPromise = promisify(stat);
            const stats = await statPromise(this.filePath);
            return stats.mtime.getTime();
        } catch (err) {
            if (err.code == Constants.ENOENT_ERROR) {
                // file does not exist, so it's never been modified
                return 0;
            }
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    private async createCacheFile(): Promise<void> {
        await this.createFileDirectory();
        // File is created only if it does not exist
        const closePromise = promisify(close);
        const openPromise = promisify(open);
        await closePromise(await openPromise(this.filePath, "a"))
    }

    private async createFileDirectory(): Promise<void> {
        try {
            const mkdirPromise = promisify(mkdir);
            await mkdirPromise(dirname(this.filePath), {recursive: true});
        } catch (err) {
            if (err.code == Constants.EEXIST_ERROR) {
                console.log(`Directory ${dirname(this.filePath)} " already exists"`);
            } else {
                throw PersistenceError.createFileSystemError(err.code, err.message);
            }
        }
    }
}
