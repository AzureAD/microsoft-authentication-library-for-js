/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as BrowserCrypto from "../../src/crypto/BrowserCrypto";

describe("BrowserCrypto.ts Function Unit Tests", () => {
    const oldWindow = { ...window };
    afterEach(() => {
        window = oldWindow;
        jest.restoreAllMocks();
    });

    it("createNewGuid is of valid format", () => {
        expect(BrowserCrypto.createNewGuid()).toMatch(
            /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i
        );
    });

    it("createNewGuid produces unique values", () => {
        const runs = 1000000;
        const arr: string[] = [];

        for (let ix = 1; ix <= runs; ix++) {
            arr.push(BrowserCrypto.createNewGuid());
        }
        const s: Set<string> = new Set(arr);

        expect(s.size).toEqual(arr.length);
    });

    describe("Math.random() fallback when window.crypto is unavailable", () => {
        let originalCrypto: Crypto;

        beforeEach(() => {
            originalCrypto = window.crypto;
            // Remove window.crypto to simulate Classic JS runtime
            Object.defineProperty(window, "crypto", {
                value: undefined,
                writable: true,
                configurable: true,
            });
        });

        afterEach(() => {
            Object.defineProperty(window, "crypto", {
                value: originalCrypto,
                writable: true,
                configurable: true,
            });
        });

        it("createNewGuid returns valid format without crypto", () => {
            expect(BrowserCrypto.createNewGuid()).toMatch(
                /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i
            );
        });

        it("createNewGuid produces unique values without crypto", () => {
            const runs = 1000;
            const arr: string[] = [];

            for (let ix = 1; ix <= runs; ix++) {
                arr.push(BrowserCrypto.createNewGuid());
            }
            const s: Set<string> = new Set(arr);

            expect(s.size).toEqual(arr.length);
        });
    });
});
