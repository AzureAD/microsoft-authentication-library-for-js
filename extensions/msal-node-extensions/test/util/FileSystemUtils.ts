/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { promises as fs } from "fs";
import { Constants } from "../../src/utils/Constants";

/**
 * FS utils used for testing persistence
 */
export class FileSystemUtils {
    static async doesFileExist(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            if (error.code == Constants.ENOENT_ERROR) {
                return false;
            } else {
                throw error;
            }
        }
    }

    static async cleanUpFile(filePath: string): Promise<void> {
        try {
            const fileHandle = await fs.open(filePath, "w");
            await fs.unlink(filePath);
            await fileHandle.close();
        } catch (error) {
            // if error is due to lockfile not being present, that's fine
            if (error.code !== Constants.ENOENT_ERROR) {
                throw error;
            }
        }
    }
}
