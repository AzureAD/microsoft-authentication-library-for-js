import { Logger } from "@azure/msal-common";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto";
import {
    TOKEN_BINDING_KEY_ALGORITHMS,
    TokenBindingKeyManager,
} from "../../src/crypto/TokenBindingKeyManager";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../../src/error/BrowserAuthError";
import { TEST_CONFIG } from "../utils/StringConstants";

let mockDatabase = {
    "TestDB.keys": {},
};

const DPOP_KEY_CONTEXT = {
    tokenBindingKeyType: "dpop",
    tokenBindingKeyAlgorithm: TOKEN_BINDING_KEY_ALGORITHMS.ES256,
    correlationId: TEST_CONFIG.CORRELATION_ID,
} as const;

describe("TokenBindingKeyManager.ts Unit Tests", () => {
    let tokenBindingKeyManager: TokenBindingKeyManager;

    beforeEach(() => {
        tokenBindingKeyManager = new TokenBindingKeyManager(new Logger({}));

        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
            async () => {}
        );
        jest.spyOn(DatabaseStorage.prototype, "getItem").mockImplementation(
            async (kid: string) => {
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "setItem").mockImplementation(
            async (kid: string, payload: any) => {
                mockDatabase["TestDB.keys"][kid] = payload;
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "removeItem").mockImplementation(
            async (kid: string) => {
                delete mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "containsKey").mockImplementation(
            async (kid: string) => {
                return !!mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "getKeys").mockImplementation(
            async () => {
                return Object.keys(mockDatabase["TestDB.keys"]);
            }
        );
        jest.spyOn(
            DatabaseStorage.prototype,
            "deleteDatabase"
        ).mockImplementation(async () => {
            mockDatabase["TestDB.keys"] = {};
            return true;
        });
    });

    afterEach(async () => {
        await tokenBindingKeyManager.clearKeystore(TEST_CONFIG.CORRELATION_ID);
        jest.restoreAllMocks();
        mockDatabase = {
            "TestDB.keys": {},
        };
    });

    it("provisions an ES256 DPoP key and stores usable key material", async () => {
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");

        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );
        const cachedKeyPair = mockDatabase["TestDB.keys"][keyId];

        expect(generateKeyPairSpy).toHaveBeenCalledTimes(1);
        expect(Object.keys(mockDatabase["TestDB.keys"])).toHaveLength(1);
        expect(cachedKeyPair.keyId).toBe(keyId);
        expect(cachedKeyPair.tokenBindingKeyType).toBe("dpop");
        expect(cachedKeyPair.tokenBindingKeyAlgorithm).toBe(
            TOKEN_BINDING_KEY_ALGORITHMS.ES256
        );
        expect(cachedKeyPair.publicKey.extractable).toBe(true);
        expect(cachedKeyPair.privateKey.extractable).toBe(false);
        expect(cachedKeyPair.publicJwk).toBeUndefined();
        await expect(
            tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID
            )
        ).resolves.toMatchObject({
            crv: "P-256",
            kty: "EC",
        });
    }, 10000);

    it("retrieves stored token-binding keys by keyId across manager instances", async () => {
        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );

        tokenBindingKeyManager = new TokenBindingKeyManager(new Logger({}));

        await expect(
            tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID
            )
        ).resolves.toMatchObject({
            crv: "P-256",
            kty: "EC",
        });
    }, 10000);

    it("removes keys by keyId", async () => {
        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );

        await tokenBindingKeyManager.removeTokenBindingKey(
            keyId,
            TEST_CONFIG.CORRELATION_ID
        );

        await expect(
            tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID
            )
        ).rejects.toMatchObject({
            errorCode: BrowserAuthErrorCodes.cryptoKeyNotFound,
        });
    }, 10000);

    it("shares memory fallback storage when IndexedDB is unavailable", async () => {
        jest.spyOn(DatabaseStorage.prototype, "setItem").mockRejectedValue(
            createBrowserAuthError(
                BrowserAuthErrorCodes.databaseUnavailable,
                TEST_CONFIG.CORRELATION_ID
            )
        );
        jest.spyOn(DatabaseStorage.prototype, "getItem").mockRejectedValue(
            createBrowserAuthError(
                BrowserAuthErrorCodes.databaseUnavailable,
                TEST_CONFIG.CORRELATION_ID
            )
        );
        jest.spyOn(DatabaseStorage.prototype, "getKeys").mockRejectedValue(
            createBrowserAuthError(
                BrowserAuthErrorCodes.databaseUnavailable,
                TEST_CONFIG.CORRELATION_ID
            )
        );
        const provisioningKeyManager = new TokenBindingKeyManager(
            new Logger({})
        );
        const lookupKeyManager = new TokenBindingKeyManager(new Logger({}));

        const keyId = await provisioningKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );

        await expect(
            lookupKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID
            )
        ).resolves.toMatchObject({
            crv: "P-256",
            kty: "EC",
        });
    }, 10000);

    it("clearKeystore removes stored keys", async () => {
        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );

        expect(
            await tokenBindingKeyManager.clearKeystore(
                TEST_CONFIG.CORRELATION_ID
            )
        ).toBe(true);
        await expect(
            tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID
            )
        ).rejects.toMatchObject({
            errorCode: BrowserAuthErrorCodes.cryptoKeyNotFound,
        });
    }, 10000);
});
