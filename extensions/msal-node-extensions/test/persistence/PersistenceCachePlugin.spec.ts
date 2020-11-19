/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence, PersistenceCachePlugin } from "../../src";
import { Logger, TokenCacheContext, ISerializableTokenCache } from "@azure/msal-common";

describe('Test PersistenceCachePlugin', () => {
    const filePath = "./test.json";
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

    const mockCache: ISerializableTokenCache = {
        serialize: () => {
            return mockCacheData;
        },
        deserialize: (data: string) => {
        }
    }

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

    test('beforeCacheAccess', async () => {
        const loadSpy = jest.spyOn(mockPersistence, "load");
        const cacheSpy = jest.spyOn(mockCache, "deserialize");
        const reloadNecessarySpy = jest.spyOn(mockPersistence, "reloadNecessary");
        const plugin = new PersistenceCachePlugin(mockPersistence);
        const context = new TokenCacheContext(mockCache, false);
        await plugin.beforeCacheAccess(context);
        expect(loadSpy).toHaveBeenCalled();
        expect(cacheSpy).toHaveBeenCalled();
        expect(reloadNecessarySpy).toHaveBeenCalled();
    });

    test('afterCacheAccess', async () => {
        const saveSpy = jest.spyOn(mockPersistence, "save");
        const cacheSpy = jest.spyOn(mockCache, "serialize")
        const plugin = new PersistenceCachePlugin(mockPersistence);
        const context = new TokenCacheContext(mockCache, true);
        await plugin.afterCacheAccess(context);
        expect(saveSpy).toHaveBeenCalled();
        expect(cacheSpy).toHaveBeenCalled();
    });
});
