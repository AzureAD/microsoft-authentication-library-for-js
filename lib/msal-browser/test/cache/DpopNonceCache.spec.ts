/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CacheError,
    DPOP_NONCE_CACHE_KEY_PREFIX,
    DPOP_NONCE_MAX_ENTRIES_PER_TYPE,
    DPOP_NONCE_TTL_MS,
    DpopNonceSource,
    DpopNonceType,
    Logger,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { IWindowStorage } from "../../src/cache/IWindowStorage.js";
import { MemoryStorage } from "../../src/cache/MemoryStorage.js";
import { TokenCache } from "../../src/cache/TokenCache.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";

class QuotaStorage extends MemoryStorage<string> {
    constructor(private readonly maximumEntries: number) {
        super();
    }

    setItem(key: string, value: string): void {
        if (
            !this.containsKey(key) &&
            this.getKeys().length >= this.maximumEntries
        ) {
            const error = new Error("quota");
            error.name = "QuotaExceededError";
            throw error;
        }

        super.setItem(key, value);
    }
}

describe("DPoP nonce cache", () => {
    const clientId = TEST_CONFIG.MSAL_CLIENT_ID;
    let logger: Logger;
    let crypto: CryptoOps;
    let eventHandler: EventHandler;

    beforeEach(() => {
        logger = new Logger({});
        crypto = new CryptoOps(logger);
        eventHandler = new EventHandler(logger);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    function createCacheManager(
        cacheLocation: BrowserCacheLocation,
        storage?: IWindowStorage<string>
    ): BrowserCacheManager {
        return new BrowserCacheManager(
            clientId,
            {
                cacheLocation,
                cacheRetentionDays: 5,
            },
            crypto,
            logger,
            new StubPerformanceClient(),
            eventHandler,
            undefined,
            undefined,
            storage
        );
    }

    it.each([
        BrowserCacheLocation.MemoryStorage,
        BrowserCacheLocation.SessionStorage,
        BrowserCacheLocation.LocalStorage,
    ])("stores opaque resource nonces in %s", async (cacheLocation) => {
        const cacheManager = createCacheManager(cacheLocation);
        const nonce = "  opaque%2Fnonce+/=  ";

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://GRAPH.microsoft.com:443/v1.0/me?query=1#fragment",
            nonce,
            DpopNonceSource.ResourceServer
        );

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://graph.microsoft.com/another/path"
            )
        ).resolves.toBe(nonce);
        expect(cacheManager.getKeys().join("|")).not.toContain(
            "graph.microsoft.com"
        );
    });

    it("works with a custom IWindowStorage implementation", async () => {
        const storage = new MemoryStorage<string>();
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://example.com/path",
            "custom-storage-nonce",
            DpopNonceSource.ResourceServer
        );

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://example.com/other"
            )
        ).resolves.toBe("custom-storage-nonce");
        expect(storage.getKeys()).toHaveLength(1);
    });

    it("keeps authorization-server and resource-server nonce namespaces separate", async () => {
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage
        );

        await cacheManager.setDpopNonce(
            DpopNonceType.AuthorizationServer,
            "https://example.com/oauth2/v2.0/token?query=1",
            "as-nonce",
            DpopNonceSource.AuthorizationServer
        );
        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://example.com/resource",
            "rs-nonce",
            DpopNonceSource.ResourceServer
        );

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.AuthorizationServer,
                "https://EXAMPLE.com:443/oauth2/v2.0/token#fragment"
            )
        ).resolves.toBe("as-nonce");
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://example.com/another-resource"
            )
        ).resolves.toBe("rs-nonce");
    });

    it("preserves invocation order when asynchronous issuer hashing completes later", async () => {
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage
        );
        let resolveFirstHash: (hash: string) => void = () => undefined;
        const firstHash = new Promise<string>((resolve) => {
            resolveFirstHash = resolve;
        });
        const hashSpy = jest
            .spyOn(crypto, "hashString")
            .mockImplementationOnce(() => firstHash)
            .mockResolvedValue("shared-issuer-hash");

        const firstWrite = cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/first",
            "first-nonce",
            DpopNonceSource.ResourceServer
        );
        const secondWrite = cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/second",
            "second-nonce",
            DpopNonceSource.ResourceServer
        );

        await Promise.resolve();
        expect(hashSpy).toHaveBeenCalledTimes(1);

        resolveFirstHash("shared-issuer-hash");
        await Promise.all([firstWrite, secondWrite]);

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource.example.com/next"
            )
        ).resolves.toBe("second-nonce");
    });

    it("preserves invocation order across cache-manager instances sharing storage", async () => {
        const firstCacheManager = createCacheManager(
            BrowserCacheLocation.SessionStorage
        );
        const secondCacheManager = createCacheManager(
            BrowserCacheLocation.SessionStorage
        );
        let resolveFirstHash: (hash: string) => void = () => undefined;
        const firstHash = new Promise<string>((resolve) => {
            resolveFirstHash = resolve;
        });
        const hashSpy = jest
            .spyOn(crypto, "hashString")
            .mockImplementationOnce(() => firstHash)
            .mockResolvedValue("shared-issuer-hash");

        const firstWrite = firstCacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/first",
            "first-nonce",
            DpopNonceSource.ResourceServer,
            100
        );
        const secondWrite = secondCacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/second",
            "second-nonce",
            DpopNonceSource.ResourceServer,
            200
        );

        await Promise.resolve();
        expect(hashSpy).toHaveBeenCalledTimes(1);

        resolveFirstHash("shared-issuer-hash");
        await Promise.all([firstWrite, secondWrite]);

        await expect(
            firstCacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource.example.com/next",
                200
            )
        ).resolves.toBe("second-nonce");
    });

    it("does not overwrite a newer persisted nonce with an older entry", async () => {
        const storage = new MemoryStorage<string>();
        const now = Date.now();
        const firstCacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );
        const secondCacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );

        await firstCacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/first",
            "newer-nonce",
            DpopNonceSource.ResourceServer,
            now
        );
        await secondCacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/second",
            "older-nonce",
            DpopNonceSource.ResourceServer,
            now - 1
        );

        await expect(
            firstCacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource.example.com/next",
                now
            )
        ).resolves.toBe("newer-nonce");
    });

    it("purges malformed, expired, future-dated, and schema-mismatched entries", async () => {
        const storage = new MemoryStorage<string>();
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );
        const now = 2_000_000_000_000;

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://malformed.example/path",
            "malformed-nonce",
            DpopNonceSource.ResourceServer,
            now
        );
        const malformedKey = cacheManager.getDpopNonceKeys()[0];
        storage.setItem(malformedKey, "not-json");
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://malformed.example/other",
                now
            )
        ).resolves.toBeNull();
        expect(storage.containsKey(malformedKey)).toBe(false);

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://expired.example/path",
            "expired-nonce",
            DpopNonceSource.ResourceServer,
            now - DPOP_NONCE_TTL_MS - 1
        );
        const expiredKey = cacheManager.getDpopNonceKeys()[0];
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://expired.example/other",
                now
            )
        ).resolves.toBeNull();
        expect(storage.containsKey(expiredKey)).toBe(false);

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://future.example/path",
            "future-nonce",
            DpopNonceSource.ResourceServer,
            now + 1
        );
        const futureKey = cacheManager.getDpopNonceKeys()[0];
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://future.example/other",
                now
            )
        ).resolves.toBeNull();
        expect(storage.containsKey(futureKey)).toBe(false);

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://schema.example/path",
            "schema-nonce",
            DpopNonceSource.ResourceServer,
            now
        );
        const schemaKey = cacheManager.getDpopNonceKeys()[0];
        const schemaEntity = JSON.parse(storage.getItem(schemaKey) || "{}");
        storage.setItem(
            schemaKey,
            JSON.stringify({ ...schemaEntity, schemaVersion: 0 })
        );
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://schema.example/other",
                now
            )
        ).resolves.toBeNull();
        expect(storage.containsKey(schemaKey)).toBe(false);
    });

    it("purges only a matching old-schema key when the current key is absent", async () => {
        const storage = new MemoryStorage<string>();
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );
        jest.spyOn(crypto, "hashString").mockResolvedValue("matching-hash");
        const encodedClientId = encodeURIComponent(clientId);
        const oldKeyPrefix = `${DPOP_NONCE_CACHE_KEY_PREFIX}.0`;
        const matchingKey = [
            oldKeyPrefix,
            encodedClientId,
            DpopNonceType.ResourceServer,
            "matching-hash",
        ].join("|");
        const otherIssuerKey = [
            oldKeyPrefix,
            encodedClientId,
            DpopNonceType.ResourceServer,
            "other-hash",
        ].join("|");
        const otherTypeKey = [
            oldKeyPrefix,
            encodedClientId,
            DpopNonceType.AuthorizationServer,
            "matching-hash",
        ].join("|");
        const otherClientKey = [
            oldKeyPrefix,
            encodeURIComponent("other-client"),
            DpopNonceType.ResourceServer,
            "matching-hash",
        ].join("|");

        [matchingKey, otherIssuerKey, otherTypeKey, otherClientKey].forEach(
            (key) => storage.setItem(key, "{}")
        );

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://matching.example/path"
            )
        ).resolves.toBeNull();
        expect(storage.containsKey(matchingKey)).toBe(false);
        expect(storage.containsKey(otherIssuerKey)).toBe(true);
        expect(storage.containsKey(otherTypeKey)).toBe(true);
        expect(storage.containsKey(otherClientKey)).toBe(true);
    });

    it("deterministically evicts the oldest entry at the exact capacity boundary", async () => {
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage
        );
        const now = 2_000_000_000_000;
        jest.spyOn(Date, "now").mockReturnValue(now);

        for (let i = 0; i < DPOP_NONCE_MAX_ENTRIES_PER_TYPE; i++) {
            await cacheManager.setDpopNonce(
                DpopNonceType.ResourceServer,
                `https://resource-${i}.example/path`,
                `nonce-${i}`,
                DpopNonceSource.ResourceServer,
                now + i
            );
        }

        expect(
            cacheManager.getDpopNonceKeys(DpopNonceType.ResourceServer)
        ).toHaveLength(DPOP_NONCE_MAX_ENTRIES_PER_TYPE);

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource-new.example/path",
            "new-nonce",
            DpopNonceSource.ResourceServer,
            now + DPOP_NONCE_MAX_ENTRIES_PER_TYPE
        );

        expect(
            cacheManager.getDpopNonceKeys(DpopNonceType.ResourceServer)
        ).toHaveLength(DPOP_NONCE_MAX_ENTRIES_PER_TYPE);
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource-0.example/path",
                now + DPOP_NONCE_MAX_ENTRIES_PER_TYPE
            )
        ).resolves.toBeNull();
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource-1.example/path",
                now + DPOP_NONCE_MAX_ENTRIES_PER_TYPE
            )
        ).resolves.toBe("nonce-1");
    });

    it("uses ordinal cache-key ordering to break equal-timestamp eviction ties", async () => {
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage
        );
        const now = 2_000_000_000_000;
        jest.spyOn(crypto, "hashString").mockImplementation(
            async (issuer: string): Promise<string> => {
                const match = issuer.match(/resource-(\d+|new)/);
                return `hash-${match?.[1] || "unknown"}`;
            }
        );
        jest.spyOn(String.prototype, "localeCompare").mockImplementation(() => {
            throw new Error("locale-sensitive comparison must not be used");
        });

        for (let i = 0; i < DPOP_NONCE_MAX_ENTRIES_PER_TYPE; i++) {
            await cacheManager.setDpopNonce(
                DpopNonceType.ResourceServer,
                `https://resource-${i
                    .toString()
                    .padStart(2, "0")}.example/path`,
                `nonce-${i}`,
                DpopNonceSource.ResourceServer,
                now
            );
        }

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource-new.example/path",
            "new-nonce",
            DpopNonceSource.ResourceServer,
            now
        );

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource-00.example/path",
                now
            )
        ).resolves.toBeNull();
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource-01.example/path",
                now
            )
        ).resolves.toBe("nonce-1");
    });

    it("recovers from quota pressure by evicting nonce entries without touching credential entries", async () => {
        const storage = new QuotaStorage(2);
        storage.setItem("credential-entry", "credential-value");
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://old.example/path",
            "old-nonce",
            DpopNonceSource.ResourceServer
        );
        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://new.example/path",
            "new-nonce",
            DpopNonceSource.ResourceServer
        );

        expect(storage.getItem("credential-entry")).toBe("credential-value");
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://old.example/path"
            )
        ).resolves.toBeNull();
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://new.example/path"
            )
        ).resolves.toBe("new-nonce");
    });

    it("sanitizes custom-storage failures so nonce values are not exposed", async () => {
        const sentinel = "raw-nonce-sentinel";
        const storage = new MemoryStorage<string>();
        jest.spyOn(storage, "setItem").mockImplementation(() => {
            throw new Error(sentinel);
        });
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );

        await expect(
            cacheManager.setDpopNonce(
                DpopNonceType.ResourceServer,
                "https://example.com/path",
                sentinel,
                DpopNonceSource.ResourceServer
            )
        ).rejects.toBeInstanceOf(CacheError);
        await expect(
            cacheManager.setDpopNonce(
                DpopNonceType.ResourceServer,
                "https://example.com/path",
                sentinel,
                DpopNonceSource.ResourceServer
            )
        ).rejects.not.toThrow(sentinel);
    });

    it("clears all nonce types for one client without removing unrelated entries", async () => {
        const storage = new MemoryStorage<string>();
        const firstClient = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );
        const secondClient = new BrowserCacheManager(
            "second-client",
            {
                cacheLocation: BrowserCacheLocation.MemoryStorage,
                cacheRetentionDays: 5,
            },
            crypto,
            logger,
            new StubPerformanceClient(),
            eventHandler,
            undefined,
            undefined,
            storage
        );
        storage.setItem("credential-entry", "credential-value");

        await firstClient.setDpopNonce(
            DpopNonceType.AuthorizationServer,
            "https://login.example.com/oauth2/token",
            "first-as",
            DpopNonceSource.AuthorizationServer
        );
        await firstClient.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/path",
            "first-rs",
            DpopNonceSource.ResourceServer
        );
        await secondClient.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/path",
            "second-rs",
            DpopNonceSource.ResourceServer
        );

        firstClient.clearDpopNonces();

        expect(storage.getItem("credential-entry")).toBe("credential-value");
        expect(firstClient.getDpopNonceKeys()).toHaveLength(0);
        expect(secondClient.getDpopNonceKeys()).toHaveLength(1);
    });

    it("prevents pending writes from repopulating after clear while allowing later writes", async () => {
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage
        );
        let resolvePendingHash: (hash: string) => void = () => undefined;
        const pendingHash = new Promise<string>((resolve) => {
            resolvePendingHash = resolve;
        });
        const hashSpy = jest
            .spyOn(crypto, "hashString")
            .mockImplementationOnce(() => pendingHash)
            .mockResolvedValue("post-clear-hash");

        const pendingWrite = cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://before-clear.example.com/path",
            "before-clear-nonce",
            DpopNonceSource.ResourceServer
        );

        await Promise.resolve();
        expect(hashSpy).toHaveBeenCalledTimes(1);

        cacheManager.clearDpopNonces();
        resolvePendingHash("pre-clear-hash");
        await pendingWrite;

        expect(cacheManager.getDpopNonceKeys()).toHaveLength(0);

        await cacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://after-clear.example.com/path",
            "after-clear-nonce",
            DpopNonceSource.ResourceServer
        );

        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://after-clear.example.com/other"
            )
        ).resolves.toBe("after-clear-nonce");
    });

    it("prevents a pending write from repopulating after another cache-manager instance clears", async () => {
        const writingCacheManager = createCacheManager(
            BrowserCacheLocation.SessionStorage
        );
        const clearingCacheManager = createCacheManager(
            BrowserCacheLocation.SessionStorage
        );
        let resolvePendingHash: (hash: string) => void = () => undefined;
        const pendingHash = new Promise<string>((resolve) => {
            resolvePendingHash = resolve;
        });
        const hashSpy = jest
            .spyOn(crypto, "hashString")
            .mockImplementationOnce(() => pendingHash);

        const pendingWrite = writingCacheManager.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://before-clear.example.com/path",
            "before-clear-nonce",
            DpopNonceSource.ResourceServer
        );

        await Promise.resolve();
        expect(hashSpy).toHaveBeenCalledTimes(1);

        clearingCacheManager.clearDpopNonces();
        resolvePendingHash("pre-clear-hash");
        await pendingWrite;

        expect(writingCacheManager.getDpopNonceKeys()).toHaveLength(0);
    });

    it("full clear removes current-client nonces but preserves another client's nonces", async () => {
        const storage = new MemoryStorage<string>();
        const firstClient = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );
        const secondClient = new BrowserCacheManager(
            "second-client",
            {
                cacheLocation: BrowserCacheLocation.MemoryStorage,
                cacheRetentionDays: 5,
            },
            crypto,
            logger,
            new StubPerformanceClient(),
            eventHandler,
            undefined,
            undefined,
            storage
        );

        await firstClient.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/path",
            "first-client-nonce",
            DpopNonceSource.ResourceServer
        );
        await secondClient.setDpopNonce(
            DpopNonceType.ResourceServer,
            "https://resource.example.com/path",
            "second-client-nonce",
            DpopNonceSource.ResourceServer
        );

        firstClient.clear(TEST_CONFIG.CORRELATION_ID);

        expect(firstClient.getDpopNonceKeys()).toHaveLength(0);
        await expect(
            secondClient.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource.example.com/other"
            )
        ).resolves.toBe("second-client-nonce");
    });

    it("exposes an instance-bound async loadDpopNonce API from PublicClientApplication", async () => {
        const pca = new PublicClientApplication({
            auth: {
                clientId,
            },
            cache: {
                cacheLocation: BrowserCacheLocation.SessionStorage,
            },
        });
        await pca.initialize();

        const tokenCache = pca.getTokenCache();
        expect(tokenCache).toBe(pca.getTokenCache());

        await tokenCache.loadDpopNonce(
            "https://resource.example.com/path",
            "pca-bound-nonce"
        );

        const cacheManager = createCacheManager(
            BrowserCacheLocation.SessionStorage
        );
        await expect(
            cacheManager.getDpopNonce(
                DpopNonceType.ResourceServer,
                "https://resource.example.com/other"
            )
        ).resolves.toBe("pca-bound-nonce");
    });

    it("binds TokenCache to the supplied BrowserCacheManager instance", async () => {
        const storage = new MemoryStorage<string>();
        const cacheManager = createCacheManager(
            BrowserCacheLocation.MemoryStorage,
            storage
        );
        const tokenCache = new TokenCache(cacheManager);

        await tokenCache.loadDpopNonce(
            "https://resource.example.com/path",
            "bound-nonce"
        );

        expect(storage.getKeys()).toHaveLength(1);
    });
});
