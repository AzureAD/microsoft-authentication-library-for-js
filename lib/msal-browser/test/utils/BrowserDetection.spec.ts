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
    const logger = new Logger({});
    const correlationId = "test-correlation-id";

    it.each([safariUserAgent, iPhoneSafariUserAgent])(
        "identifies Safari user agents",
        (userAgent) => {
            expect(isSafari(userAgent)).toBe(true);
        }
    );

    it.each([
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 EdgiOS/137.0 Mobile/15E148 Safari/605.1.15",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/137.0.0.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/138.0 Mobile/15E148 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/120.0.0.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/6.1.0 Mobile/15E148 Safari/9537.53",
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.0.0 Mobile Safari/537.36",
    ])("does not identify non-Safari user agents", (userAgent) => {
        expect(isSafari(userAgent)).toBe(false);
    });

    it("falls back to authorization code flow for EAR in Safari", () => {
        const performanceClient = new StubPerformanceClient();
        const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

        expect(
            shouldUseEar(
                ProtocolMode.EAR,
                logger,
                performanceClient,
                correlationId,
                safariUserAgent
            )
        ).toBe(false);
        expect(addFieldsSpy).toHaveBeenCalledWith(
            { "ext.earFallbackReason": "safari" },
            correlationId
        );
    });

    it("uses EAR in supported browsers", () => {
        const performanceClient = new StubPerformanceClient();
        const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

        expect(
            shouldUseEar(
                ProtocolMode.EAR,
                logger,
                performanceClient,
                correlationId,
                "Mozilla/5.0 Chrome/137.0.0.0 Safari/537.36"
            )
        ).toBe(true);
        expect(addFieldsSpy).not.toHaveBeenCalled();
    });

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
