import { Logger, StubPerformanceClient } from "@azure/msal-common/browser";
import { LocalStorage } from "../../src/cache/LocalStorage.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";

describe("LocalStorage tests", () => {
    const logger = new Logger({});
    const performanceClient = new StubPerformanceClient();
    const idTokenKey = "idTokenKey";
    const idTokenVal = "idTokenVal";
    const accessTokenKey = "accessTokenKey";
    const accessTokenVal = "accessTokenVal";
    const refreshTokenKey = "refreshTokenKey";
    const refreshTokenVal = "refreshTokenVal";
    const accountKey = "accountKey";
    const accountVal = "accountVal";

    beforeEach(async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        await localStorageInstance.setUserData(
            idTokenKey,
            idTokenVal,
            TEST_CONFIG.CORRELATION_ID
        );
        await localStorageInstance.setUserData(
            accessTokenKey,
            accessTokenVal,
            TEST_CONFIG.CORRELATION_ID
        );
        await localStorageInstance.setUserData(
            refreshTokenKey,
            refreshTokenVal,
            TEST_CONFIG.CORRELATION_ID
        );
        await localStorageInstance.setUserData(
            accountKey,
            accountVal,
            TEST_CONFIG.CORRELATION_ID
        );

        localStorage.setItem(
            `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
            JSON.stringify({
                idToken: [idTokenKey],
                accessToken: [accessTokenKey],
                refreshToken: [refreshTokenKey],
            })
        );
        localStorage.setItem("msal.account.keys", JSON.stringify([accountKey]));
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
        document.cookie =
            "msal.cache.encryption=;expires=Thu, 01 Jan 1970 00:00:00 GMT;"; // Clear cookie
    });

    it("initialize creates encryption cookie and clears existing cache", async () => {
        document.cookie =
            "msal.cache.encryption=;expires=Thu, 01 Jan 1970 00:00:00 GMT;"; // Clear existing cookie
        expect(document.cookie).not.toContain("msal.cache.encryption");
        expect(Object.keys(localStorage).length).toEqual(6);

        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        expect(document.cookie).toContain("msal.cache.encryption");
        expect(Object.keys(localStorage).length).toEqual(0);
    });

    it("initialize uses existing encryption cookie and decrypts existing cache", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        expect(document.cookie).toContain("msal.cache.encryption");
        expect(Object.keys(localStorage).length).toEqual(6);
        const encryptedIdToken = localStorage.getItem(idTokenKey) || "";
        expect(JSON.parse(encryptedIdToken)).toHaveProperty("id");
        expect(JSON.parse(encryptedIdToken)).toHaveProperty("data");
        expect(JSON.parse(encryptedIdToken)).toHaveProperty("nonce");
        expect(localStorageInstance.getUserData(idTokenKey)).toEqual(
            idTokenVal
        );

        const encryptedAccessToken = localStorage.getItem(accessTokenKey) || "";
        expect(JSON.parse(encryptedAccessToken)).toHaveProperty("id");
        expect(JSON.parse(encryptedAccessToken)).toHaveProperty("data");
        expect(JSON.parse(encryptedAccessToken)).toHaveProperty("nonce");
        expect(localStorageInstance.getUserData(accessTokenKey)).toEqual(
            accessTokenVal
        );

        const encryptedRefreshToken =
            localStorage.getItem(refreshTokenKey) || "";
        expect(JSON.parse(encryptedRefreshToken)).toHaveProperty("id");
        expect(JSON.parse(encryptedRefreshToken)).toHaveProperty("data");
        expect(JSON.parse(encryptedRefreshToken)).toHaveProperty("nonce");
        expect(localStorageInstance.getUserData(refreshTokenKey)).toEqual(
            refreshTokenVal
        );

        const encryptedAccount = localStorage.getItem(accountKey) || "";
        expect(JSON.parse(encryptedAccount)).toHaveProperty("id");
        expect(JSON.parse(encryptedAccount)).toHaveProperty("data");
        expect(JSON.parse(encryptedAccount)).toHaveProperty("nonce");
        expect(localStorageInstance.getUserData(accountKey)).toEqual(
            accountVal
        );
    });

    it("getItem returns entry from localStorage ", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        localStorage.setItem("testKey", "testVal");
        expect(localStorageInstance.getItem("testKey")).toEqual("testVal");
    });

    it("setItem sets item in localStorage", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        localStorageInstance.setItem("testKey", "testVal");
        expect(localStorage.getItem("testKey")).toEqual("testVal");
    });

    it("removeItem removes item from localStorage and in-memory storage", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        await localStorageInstance.setUserData(
            "testKey",
            "testVal",
            TEST_CONFIG.CORRELATION_ID
        );
        expect(localStorage.getItem("testKey")).toBeTruthy(); // Encrypted
        expect(localStorageInstance.getUserData("testKey")).toBe("testVal"); // From in-memory

        localStorageInstance.removeItem("testKey");
        expect(localStorage.getItem("testKey")).toBeFalsy();
        expect(localStorageInstance.getUserData("testKey")).toBe(null);
    });

    it("clear removes all MSAL items from localStorage and in-memory storage", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        expect(Object.keys(localStorage)).toHaveLength(6);
        expect(localStorageInstance.getUserData(idTokenKey)).toBe(idTokenVal);
        expect(localStorageInstance.getUserData(accessTokenKey)).toBe(
            accessTokenVal
        );
        expect(localStorageInstance.getUserData(refreshTokenKey)).toBe(
            refreshTokenVal
        );
        expect(localStorageInstance.getUserData(accountKey)).toBe(accountVal);

        localStorageInstance.clear();

        expect(Object.keys(localStorage)).toHaveLength(0);
        expect(localStorageInstance.getUserData(idTokenKey)).toBe(null);
        expect(localStorageInstance.getUserData(accessTokenKey)).toBe(null);
        expect(localStorageInstance.getUserData(refreshTokenKey)).toBe(null);
        expect(localStorageInstance.getUserData(accountKey)).toBe(null);
    });

    it("setUserData stores encrypted and getUserData returns unencrypted", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        await localStorageInstance.setUserData(
            "testKey",
            "testVal",
            TEST_CONFIG.CORRELATION_ID
        );

        const encrypted = localStorage.getItem("testKey") || "";
        expect(JSON.parse(encrypted)).toHaveProperty("id");
        expect(JSON.parse(encrypted)).toHaveProperty("data");
        expect(JSON.parse(encrypted)).toHaveProperty("nonce");
        expect(localStorageInstance.getUserData("testKey")).toBe("testVal");
    });

    it("setUserData broadcasts cache update to other LocalStorage instances", async () => {
        const localStorageInstance1 = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        const localStorageInstance2 = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );

        await localStorageInstance1.initialize(TEST_CONFIG.CORRELATION_ID);
        await localStorageInstance2.initialize(TEST_CONFIG.CORRELATION_ID);

        expect(localStorageInstance1.getUserData("testKey")).toBe(null);
        expect(localStorageInstance1.getItem("testKey")).toBe(null);
        expect(localStorageInstance2.getUserData("testKey")).toBe(null);
        expect(localStorageInstance2.getItem("testKey")).toBe(null);

        await localStorageInstance1.setUserData(
            "testKey",
            "testVal",
            TEST_CONFIG.CORRELATION_ID
        );

        expect(localStorageInstance1.getUserData("testKey")).toBe("testVal");
        expect(localStorageInstance1.getItem("testKey")).toBeTruthy();
        await new Promise<void>((resolve, reject) => {
            let attemptsRemaining = 10;
            const callbackId = setInterval(() => {
                try {
                    expect(localStorageInstance2.getUserData("testKey")).toBe(
                        "testVal"
                    );
                    expect(
                        localStorageInstance2.getItem("testKey")
                    ).toBeTruthy();
                    resolve();
                } catch (e) {
                    if (attemptsRemaining === 0) {
                        clearInterval(callbackId);
                        reject(e);
                    } else {
                        attemptsRemaining--;
                    }
                }
            }, 50);
        });
    });

    it("getKeys returns all keys in cache", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        const keys = localStorageInstance.getKeys();
        expect(keys).toHaveLength(6);
        expect(keys).toContain(idTokenKey);
        expect(keys).toContain(accessTokenKey);
        expect(keys).toContain(refreshTokenKey);
        expect(keys).toContain(accountKey);
        expect(keys).toContain(`msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(keys).toContain("msal.account.keys");
    });

    it("containsKey returns true/false if key exists in cache", async () => {
        const localStorageInstance = new LocalStorage(
            TEST_CONFIG.MSAL_CLIENT_ID,
            logger,
            performanceClient
        );
        await localStorageInstance.initialize(TEST_CONFIG.CORRELATION_ID);

        expect(localStorageInstance.containsKey(idTokenKey)).toBe(true);
        expect(localStorageInstance.containsKey("nonExistentKey")).toBe(false);
    });
});
