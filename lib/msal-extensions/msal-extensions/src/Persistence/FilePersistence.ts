/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { writeFile, readFile, unlink } from "fs";
import { promisify } from "util";
import { accessSync, statSync, mkdirSync, closeSync, openSync } from "fs";
import { dirname } from "path";
import { IPersistence } from "./IPersistence";

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
            if (err) {
                console.log(err);
                throw err;
            }
        }
    }

    public async load(): Promise<string> {
        const readFilePromise = promisify(readFile);
        try{
            return await readFilePromise(this.getFilePath(), "UTF-8");
        } catch (err) {
           console.log(err);
           throw err;
        }
    };

   public async delete(): Promise<boolean> {
       const deleteFilePromise = promisify(unlink)
       try {
           await deleteFilePromise(this.getFilePath());
           return true;
       } catch (err) {
           console.log(err);
           return false;
       }
   }

    public getFilePath(): string {
        return this.filePath;
    }

    public reloadNecessary(lastSync: number): boolean {
        if (!(this.fileExist())) { // TODO probably don't need this since we are creating the file.
            return false;
        }
        return lastSync < this.timeLastModified();
    }

    private fileExist(): boolean {
        try {
            accessSync(this.filePath);
            return true;
        } catch (err) {
            if (err.code == "ENOENT") {
                return false;
            }
            throw(err);
        }
    }

    private timeLastModified(): number {
        try {
            const stats = statSync(this.filePath);
            return stats.mtime.getTime();
        } catch (err) {
            console.log(err);
            throw(err);
        }
    }

    private createCacheFile(): void {
        this.createFileDirectory();
        closeSync(openSync(this.filePath, "a"))
    }

    private createFileDirectory(): void {
        try {
            mkdirSync(dirname(this.filePath), {recursive: true});
        } catch (error) {
            if (error.code == "EEXIST") {
                console.log("directory exists");
            } else {
                throw error;
            }
        }
    }
}
