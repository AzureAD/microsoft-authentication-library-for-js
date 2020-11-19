/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LibSecretPersistence } from "../../src";
import { FileSystemUtils } from "../util/FileSystemUtils";
import { setPassword, getPassword, deletePassword } from "keytar";

jest.mock("keytar");

describe('Test LibSecretPersistence', () => {
    const filePath = "./libsecret-test.json";
    const serviceName = "testService";
    const accountName = "accountName";

    afterEach(async () => {
        await FileSystemUtils.cleanUpFile(filePath);
    });

    test('exports a class', async () => {
        const persistence = await LibSecretPersistence.create(filePath, serviceName, accountName);
        expect(persistence).toBeInstanceOf(LibSecretPersistence);
    });

    test('creates a cache persistence if doesnt exist', async () => {
        await LibSecretPersistence.create(filePath, serviceName, accountName);
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(true);
    });

    test('Returns correct persistence path', async () => {
        const persistence = await LibSecretPersistence.create(filePath, serviceName, accountName);
        expect(persistence.getFilePath()).toEqual(filePath);
    });

    test('Saves and loads contents', async () => {
        const persistence = await LibSecretPersistence.create(filePath, serviceName, accountName);
        const contents = "test";
        await persistence.load();
        await persistence.save(contents);

        expect(setPassword).toHaveBeenCalledTimes(1);
        expect(setPassword).toHaveBeenCalledWith(serviceName, accountName, contents);
        expect(getPassword).toHaveBeenCalledTimes(1);
    });

    test('deletes persistence', async () => {
        const persistence = await LibSecretPersistence.create(filePath, serviceName, accountName);
        await persistence.delete();

        expect(deletePassword).toHaveBeenCalledTimes(1);
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(false);
    });

    test('Persistence modified, reload necessary', async () => {
        const persistence = await LibSecretPersistence.create(filePath, serviceName, accountName);
        expect(await persistence.reloadNecessary(0)).toBe(true);
    });

    test('Persistence not modified, reload not necessary', async () => {
        const persistence = await LibSecretPersistence.create(filePath, serviceName, accountName);
        setTimeout(async () => {
            expect(await persistence.reloadNecessary(Date.now())).toBe(false);
        }, 100);
    });
});
