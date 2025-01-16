/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CookieStorage,
    getCookieExpirationTime,
} from "../../src/cache/CookieStorage.js";

const msalCacheKey = "msal.cookie.key";
const cacheVal = "testValue";

describe("CookieStorage tests", () => {
    let cookieStorage: CookieStorage;

    beforeEach(() => {
        cookieStorage = new CookieStorage();
    });

    afterEach(() => {
        document.cookie = "";
        jest.restoreAllMocks();
    });

    it("setItem", () => {
        const cookieSpy = jest.spyOn(document, "cookie", "set");
        cookieStorage.setItem(msalCacheKey, cacheVal);
        expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
        expect(cookieSpy.mock.calls[0][0]).toContain("SameSite=Lax");
    });

    it("sets secure", () => {
        const cookieSpy = jest.spyOn(document, "cookie", "set");
        cookieStorage.setItem(msalCacheKey, cacheVal, 0, true);
        expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
        expect(cookieSpy.mock.calls[0][0]).toContain("Secure");
    });

    it("sets expiration", () => {
        const cookieSpy = jest.spyOn(document, "cookie", "set");
        const now = new Date().getTime();
        const expirationDays = 5;
        jest.spyOn(Date.prototype, "getTime").mockReturnValue(now); // To ensure expiration calculation in code matches our assertion
        cookieStorage.setItem(msalCacheKey, cacheVal, expirationDays);
        expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
        expect(cookieSpy.mock.calls[0][0]).toContain(
            `expires=${new Date(
                now + expirationDays * 24 * 60 * 60 * 1000
            ).toUTCString()}`
        );
    });

    it("getItem", () => {
        cookieStorage.setItem(msalCacheKey, cacheVal);
        expect(cookieStorage.getItem(msalCacheKey)).toBe(cacheVal);
    });

    it("removeItem", () => {
        cookieStorage.setItem(msalCacheKey, cacheVal);
        expect(cookieStorage.getItem(msalCacheKey)).toEqual(cacheVal);
        cookieStorage.removeItem(msalCacheKey);
        expect(document.cookie).toHaveLength(0);
    });

    it("getKeys", () => {
        cookieStorage.setItem("testKey1", "testVal1");
        cookieStorage.setItem("testKey2", "testVal2", 5);
        cookieStorage.setItem("testKey3", "testVal3", 0, true);
        expect(cookieStorage.getKeys()).toEqual([
            "testKey1",
            "testKey2",
            "testKey3",
        ]);
    });

    it("containsKey", () => {
        cookieStorage.setItem("testKey1", "testVal1");
        cookieStorage.setItem("testKey2", "testVal2", 5);
        cookieStorage.setItem("testKey3", "testVal3", 0, true);
        expect(cookieStorage.containsKey("testKey1")).toBe(true);
        expect(cookieStorage.containsKey("testKey2")).toBe(true);
        expect(cookieStorage.containsKey("testKey3")).toBe(true);
    });

    it("getCookieExpirationTime", () => {
        const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;
        const currentTime = new Date().getTime();
        jest.spyOn(Date.prototype, "getTime").mockReturnValue(currentTime);
        const cookieLifeDays = 1;
        const expectedDate = new Date(
            currentTime + cookieLifeDays * COOKIE_LIFE_MULTIPLIER
        );
        expect(getCookieExpirationTime(cookieLifeDays)).toBe(
            expectedDate.toUTCString()
        );
    });
});
