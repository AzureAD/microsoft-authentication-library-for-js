/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import path from "path";

/**
 * Default number of times to retry failed tests.
 */
export const RETRY_TIMES = 3;

/**
 * One second in milliseconds.
 */
export const ONE_SECOND_IN_MS = 1000;

/**
 * Validates that the cache location exists and is writable.
 * Creates the directory if it doesn't exist.
 * @param cacheLocation - Path to the cache file.
 */
export async function validateCacheLocation(
    cacheLocation: string
): Promise<void> {
    const cacheDir = path.dirname(cacheLocation);

    return new Promise((resolve, reject) => {
        // Create directory if it doesn't exist
        fs.mkdir(cacheDir, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
                console.error("Error creating cache directory:", mkdirErr);
                reject(mkdirErr);
                return;
            }

            // Check if file exists, create empty if not
            fs.access(cacheLocation, fs.constants.F_OK, (accessErr) => {
                if (accessErr) {
                    // File doesn't exist, create empty cache
                    const emptyCache = {
                        Account: {},
                        IdToken: {},
                        AccessToken: {},
                        RefreshToken: {},
                        AppMetadata: {},
                    };
                    fs.writeFile(
                        cacheLocation,
                        JSON.stringify(emptyCache, null, 2),
                        (writeErr) => {
                            if (writeErr) {
                                console.error(
                                    "Error creating cache file:",
                                    writeErr
                                );
                                reject(writeErr);
                                return;
                            }
                            resolve();
                        }
                    );
                } else {
                    resolve();
                }
            });
        });
    });
}

/**
 * Creates a folder if it doesn't exist.
 * @param folderPath - Path to the folder to create.
 */
export function createFolder(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}
