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
    keyScope: `dpop.${TEST_CONFIG.MSAL_CLIENT_ID}.${TEST_CONFIG.validAuthority}`,
    correlationId: TEST_CONFIG.CORRELATION_ID,
} as const;

const ALTERNATE_DPOP_KEY_CONTEXT = {
    ...DPOP_KEY_CONTEXT,
    keyScope: `dpop.${TEST_CONFIG.MSAL_CLIENT_ID}.${TEST_CONFIG.alternateValidAuthority}`,
};

const SHR_KEY_CONTEXT = {
    tokenBindingKeyType: "shr",
    tokenBindingKeyAlgorithm: TOKEN_BINDING_KEY_ALGORITHMS.RS256,
    correlationId: TEST_CONFIG.CORRELATION_ID,
} as const;

function getCacheKeysByScope(keyScope: string): Array<string> {
    return Object.keys(mockDatabase["TestDB.keys"]).filter((cacheKey) => {
        return mockDatabase["TestDB.keys"][cacheKey]?.keyScope === keyScope;
    });
}

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

    it("provisions and reuses an ES256 scoped key", async () => {
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");

        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );
        const reusedKeyId =
            await tokenBindingKeyManager.provisionTokenBindingKey(
                DPOP_KEY_CONTEXT
            );
        const dpopCacheKeys = getCacheKeysByScope(DPOP_KEY_CONTEXT.keyScope);
        const cachedKeyPair = mockDatabase["TestDB.keys"][dpopCacheKeys[0]];

        expect(reusedKeyId).toBe(keyId);
        expect(generateKeyPairSpy).toHaveBeenCalledTimes(1);
        expect(dpopCacheKeys).toHaveLength(1);
        expect(cachedKeyPair.keyId).toBe(keyId);
        expect(cachedKeyPair.keyScope).toBe(DPOP_KEY_CONTEXT.keyScope);
        expect(cachedKeyPair.tokenBindingKeyType).toBe("dpop");
        expect(cachedKeyPair.tokenBindingKeyAlgorithm).toBe(
            TOKEN_BINDING_KEY_ALGORITHMS.ES256
        );
        expect(cachedKeyPair.privateKey.extractable).toBe(false);
        expect(cachedKeyPair.publicJwk).toBeUndefined();
    }, 10000);

    it("reuses persisted scoped keys when memory contains unrelated keys", async () => {
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");
        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );

        tokenBindingKeyManager = new TokenBindingKeyManager(new Logger({}));
        await tokenBindingKeyManager.provisionTokenBindingKey(SHR_KEY_CONTEXT);

        const reusedKeyId =
            await tokenBindingKeyManager.provisionTokenBindingKey(
                DPOP_KEY_CONTEXT
            );

        expect(reusedKeyId).toBe(keyId);
        expect(generateKeyPairSpy).toHaveBeenCalledTimes(2);
        expect(getCacheKeysByScope(DPOP_KEY_CONTEXT.keyScope)).toHaveLength(1);
    }, 10000);

    it("does not reuse scoped keys with mismatched policy metadata", async () => {
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");
        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );
        const alternateAlgorithmKeyId =
            await tokenBindingKeyManager.provisionTokenBindingKey({
                ...DPOP_KEY_CONTEXT,
                tokenBindingKeyAlgorithm: TOKEN_BINDING_KEY_ALGORITHMS.RS256,
            });
        const alternateTypeKeyId =
            await tokenBindingKeyManager.provisionTokenBindingKey({
                ...DPOP_KEY_CONTEXT,
                tokenBindingKeyType: "shr",
            });

        expect(alternateAlgorithmKeyId).not.toBe(keyId);
        expect(alternateTypeKeyId).not.toBe(keyId);
        expect(generateKeyPairSpy).toHaveBeenCalledTimes(3);
        expect(getCacheKeysByScope(DPOP_KEY_CONTEXT.keyScope)).toHaveLength(3);
    }, 30000);

    it("serializes concurrent scoped key provisioning", async () => {
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");

        const [keyId, concurrentKeyId] = await Promise.all([
            tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT),
            tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT),
        ]);

        expect(concurrentKeyId).toBe(keyId);
        expect(generateKeyPairSpy).toHaveBeenCalledTimes(1);
        expect(getCacheKeysByScope(DPOP_KEY_CONTEXT.keyScope)).toHaveLength(1);
    }, 10000);

    it("does not coalesce distinct scoped requests with colliding dot-joined values", async () => {
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");
        const collidingScopeContext = {
            tokenBindingKeyType: "c",
            tokenBindingKeyAlgorithm: TOKEN_BINDING_KEY_ALGORITHMS.ES256,
            keyScope: "a.b",
            correlationId: TEST_CONFIG.CORRELATION_ID,
        };
        const collidingTypeContext = {
            tokenBindingKeyType: "b.c",
            tokenBindingKeyAlgorithm: TOKEN_BINDING_KEY_ALGORITHMS.ES256,
            keyScope: "a",
            correlationId: TEST_CONFIG.CORRELATION_ID,
        };

        const [scopedKeyId, typedKeyId] = await Promise.all([
            tokenBindingKeyManager.provisionTokenBindingKey(
                collidingScopeContext
            ),
            tokenBindingKeyManager.provisionTokenBindingKey(
                collidingTypeContext
            ),
        ]);

        expect(typedKeyId).not.toBe(scopedKeyId);
        expect(generateKeyPairSpy).toHaveBeenCalledTimes(2);
        expect(
            getCacheKeysByScope(collidingScopeContext.keyScope)
        ).toHaveLength(1);
        expect(getCacheKeysByScope(collidingTypeContext.keyScope)).toHaveLength(
            1
        );
    }, 10000);

    it("isolates and removes keys by caller-owned scope", async () => {
        const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );
        const alternateAuthorityKeyId =
            await tokenBindingKeyManager.provisionTokenBindingKey(
                ALTERNATE_DPOP_KEY_CONTEXT
            );

        expect(alternateAuthorityKeyId).not.toBe(keyId);
        expect(
            getCacheKeysByScope(DPOP_KEY_CONTEXT.keyScope).concat(
                getCacheKeysByScope(ALTERNATE_DPOP_KEY_CONTEXT.keyScope)
            )
        ).toHaveLength(2);
        await expect(
            tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID,
                ALTERNATE_DPOP_KEY_CONTEXT
            )
        ).rejects.toMatchObject({
            errorCode: BrowserAuthErrorCodes.cryptoKeyNotFound,
        });

        await tokenBindingKeyManager.removeTokenBindingKey(
            keyId,
            TEST_CONFIG.CORRELATION_ID,
            DPOP_KEY_CONTEXT
        );

        await expect(
            tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                keyId,
                TEST_CONFIG.CORRELATION_ID,
                DPOP_KEY_CONTEXT
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
                TEST_CONFIG.CORRELATION_ID,
                DPOP_KEY_CONTEXT
            )
        ).resolves.toMatchObject({
            crv: "P-256",
            kty: "EC",
        });
    }, 10000);

    it("clearKeystore removes stored scoped keys", async () => {
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
                TEST_CONFIG.CORRELATION_ID,
                DPOP_KEY_CONTEXT
            )
        ).rejects.toMatchObject({
            errorCode: BrowserAuthErrorCodes.cryptoKeyNotFound,
        });
    }, 10000);
});
