/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { setPassword, getPassword, deletePassword } from "msal-keytar";
import { FilePersistence } from "./FilePersistence";
import { IPersistence } from "./IPersistence";
import { userInfo } from "os";

export class LibSecretPersistence implements IPersistence{

    protected readonly serviceName = "msal-extensions";
    protected readonly accountName;

    private readonly filePersistence: FilePersistence;

    constructor(fileLocation: string) {
        this.filePersistence = new FilePersistence(fileLocation);
        this.accountName = userInfo().username;
    }

    public async save(contents: string): Promise<void> {
        await setPassword(this.serviceName, this.accountName, contents);
        // Write dummy data to update file mtime
        await this.filePersistence.save("&");
    }

    public async load(): Promise<string | null> {
        return await getPassword(this.serviceName, this.accountName);
    }

    public async delete(): Promise<boolean> {
        try {
            return await deletePassword(this.serviceName, this.accountName);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    public reloadNecessary(lastSync: number): boolean {
        return this.filePersistence.reloadNecessary(lastSync);
    }

    public getFilePath(): string {
        return this.filePersistence.getFilePath();
    }
}
