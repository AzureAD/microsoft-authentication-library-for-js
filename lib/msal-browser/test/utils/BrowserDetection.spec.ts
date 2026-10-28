/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    ProtocolMode,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { isSafari, shouldUseEar } from "../../src/utils/BrowserDetection.js";

describe("BrowserDetection", () => {
    const safariUserAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
    const iPhoneSafariUserAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
    const safariUserAgents = [
        safariUserAgent,
        iPhoneSafariUserAgent,
        "Mozilla/5.0 Safari/605.1.15",
        "Mozilla/5.0 AppleWebKit/605.1.15",
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Version/4.0 Mobile Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/137.0.0.0 Safari/537.36",
        "Mozilla/5.0 AppleWebKit/605.1.15 SkypeShell/1.0",
    ];
    const nonSafariUserAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 EdgiOS/137.0 Mobile/15E148 Safari/605.1.15",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/137.0.0.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/138.0 Mobile/15E148 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/120.0.0.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/6.1.0 Mobile/15E148 Safari/9537.53",
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.0.0 Mobile Safari/537.36",
    ];
    const logger = new Logger({});
    const correlationId = "test-correlation-id";
    const userAgentDataDescriptor = Object.getOwnPropertyDescriptor(
        navigator,
        "userAgentData"
    );

    afterEach(() => {
        jest.restoreAllMocks();
        if (userAgentDataDescriptor) {
            Object.defineProperty(
                navigator,
                "userAgentData",
                userAgentDataDescriptor
            );
        } else {
            Reflect.deleteProperty(navigator, "userAgentData");
        }
    });

    it.each(safariUserAgents)(
        "identifies Safari using OWA's fallback: %s",
        (userAgent) => {
            expect(isSafari(userAgent)).toBe(true);
        }
    );

    it.each([
        "",
        "Mozilla/5.0",
        "SkypeShell/1.0",
        "Mozilla/5.0 safari/605.1.15 applewebkit/605.1.15",
    ])(
        "does not identify user agents without either exact Safari marker",
        (userAgent) => {
            expect(isSafari(userAgent)).toBe(false);
        }
    );

    it.each([
        "OPR/",
        "OPiOS",
        "PhantomJS",
        "SamsungBrowser",
        "Edge",
        "EdgiOS",
        "EdgA",
        "Edg",
        "Electron",
        "CriOS",
        "Chrome",
        "Trident",
        "FxiOS",
        "Firefox",
    ])("checks %s before the Safari/WebKit fallback", (marker) => {
        expect(isSafari(`${safariUserAgent} ${marker}`)).toBe(false);
        expect(isSafari(`AppleWebKit/605.1.15 ${marker}`)).toBe(false);
    });

    it.each([
        { brands: [{ brand: "Microsoft Edge" }] },
        { brands: [undefined, {}, { brand: "Microsoft Edge" }] },
    ])("checks Edge client hints before Safari: %j", (userAgentData) => {
        Object.defineProperty(navigator, "userAgentData", {
            configurable: true,
            value: userAgentData,
        });
        expect(isSafari(safariUserAgent)).toBe(false);
        expect(
            shouldUseEar(
                ProtocolMode.EAR,
                logger,
                new StubPerformanceClient(),
                correlationId,
                safariUserAgent
            )
        ).toBe(true);
    });

    it.each([
        undefined,
        {},
        { brands: [] },
        { brands: [{ brand: "Chromium" }] },
    ])(
        "uses Safari markers when Edge client hints are absent: %j",
        (userAgentData) => {
            Object.defineProperty(navigator, "userAgentData", {
                configurable: true,
                value: userAgentData,
            });
            expect(isSafari(safariUserAgent)).toBe(true);
        }
    );

    it("uses the current navigator user agent by default", () => {
        jest.spyOn(navigator, "userAgent", "get").mockReturnValue(
            safariUserAgent
        );
        expect(isSafari()).toBe(true);
    });

    it.each(nonSafariUserAgents)(
        "does not identify non-Safari user agents: %s",
        (userAgent) => {
            expect(isSafari(userAgent)).toBe(false);
        }
    );

    it.each(safariUserAgents)(
        "falls back to authorization code flow for EAR in Safari: %s",
        (userAgent) => {
            const performanceClient = new StubPerformanceClient();
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

            expect(
                shouldUseEar(
                    ProtocolMode.EAR,
                    logger,
                    performanceClient,
                    correlationId,
                    userAgent
                )
            ).toBe(false);
            expect(addFieldsSpy).toHaveBeenCalledWith(
                { "ext.earFallbackReason": "safari" },
                correlationId
            );
        }
    );

    it.each(nonSafariUserAgents)(
        "uses EAR in supported browsers: %s",
        (userAgent) => {
            const performanceClient = new StubPerformanceClient();
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

            expect(
                shouldUseEar(
                    ProtocolMode.EAR,
                    logger,
                    performanceClient,
                    correlationId,
                    userAgent
                )
            ).toBe(true);
            expect(addFieldsSpy).not.toHaveBeenCalled();
        }
    );

    it("uses authorization code flow when EAR is not configured", () => {
        const performanceClient = new StubPerformanceClient();

        expect(
            shouldUseEar(
                ProtocolMode.AAD,
                logger,
                performanceClient,
                correlationId,
                safariUserAgent
            )
        ).toBe(false);
    });
});
