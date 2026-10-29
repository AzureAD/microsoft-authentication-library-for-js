/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfigurationErrorCodes,
    Logger,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { EventHandler } from "../../src/event/EventHandler.js";

describe("BrowserCacheManager DPoP nonce state", () => {
    function createCacheManager(
        clientId: string = "client-id",
        performanceClient: StubPerformanceClient = new StubPerformanceClient()
    ): BrowserCacheManager {
        const logger = new Logger({ loggerCallback: jest.fn() });
        return new BrowserCacheManager(
            clientId,
            {
                cacheLocation: BrowserCacheLocation.LocalStorage,
                cacheRetentionDays: 5,
            },
            new CryptoOps(logger),
            logger,
            performanceClient,
            new EventHandler()
        );
    }

    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("stores one nonce per normalized resource origin only in PCA-local memory", () => {
        const cacheManager = createCacheManager();

        cacheManager.setDpopNonce(
            "https://api.contoso.com:443/path?query=value",
            "nonce-1"
        );

        expect(cacheManager.getDpopNonce("https://API.CONTOSO.COM/other")).toBe(
            "nonce-1"
        );
        expect(
            cacheManager.getDpopNonce("https://api.fabrikam.com/path")
        ).toBeUndefined();
        expect(window.localStorage.length).toBe(0);
    });

    it("replaces the matching origin without affecting other origins", () => {
        const cacheManager = createCacheManager();

        cacheManager.setDpopNonce("https://api.contoso.com/a", "nonce-1");
        cacheManager.setDpopNonce("https://api.fabrikam.com/a", "nonce-2");
        cacheManager.setDpopNonce("https://api.contoso.com/b", "nonce-3");

        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBe("nonce-3");
        expect(
            cacheManager.getDpopNonce("https://api.fabrikam.com/resource")
        ).toBe("nonce-2");
    });

    it("does not mutate existing state when validation fails", () => {
        const cacheManager = createCacheManager();
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );

        expect(() =>
            cacheManager.setDpopNonce(
                "https://api.contoso.com/resource",
                "\u0000invalid"
            )
        ).toThrow(
            expect.objectContaining({
                errorCode: ClientConfigurationErrorCodes.invalidDpopNonce,
            })
        );

        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBe("nonce-1");

        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "nonce-2"
        );
        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBe("nonce-2");
    });

    it("evicts the oldest write after reaching 50 origins", () => {
        const performanceClient = new StubPerformanceClient();
        const incrementFieldsSpy = jest.spyOn(
            performanceClient,
            "incrementFields"
        );
        const cacheManager = createCacheManager("client-id", performanceClient);

        cacheManager.setDpopNonce(
            "https://api-0.contoso.com/resource",
            "nonce-0"
        );
        cacheManager.setDpopNonce(
            "https://api-1.contoso.com/resource",
            "nonce-1"
        );
        cacheManager.setDpopNonce(
            "https://api-0.contoso.com/replacement",
            "replacement"
        );
        for (let index = 2; index <= 50; index++) {
            cacheManager.setDpopNonce(
                `https://api-${index}.contoso.com/resource`,
                `nonce-${index}`
            );
        }

        expect(
            cacheManager.getDpopNonce("https://api-1.contoso.com/resource")
        ).toBeUndefined();
        expect(
            cacheManager.getDpopNonce("https://api-0.contoso.com/resource")
        ).toBe("replacement");
        expect(
            cacheManager.getDpopNonce("https://api-50.contoso.com/resource")
        ).toBe("nonce-50");
        expect(incrementFieldsSpy).toHaveBeenCalledWith(
            { "ext.dpopNonceCacheEvictionCount": 1 },
            ""
        );
    });

    it("stores new nonce state after clearing existing entries", () => {
        const cacheManager = createCacheManager();
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );

        cacheManager.clearDpopNonces();
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "nonce-2"
        );

        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBe("nonce-2");
    });

    it("restores a matching redirect handoff once and removes it immediately", () => {
        const performanceClient = new StubPerformanceClient();
        const incrementFieldsSpy = jest.spyOn(
            performanceClient,
            "incrementFields"
        );
        const sourceCache = createCacheManager("client-id", performanceClient);
        sourceCache.setDpopNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );
        sourceCache.saveDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        expect(window.sessionStorage.length).toBe(1);

        const restoredCache = createCacheManager(
            "client-id",
            performanceClient
        );
        restoredCache.restoreDpopNonceRedirectHandoff(
            "https://api.contoso.com/other",
            "request-state",
            "correlation-id"
        );

        expect(window.sessionStorage.length).toBe(0);
        expect(
            restoredCache.getDpopNonce("https://api.contoso.com/resource")
        ).toBe("redirect-nonce");
        expect(incrementFieldsSpy).toHaveBeenNthCalledWith(
            1,
            { "ext.dpopNonceRedirectHandoffSaveCount": 1 },
            "correlation-id"
        );
        expect(incrementFieldsSpy).toHaveBeenNthCalledWith(
            2,
            { "ext.dpopNonceRedirectHandoffRestoreCount": 1 },
            "correlation-id"
        );

        const secondCache = createCacheManager();
        secondCache.restoreDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        expect(
            secondCache.getDpopNonce("https://api.contoso.com/resource")
        ).toBeUndefined();
    });

    it.each([
        ["different-state", "correlation-id", "https://api.contoso.com/path"],
        [
            "request-state",
            "different-correlation",
            "https://api.contoso.com/path",
        ],
        ["request-state", "correlation-id", "https://api.fabrikam.com/path"],
    ])(
        "removes a redirect handoff without restoring on binding mismatch",
        (state, correlationId, resourceRequestUri) => {
            const sourceCache = createCacheManager();
            sourceCache.setDpopNonce(
                "https://api.contoso.com/resource",
                "redirect-nonce"
            );
            sourceCache.saveDpopNonceRedirectHandoff(
                "https://api.contoso.com/resource",
                "request-state",
                "correlation-id"
            );

            const restoredCache = createCacheManager();
            restoredCache.restoreDpopNonceRedirectHandoff(
                resourceRequestUri,
                state,
                correlationId
            );

            expect(window.sessionStorage.length).toBe(0);
            expect(
                restoredCache.getDpopNonce("https://api.contoso.com/resource")
            ).toBeUndefined();
        }
    );

    it("removes an expired redirect handoff without restoring it", () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1000);
        const sourceCache = createCacheManager();
        sourceCache.setDpopNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );
        sourceCache.saveDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        nowSpy.mockReturnValue(1000 + 5 * 60 * 1000 + 1);

        const restoredCache = createCacheManager();
        restoredCache.restoreDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );

        expect(window.sessionStorage.length).toBe(0);
        expect(
            restoredCache.getDpopNonce("https://api.contoso.com/resource")
        ).toBeUndefined();
    });

    it.each([
        [{ nonce: "nonce" }],
        [
            {
                nonce: "nonce",
                resourceServer: "https://api.contoso.com",
                state: "request-state",
                correlationId: "correlation-id",
                expiresAt: Infinity,
            },
        ],
        [
            {
                nonce: "\u0000invalid",
                resourceServer: "https://api.contoso.com",
                state: "request-state",
                correlationId: "correlation-id",
                expiresAt: Date.now() + 5 * 60 * 1000,
            },
        ],
    ])("ignores an invalid redirect handoff", (handoff) => {
        const sourceCache = createCacheManager();
        sourceCache.setDpopNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );
        sourceCache.saveDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        const handoffKey = window.sessionStorage.key(0);
        expect(handoffKey).not.toBeNull();
        window.sessionStorage.setItem(
            handoffKey as string,
            JSON.stringify(handoff)
        );

        const restoredCache = createCacheManager();
        expect(() =>
            restoredCache.restoreDpopNonceRedirectHandoff(
                "https://api.contoso.com/resource",
                "request-state",
                "correlation-id"
            )
        ).not.toThrow();

        expect(window.sessionStorage.length).toBe(0);
        expect(
            restoredCache.getDpopNonce("https://api.contoso.com/resource")
        ).toBeUndefined();
    });

    it("records non-sensitive telemetry when redirect handoff storage operations fail", () => {
        const performanceClient = new StubPerformanceClient();
        const incrementFieldsSpy = jest.spyOn(
            performanceClient,
            "incrementFields"
        );
        const cacheManager = createCacheManager("client-id", performanceClient);
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );

        jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
            throw new Error("storage unavailable");
        });
        cacheManager.saveDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "save-correlation-id"
        );

        jest.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
            throw new Error("storage unavailable");
        });
        cacheManager.restoreDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "restore-correlation-id"
        );

        jest.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(
            () => {
                throw new Error("storage unavailable");
            }
        );
        cacheManager.clearDpopNonceRedirectHandoff("clear-correlation-id");

        expect(incrementFieldsSpy).toHaveBeenNthCalledWith(
            1,
            { "ext.dpopNonceRedirectHandoffSaveFailureCount": 1 },
            "save-correlation-id"
        );
        expect(incrementFieldsSpy).toHaveBeenNthCalledWith(
            2,
            { "ext.dpopNonceRedirectHandoffRestoreFailureCount": 1 },
            "restore-correlation-id"
        );
        expect(incrementFieldsSpy).toHaveBeenNthCalledWith(
            3,
            { "ext.dpopNonceRedirectHandoffClearFailureCount": 1 },
            "clear-correlation-id"
        );
    });

    it("records a save failure when session storage falls back to memory", () => {
        const performanceClient = new StubPerformanceClient();
        const incrementFieldsSpy = jest.spyOn(
            performanceClient,
            "incrementFields"
        );
        const sessionStorageSpy = jest
            .spyOn(window, "sessionStorage", "get")
            .mockImplementation(() => {
                throw new Error("storage unavailable");
            });
        const cacheManager = createCacheManager("client-id", performanceClient);
        sessionStorageSpy.mockRestore();
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );

        cacheManager.saveDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );

        expect(incrementFieldsSpy).toHaveBeenCalledWith(
            { "ext.dpopNonceRedirectHandoffSaveFailureCount": 1 },
            "correlation-id"
        );
        expect(incrementFieldsSpy).not.toHaveBeenCalledWith(
            { "ext.dpopNonceRedirectHandoffSaveCount": 1 },
            "correlation-id"
        );
    });

    it("clears normal nonce state and redirect handoff state", () => {
        const cacheManager = createCacheManager();
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );
        cacheManager.saveDpopNonceRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );

        cacheManager.clearDpopNonces();

        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBeUndefined();
        expect(window.sessionStorage.length).toBe(0);
    });

    it("clears nonce state through the general cache clear path", () => {
        const cacheManager = createCacheManager();
        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );

        cacheManager.clear("correlation-id");

        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBeUndefined();
    });
});
