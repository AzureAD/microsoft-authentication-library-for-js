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
import { Platform } from '../../src/utils/Constants';
import { FileSystemUtils } from '../util/FileSystemUtils';

describe('Persistence Creator', () => {
    afterAll(() => {
        FileSystemUtils.cleanUpFile("./test.json");
    });

    const persistenceConfig: IPersistenceConfiguration = {
        cachePath: "./test.json",
        dataProtectionScope: DataProtectionScope.CurrentUser,
        serviceName: "serviceName",
        accountName: "accountName",
    };

    const emptyPeristenceConfig: IPersistenceConfiguration = {
        cachePath: null,
        dataProtectionScope: null,
        serviceName: null,
        accountName: null,
    };

    test('Creates the FilePersistenceWithDataProtection instance', async () => {
        jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.WINDOWS);
        expect(await PersistenceCreator.createPersistence(persistenceConfig)).toBeInstanceOf(FilePersistenceWithDataProtection);
    });

    test('Creates the KeychainPersistence instance', async () => {
        jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.MACOS);
        expect(await PersistenceCreator.createPersistence(persistenceConfig)).toBeInstanceOf(KeychainPersistence);
    });

    test('Creates the LibSecretPersistence instance', async () => {
        jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.LINUX);
        expect(await PersistenceCreator.createPersistence(persistenceConfig)).toBeInstanceOf(LibSecretPersistence);
    });

    test('Throws the appropriate error when the environment is not detected', async () => {
        try {
            jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue("UndetectedEnvironment");
            await PersistenceCreator.createPersistence(persistenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
        }
    });

    test('Linux plain text fallback', async () => {
        jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.LINUX);
        jest.spyOn(LibSecretPersistence.prototype, "verifyPersistence").mockRejectedValueOnce(new Error("Could not verify persistence"));

        expect(await PersistenceCreator.createPersistence({ ...persistenceConfig, usePlaintextFileOnLinux: true })).toBeInstanceOf(FilePersistence);
    });

    test('Propagate persistence verification error', async () => {
        try {
            jest.spyOn(LibSecretPersistence.prototype, "verifyPersistence").mockRejectedValue(new Error("Could not verify persistence"));

            await PersistenceCreator.createPersistence(persistenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
            expect(e.errorMessage).toBe("Persistence could not be verified");
        }
    });

    test('Validation error thrown for windows', async () => {
        try {
            jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.WINDOWS);
            await PersistenceCreator.createPersistence(emptyPeristenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
            expect(e.errorMessage).toBe("Cache path and/or data protection scope not provided for the FilePersistenceWithDataProtection cache plugin")
        }
    });

    test('Validation error thrown for linux', async () => {
        try {
            jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.LINUX);
            await PersistenceCreator.createPersistence(emptyPeristenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
            expect(e.errorMessage).toBe("Cache path, service name and/or account name not provided for the LibSecretPersistence cache plugin")
        }
    });

    test('Validation error thrown for macos', async () => {
        try {
            jest.spyOn(Environment, "getEnvironmentPlatform").mockReturnValue(Platform.MACOS);
            await PersistenceCreator.createPersistence(emptyPeristenceConfig);
        } catch (e) {
            expect(e).toBeInstanceOf(PersistenceError);
            expect(e.errorMessage).toBe("Cache path, service name and/or account name not provided for the KeychainPersistence cache plugin")
        }
    });
});