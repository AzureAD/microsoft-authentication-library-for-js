/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { 
    PersistenceCreator,
    IPersistenceConfiguration,
    FilePersistenceWithDataProtection,
    KeychainPersistence,
    LibSecretPersistence,
    FilePersistence,
    Environment,
    DataProtectionScope
} from "../../src";
import { PersistenceError } from "../../src/error/PersistenceError";
import { FileSystemUtils } from '../util/FileSystemUtils';

describe('Persistence Creator', () => {
    afterEach(() => {
        jest.resetAllMocks();
    })
    afterAll(() => {
        FileSystemUtils.cleanUpFile("./creator-test.json");
    });

    const persistenceConfig: IPersistenceConfiguration = {
        cachePath: "./creator-test.json",
        dataProtectionScope: DataProtectionScope.CurrentUser,
        serviceName: "serviceName",
        accountName: "accountName",
    };

    const emptyPeristenceConfig: IPersistenceConfiguration = {
        cachePath: undefined,
        dataProtectionScope: undefined,
        serviceName: undefined,
        accountName: undefined,
    };

    if (process.platform === "win32") {
        test('Creates the FilePersistenceWithDataProtection instance', async () => {
            expect(await PersistenceCreator.createPersistence(persistenceConfig)).toBeInstanceOf(FilePersistenceWithDataProtection);
        });

        test('Validation error thrown for windows', async () => {
            try {
                await PersistenceCreator.createPersistence(emptyPeristenceConfig);
            } catch (e) {
                expect(e).toBeInstanceOf(PersistenceError);
                expect((e as PersistenceError).errorMessage).toBe("Cache path and/or data protection scope not provided for the FilePersistenceWithDataProtection cache plugin")
            }
        });
    } else if (process.platform === "darwin") {
        test('Creates the KeychainPersistence instance', async () => {
            expect(await PersistenceCreator.createPersistence(persistenceConfig)).toBeInstanceOf(KeychainPersistence);
        });

        test('Validation error thrown for macos', async () => {
            try {
                await PersistenceCreator.createPersistence(emptyPeristenceConfig);
            } catch (e) {
                expect(e).toBeInstanceOf(PersistenceError);
                expect((e as PersistenceError).errorMessage).toBe("Cache path, service name and/or account name not provided for the KeychainPersistence cache plugin")
            }
        });
    } else {
        test('Creates the LibSecretPersistence instance', async () => {
            expect(await PersistenceCreator.createPersistence(persistenceConfig)).toBeInstanceOf(LibSecretPersistence);
        });

        test('Linux plain text fallback', async () => {
            jest.spyOn(LibSecretPersistence.prototype, "verifyPersistence").mockRejectedValueOnce(new Error("Could not verify persistence"));
    
            expect(await PersistenceCreator.createPersistence({ ...persistenceConfig, usePlaintextFileOnLinux: true })).toBeInstanceOf(FilePersistence);
        });

        test('Validation error thrown for linux', async () => {
            try {
                await PersistenceCreator.createPersistence(emptyPeristenceConfig);
            } catch (e) {
                expect(e).toBeInstanceOf(PersistenceError);
                expect((e as PersistenceError).errorMessage).toBe("Cache path, service name and/or account name not provided for the LibSecretPersistence cache plugin")
            }
        });
    }

    test('Throws the appropriate error when the environment is not detected', async () => {
        try {
            jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue("UndetectedEnvironment");
            await PersistenceCreator.createPersistence(persistenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
        }
    });

    test('Propagate persistence verification error', async () => {
        try {
            jest.spyOn(LibSecretPersistence.prototype, "verifyPersistence").mockRejectedValue(new Error("Could not verify persistence"));

            await PersistenceCreator.createPersistence(persistenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
            expect((e as PersistenceError).errorMessage).toBe("Persistence could not be verified");
        }
    });
});