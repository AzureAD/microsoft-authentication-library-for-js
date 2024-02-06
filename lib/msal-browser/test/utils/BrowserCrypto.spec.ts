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
});
