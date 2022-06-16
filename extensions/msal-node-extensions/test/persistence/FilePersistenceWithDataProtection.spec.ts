/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataProtectionScope, FilePersistenceWithDataProtection } from "../../src";
import { FileSystemUtils } from "../util/FileSystemUtils";
import { Dpapi } from "../../src/dpapi-addon/Dpapi";
import { mocked } from 'ts-jest/utils';

jest.mock("../../src/dpapi-addon/Dpapi");

describe('Test File Persistence with data protection', () => {
    const filePath = "./dpapi-test.json";
    const dpapiScope = DataProtectionScope.LocalMachine;

    afterEach(async () => {
        await FileSystemUtils.cleanUpFile(filePath);
    });

    test('exports a class', async () => {
        const file = await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        expect(file).toBeInstanceOf(FilePersistenceWithDataProtection);
    });

    test('creates a cache file if doesnt exist', async () => {
        await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(true);
    });

    test('Returns correct file path', async () => {
        const file = await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        expect(file.getFilePath()).toEqual(filePath);
    });

    test('Saves and loads contents', async () => {
        mocked(Dpapi.unprotectData).mockReturnValueOnce(Buffer.from("data"));
        mocked(Dpapi.protectData).mockReturnValueOnce(Buffer.from("encryptedData"));

        const persistence = await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        const contents = "test";

        await persistence.save(contents);
        expect(await persistence.load()).toEqual("data");
        expect(Dpapi.protectData).toHaveBeenCalledTimes(1);
        expect(Dpapi.unprotectData).toHaveBeenCalledTimes(1);
    });

    test('deletes file', async () => {
        const file = await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        await file.delete();
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(false);
    });

    test('File modified, reload necessary', async () => {
        const file = await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        expect(await file.reloadNecessary(0)).toBe(true);
    });

    test('File no modified, reload not necessary', async () => {
        const file = await FilePersistenceWithDataProtection.create(filePath, dpapiScope);
        setTimeout(async () => {
            expect(await file.reloadNecessary(Date.now())).toBe(false);
        }, 100);
    });
});
