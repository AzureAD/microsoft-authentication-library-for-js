/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence, PersistenceCachePlugin } from "../../src";
import { Logger } from "@azure/msal-common";

describe('Test PersistenceCachePlugin', () => {
    const filePath = "test-data/test.json";
    const mockCacheData = "mockCacheData";

    const mockPersistence: IPersistence = {
        save: (contents) => {
            return new Promise<void>(resolve => {
                resolve();
            });
        },
        load: () => {
            return new Promise<string>(resolve => {
                resolve(mockCacheData);
            });
        },
        delete: () => {
            return new Promise<boolean>(resolve => {
                resolve();
            });
        },
        reloadNecessary: (lastSync) => {
            return new Promise<boolean>(resolve => {
                resolve(true);
            });
        },
        getLogger(): Logger {
            const loggerOptions = {
                loggerCallback: () => {
                },
                piiLoggingEnabled: false
            };
            return new Logger(loggerOptions);
        },
        getFilePath(): string {
            return filePath;
        }
    };

    test('exports a class', async () => {
        const plugin = new PersistenceCachePlugin(mockPersistence);
        expect(plugin).toBeInstanceOf(PersistenceCachePlugin);
    });

    test('Sets correct initial values', async () => {
        const plugin = new PersistenceCachePlugin(mockPersistence);
        expect(plugin.lockFilePath).toEqual(`${filePath}.lockfile`);
        expect(plugin.currentCache).toEqual(null);
        expect(plugin.lastSync).toEqual(0);
    });

    test('readFromStorage', async () => {
        const loadSpy = jest.spyOn(mockPersistence, "load");
        const reloadNecessarySpy = jest.spyOn(mockPersistence, "reloadNecessary");
        const plugin = new PersistenceCachePlugin(mockPersistence);
        expect(await plugin.readFromStorage()).toEqual(mockCacheData)
        expect(loadSpy).toHaveBeenCalled();
        expect(reloadNecessarySpy).toHaveBeenCalled();
    });

    test('writeToStorage', async () => {
        const loadSpy = jest.spyOn(mockPersistence, "load");
        const saveSpy = jest.spyOn(mockPersistence, "save");
        const plugin = new PersistenceCachePlugin(mockPersistence);
        const callback = (contents) => {
          expect(contents).toEqual(mockCacheData);
          return contents;
        };
        await plugin.writeToStorage(callback);
        expect(loadSpy).toHaveBeenCalled();
        expect(saveSpy).toHaveBeenCalled();
    });
});
