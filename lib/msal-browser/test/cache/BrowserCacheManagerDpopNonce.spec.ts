/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, StubPerformanceClient } from "@azure/msal-common/browser";
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

    it("stores and returns an opaque nonce unchanged", () => {
        const cacheManager = createCacheManager();
        const opaqueNonce = `\u0000${"\u00e9".repeat(1025)} " \\`;

        cacheManager.setDpopNonce(
            "https://api.contoso.com/resource",
            opaqueNonce
        );

        expect(
            cacheManager.getDpopNonce("https://api.contoso.com/resource")
        ).toBe(opaqueNonce);
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
