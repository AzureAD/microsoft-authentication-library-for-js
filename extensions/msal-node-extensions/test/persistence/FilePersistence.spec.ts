/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FilePersistence } from "../../src";
import { FileSystemUtils } from "../util/FileSystemUtils";

describe('Test File Persistence', () => {

    const filePath = "./test.json";

    afterEach(async () => {
        await FileSystemUtils.cleanUpFile(filePath);
    });

    test('exports a class', async () => {
        const file = await FilePersistence.create(filePath);
        expect(file).toBeInstanceOf(FilePersistence);
    });

    test('creates a cache file if doesnt exist', async () => {
        await FilePersistence.create(filePath);
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(true);
    });

    test('Returns correct file path', async () => {
        const file = await FilePersistence.create(filePath);
        expect(file.getFilePath()).toEqual(filePath);
    });

    test('Saves and loads contents', async () => {
        const file = await FilePersistence.create(filePath);
        const contents = "test";
        await file.save(contents);
        expect(await file.load()).toEqual(contents);
    });

    test('Saves and loads contents using buffer', async () => {
        const file = await FilePersistence.create(filePath);
        const contents = Buffer.from("test");
        await file.saveBuffer(contents);
        expect(await file.loadBuffer()).toEqual(contents);
    });

    test('deletes file', async () => {
        const file = await FilePersistence.create(filePath);
        await file.delete();
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(false);
    });

    test('File modified, reload necessary', async () => {
        const file = await FilePersistence.create(filePath);
        expect(await file.reloadNecessary(0)).toBe(true);
    });

    test('File no modified, reload not necessary', async () => {
        const file = await FilePersistence.create(filePath);
        setTimeout(async () => {
            expect(await file.reloadNecessary(Date.now())).toBe(false);
        }, 100);
    });
});
