/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { promises as fs } from "fs";
import { FilePersistence } from "../../src";
import { FileSystemUtils } from "../util/FileSystemUtils";

describe("Test File Persistence", () => {
    const filePath = "./file-persistence-test.json";

    afterEach(async () => {
        await FileSystemUtils.cleanUpFile(filePath);
    });

    test("exports a class", async () => {
        const file = await FilePersistence.create(filePath);
        expect(file).toBeInstanceOf(FilePersistence);
    });

    test("creates a cache file if doesnt exist", async () => {
        await FilePersistence.create(filePath);
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(true);
    });

    test("Returns correct file path", async () => {
        const file = await FilePersistence.create(filePath);
        expect(file.getFilePath()).toEqual(filePath);
    });

    test("Saves and loads contents", async () => {
        const file = await FilePersistence.create(filePath);
        const contents = "test";
        await file.save(contents);
        expect(await file.load()).toEqual(contents);
    });

    test("Saves and loads contents using buffer", async () => {
        const file = await FilePersistence.create(filePath);
        const contents = Buffer.from("test");
        await file.saveBuffer(contents);
        expect(await file.loadBuffer()).toEqual(contents);
    });

    test("deletes file", async () => {
        const file = await FilePersistence.create(filePath);
        await file.delete();
        expect(await FileSystemUtils.doesFileExist(filePath)).toBe(false);
    });

    test("File modified, reload necessary", async () => {
        const file = await FilePersistence.create(filePath);
        expect(await file.reloadNecessary(0)).toBe(true);
    });

    test("File no modified, reload not necessary", async () => {
        const file = await FilePersistence.create(filePath);
        setTimeout(async () => {
            expect(await file.reloadNecessary(Date.now())).toBe(false);
        }, 100);
    });

    if (process.platform !== "win32") {
        const getFileMode = async (path: string): Promise<number> => {
            const stats = await fs.stat(path);
            return stats.mode & 0o777;
        };

        test("create() sets file permissions to 0o600", async () => {
            await FilePersistence.create(filePath);
            expect(await getFileMode(filePath)).toBe(0o600);
        });

        test("save() sets file permissions to 0o600", async () => {
            const file = await FilePersistence.create(filePath);
            await file.save("test contents");
            expect(await getFileMode(filePath)).toBe(0o600);
        });

        test("saveBuffer() sets file permissions to 0o600", async () => {
            const file = await FilePersistence.create(filePath);
            await file.saveBuffer(Buffer.from("test contents"));
            expect(await getFileMode(filePath)).toBe(0o600);
        });

        test("save() tightens permissions on existing permissive file", async () => {
            await fs.writeFile(filePath, "old data");
            await fs.chmod(filePath, 0o644);
            expect(await getFileMode(filePath)).toBe(0o644);

            const file = await FilePersistence.create(filePath);
            await file.save("new data");
            expect(await getFileMode(filePath)).toBe(0o600);
        });
    }
});
