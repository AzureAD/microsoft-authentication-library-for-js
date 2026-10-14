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
        "identifies user agents with Safari and AppleWebKit markers",
        (userAgent) => {
            expect(isSafari(userAgent)).toBe(true);
        }
    );

    it.each([
        "Mozilla/5.0 Safari/605.1.15",
        "Mozilla/5.0 AppleWebKit/605.1.15",
        "Mozilla/5.0 safari/605.1.15 applewebkit/605.1.15",
    ])("does not identify user agents missing exact markers", (userAgent) => {
        expect(isSafari(userAgent)).toBe(false);
    });

    it("identifies other browsers whose user agent contains both markers", () => {
        expect(
            isSafari(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0"
            )
        ).toBe(true);
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
