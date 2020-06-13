/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { writeFile, readFile, unlink } from "fs";
import { promisify } from "util";
import { statSync, mkdirSync, closeSync, openSync } from "fs";
import { dirname } from "path";
import { IPersistence } from "./IPersistence";
import { Constants } from "../utils/Constants";
import { PersistenceError } from "../error/PersistenceError";

export class FilePersistence implements IPersistence {

    private readonly filePath: string;

    constructor(fileLocation: string) {
        this.filePath = fileLocation;
        this.createCacheFile();
    }

    public async save(contents: string): Promise<void> {
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
            return await readFilePromise(this.getFilePath(), "UTF-8");
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

    public reloadNecessary(lastSync: number): boolean {
        return lastSync < this.timeLastModified();
    }

    private timeLastModified(): number {
        try {
            const stats = statSync(this.filePath);
            return stats.mtime.getTime();
        } catch (err) {
            if (err.code == Constants.ENOENT_ERROR) {
                // file does not exist, so it's never been modified
                return 0;
            }
            throw PersistenceError.createFileSystemError(err.code, err.message);
        }
    }

    private createCacheFile(): void {
        this.createFileDirectory();
        // File is created only if it does not exist
        closeSync(openSync(this.filePath, "a"))
    }

    private createFileDirectory(): void {
        try {
            mkdirSync(dirname(this.filePath), {recursive: true});
        } catch (err) {
            if (err.code == Constants.EEXIST_ERROR) {
                console.log(`Directory ${dirname(this.filePath)} " already exists"`);
            } else {
                throw PersistenceError.createFileSystemError(err.code, err.message);
            }
        }
    }
}
