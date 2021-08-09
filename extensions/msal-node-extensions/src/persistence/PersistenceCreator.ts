/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FilePersistenceWithDataProtection } from "../persistence/FilePersistenceWithDataProtection";
import { LibSecretPersistence } from "../persistence/LibSecretPersistence";
import { KeychainPersistence } from "../persistence/KeychainPersistence";
import { DataProtectionScope } from "../persistence/DataProtectionScope";
import { Environment } from "../utils/Environment";
import { IPersistence } from "./IPersistence";
import { FilePersistence } from "./FilePersistence";
import { PersistenceError } from "../error/PersistenceError";
import { IPersistenceConfiguration } from "../persistence/IPersistenceConfiguration";

export class PersistenceCreator {
    static async createPersistence(config: IPersistenceConfiguration): Promise<IPersistence> {
        let peristence: IPersistence;

        // On Windows, uses a DPAPI encrypted file
        if (Environment.isWindowsPlatform()) {
            if (!config.cachePath || !config.dataProtectionScope) {
                throw PersistenceError.createPersistenceNotValidatedError(`Cache path and/or data protection scope not provided for the FilePersistenceWithDataProtection cache plugin`);
            }

            peristence = await FilePersistenceWithDataProtection.create(config.cachePath, DataProtectionScope.CurrentUser);
        }

        // On Mac, uses keychain.
        else if (Environment.isMacPlatform()) {
            if (!config.cachePath || !config.serviceName || !config.accountName) {
                throw PersistenceError.createPersistenceNotValidatedError(`Cache path, service name and/or account name not provided for the KeychainPersistence cache plugin`);
            }

            peristence = await KeychainPersistence.create(config.cachePath, config.serviceName, config.accountName);
        }

        // On Linux, uses  libsecret to store to secret service. Libsecret has to be installed.
        else if (Environment.isLinuxPlatform()) {
            if (!config.cachePath || !config.serviceName || !config.accountName) {
                throw PersistenceError.createPersistenceNotValidatedError(`Cache path, service name and/or account name not provided for the LibSecretPersistence cache plugin`);
            }

            peristence = await LibSecretPersistence.create(config.cachePath, config.serviceName, config.accountName);
        }

        else {
            throw PersistenceError.createNotSupportedError("The current environment is not supported by msal-node-extensions yet.");
        }

        // Initially suppress the error thrown during persistence verification to allow us to fallback to plain text
        const isPersistenceVerified = await peristence.verifyPersistence().catch(() => false);
        
        if (!isPersistenceVerified) {
            if (Environment.isLinuxPlatform() && config.usePlaintextFileOnLinux) {
                if (!config.cachePath) {
                    throw PersistenceError.createPersistenceNotValidatedError(`Cache path not provided for the FilePersistence cache plugin`);
                }

                peristence = await FilePersistence.create(config.cachePath);

                const isFilePersistenceVerified = await peristence.verifyPersistence();
                if (isFilePersistenceVerified) {
                    return peristence;
                }
            }

            throw PersistenceError.createPersistenceNotVerifiedError("Persistence could not be verified");
        }

        return peristence;
    }
}
