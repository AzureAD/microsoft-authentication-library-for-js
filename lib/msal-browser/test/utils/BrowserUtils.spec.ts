/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TEST_CONFIG, TEST_URIS } from "./StringConstants.js";
import {
    BrowserUtils,
    BrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/index.js";

describe("BrowserUtils.ts Function Unit Tests", () => {
    const oldWindow = { ...window };
    const mockLateMeasurement = {
        add: jest.fn(),
        end: jest.fn(),
        discard: jest.fn(),
    };
    const performanceClient = {
        addFields: jest.fn(),
        startMeasurement: jest.fn().mockReturnValue(mockLateMeasurement),
    } as any;

    beforeEach(() => {
        performanceClient.addFields.mockClear();
        performanceClient.startMeasurement.mockClear();
        mockLateMeasurement.add.mockClear();
        mockLateMeasurement.end.mockClear();
        mockLateMeasurement.discard.mockClear();
    });

    afterEach(() => {
        window = oldWindow;
        jest.restoreAllMocks();
    });

    it("clearHash() clears the window hash", () => {
        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash(window);
        expect(window.location.href.includes("#thisIsAHash")).toBe(false);
    });

    it("clearHash() clears the window hash (office addin)", () => {
        // Office.js sets replaceState to null: https://github.com/OfficeDev/office-js/issues/429
        const oldReplaceState = history.replaceState;
        //@ts-ignore
        history.replaceState = null;

        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash(window);
        expect(window.location.href.includes("#thisIsAHash")).toBe(false);

        history.replaceState = oldReplaceState;
    });

    it("replaceHash replaces the current window hash with the hash from the provided url", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/#";
        const testHash = "#replacementHash";
        BrowserUtils.replaceHash(url + testHash);
        expect(window.location.hash).toBe(testHash);
    });

    it("replaceHash clears the current window hash when provided url does not have hash", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/";
        BrowserUtils.replaceHash(url);
        expect(window.location.hash).toBe("");
    });

    it("isInIframe() returns false if window parent is the same as the current window", () => {
        jest.spyOn(window, "parent", "get").mockReturnValue(window);
        expect(BrowserUtils.isInIframe()).toBe(false);
    });

    it("isInIframe() returns true if window parent is not the same as the current window", () => {
        expect(BrowserUtils.isInIframe()).toBe(false);
        // @ts-ignore
        jest.spyOn(window, "parent", "get").mockReturnValue(null);
        expect(BrowserUtils.isInIframe()).toBe(true);
    });

    it("getCurrentUri() returns current location uri of browser", () => {
        expect(BrowserUtils.getCurrentUri()).toBe(TEST_URIS.TEST_REDIR_URI);
    });

    describe("blockRedirectInIframe", () => {
        it("throws when inside an iframe", (done) => {
            jest.spyOn(window, "parent", "get").mockReturnValue({ ...window });
            try {
                BrowserUtils.blockRedirectInIframe(false);
            } catch (e) {
                const browserAuthError = e as BrowserAuthError;
                expect(browserAuthError.errorCode).toBe(
                    BrowserAuthErrorCodes.redirectInIframe
                );
                done();
            }
        });

        it("doesnt throw when inside an iframe and redirects are allowed", () => {
            jest.spyOn(window, "parent", "get").mockReturnValue({ ...window });
            BrowserUtils.blockRedirectInIframe(true);
        });

        it("doesnt throw when not inside an iframe", () => {
            BrowserUtils.blockRedirectInIframe(false);
        });
    });

    it("adds preconnect to header then removes after some time", () => {
        jest.useFakeTimers();
        BrowserUtils.preconnect(TEST_CONFIG.validAuthority);

        const preconnectLink = document.querySelector("link");
        expect(preconnectLink).toBeTruthy();
        expect(preconnectLink?.getAttribute("rel")).toBe("preconnect");
        expect(preconnectLink?.getAttribute("href")).toBe(
            new URL(TEST_CONFIG.validAuthority).origin
        );

        jest.runAllTimers();
        expect(document.querySelector("link")).toBeFalsy();
    });

    describe("cancelPendingBridgeResponse", () => {
        it("does nothing when no monitor is active", () => {
            const logger = {
                verbose: jest.fn(),
                info: jest.fn(),
                warning: jest.fn(),
                error: jest.fn(),
            } as any;

            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            expect(logger.verbose).not.toHaveBeenCalled();
        });

        it("cancels active bridge monitor and rejects with interactionInProgressCancelled error", async () => {
            const logger = {
                verbose: jest.fn(),
                info: jest.fn(),
                warning: jest.fn(),
                error: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const state = btoa(JSON.stringify({ id: "test-id-123" }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            // Start a bridge response wait
            const waitPromise = BrowserUtils.waitForBridgeResponse(
                5000,
                logger,
                browserCrypto,
                request,
                performanceClient
            );

            // Cancel it
            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            // Should reject with interactionInProgressCancelled error
            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgressCancelled,
            });

            expect(logger.verbose).toHaveBeenCalledWith(
                expect.stringContaining("Cancelling pending bridge monitor"),
                TEST_CONFIG.CORRELATION_ID
            );
        });

        it("clears timeout when cancelling", async () => {
            jest.useFakeTimers();
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const state = btoa(JSON.stringify({ id: "test-id-456" }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

            // Start waiting
            const waitPromise = BrowserUtils.waitForBridgeResponse(
                5000,
                logger,
                browserCrypto,
                request,
                performanceClient
            );

            // Cancel
            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            // Verify clearTimeout was called
            expect(clearTimeoutSpy).toHaveBeenCalled();

            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgressCancelled,
            });

            jest.useRealTimers();
        });

        it("closes BroadcastChannel when cancelling", async () => {
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const state = btoa(JSON.stringify({ id: "test-id-789" }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            // Start waiting
            const waitPromise = BrowserUtils.waitForBridgeResponse(
                5000,
                logger,
                browserCrypto,
                request,
                performanceClient
            );

            // Cancel - this should close the BroadcastChannel internally
            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            // Verify the promise was rejected with the correct error
            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgressCancelled,
            });

            // Verify verbose logging occurred for cancellation
            expect(logger.verbose).toHaveBeenCalledWith(
                expect.stringContaining("Cancelling pending bridge monitor"),
                TEST_CONFIG.CORRELATION_ID
            );
        });
    });

    describe("waitForBridgeResponse with cancellation", () => {
        it("can be cancelled before timeout", async () => {
            jest.useFakeTimers();
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const state = btoa(JSON.stringify({ id: "cancel-test-id" }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            const waitPromise = BrowserUtils.waitForBridgeResponse(
                10000,
                logger,
                browserCrypto,
                request,
                performanceClient
            );

            // Cancel before timeout
            jest.advanceTimersByTime(1000);
            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgressCancelled,
            });

            // Advance time to when timeout would have fired
            jest.advanceTimersByTime(10000);

            jest.useRealTimers();
        });

        it("clears active monitor on successful response", async () => {
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const channelId = "success-test-id";
            const state = btoa(JSON.stringify({ id: channelId }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            // Start the wait
            const waitPromise = BrowserUtils.waitForBridgeResponse(
                5000,
                logger,
                browserCrypto,
                request,
                performanceClient
            );

            // Simulate successful response by posting to the BroadcastChannel
            // We need to do this after waitForBridgeResponse creates the channel
            await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to ensure channel is set up

            const channel = new BroadcastChannel(channelId);
            channel.postMessage({
                v: 1,
                payload: "code=test&state=test",
            });
            channel.close();

            const result = await waitPromise;
            expect(result).toBe("code=test&state=test");

            // Try to cancel after completion - should do nothing since monitor is cleared
            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            // Verify verbose was not called for cancellation (monitor already cleared)
            expect(logger.verbose).toHaveBeenCalledWith(
                "BrowserUtils.waitForBridgeResponse - started",
                "test-correlation-id"
            );
            // Should not have been called with the cancellation message
            expect(logger.verbose).not.toHaveBeenCalledWith(
                expect.stringContaining("Cancelling pending bridge monitor"),
                expect.anything()
            );
        });

        it("clears active monitor on timeout", async () => {
            jest.useFakeTimers();
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const state = btoa(JSON.stringify({ id: "timeout-test-id" }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            const waitPromise = BrowserUtils.waitForBridgeResponse(
                1000,
                logger,
                browserCrypto,
                request,
                performanceClient
            );

            // Advance time to trigger timeout
            jest.advanceTimersByTime(1001);

            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.timedOut,
                subError: "redirect_bridge_timeout",
            });

            // Try to cancel after timeout - should do nothing
            BrowserUtils.cancelPendingBridgeResponse(
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            jest.useRealTimers();
        });

        it("does not start background measurement when response arrives before timeout", async () => {
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const channelId = "pre-timeout-response-test-id";
            const state = btoa(JSON.stringify({ id: channelId }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            const waitPromise = BrowserUtils.waitForBridgeResponse(
                200,
                logger,
                browserCrypto,
                request,
                performanceClient,
                { iframeTimeoutTelemetry: true }
            );

            await new Promise((resolve) => setTimeout(resolve, 5));
            const channel = new BroadcastChannel(channelId);
            channel.postMessage({
                v: 1,
                payload: "code=test&state=test",
            });
            channel.close();

            await expect(waitPromise).resolves.toBe("code=test&state=test");

            expect(performanceClient.startMeasurement).not.toHaveBeenCalled();
            expect(mockLateMeasurement.end).not.toHaveBeenCalled();
            expect(mockLateMeasurement.discard).not.toHaveBeenCalled();
        });

        it("starts a new measurement for the background phase and ends it when a late response arrives", async () => {
            // Use real timers: Node.js worker_threads BroadcastChannel delivers
            // messages asynchronously and is incompatible with jest fake timers.
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const channelId = "late-response-test-id";
            const state = btoa(JSON.stringify({ id: channelId }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            const waitPromise = BrowserUtils.waitForBridgeResponse(
                10, // short iframe timeout
                logger,
                browserCrypto,
                request,
                performanceClient,
                { iframeTimeoutTelemetry: true }
            );

            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.timedOut,
                subError: "redirect_bridge_timeout",
            });

            expect(performanceClient.startMeasurement).toHaveBeenCalledWith(
                "waitForBridgeLateResponse",
                "test-correlation-id"
            );
            expect(performanceClient.addFields).toHaveBeenCalledWith(
                expect.objectContaining({
                    lateResponseExperimentEnabled: true,
                }),
                "test-correlation-id"
            );

            // Allow a small gap before posting the late message
            await new Promise((resolve) => setTimeout(resolve, 5));
            const channel = new BroadcastChannel(channelId);
            channel.postMessage({
                v: 2,
                payload: "code=test&state=test",
            });
            channel.close();

            // Wait for async BroadcastChannel message delivery
            await new Promise((resolve) => setTimeout(resolve, 20));

            expect(mockLateMeasurement.add).not.toHaveBeenCalled();
            expect(mockLateMeasurement.end).toHaveBeenCalledWith({
                success: true,
            });
        });

        it("ends the background measurement with success:false when the extra observation window expires without a response", async () => {
            jest.useFakeTimers();
            const logger = {
                verbose: jest.fn(),
            } as any;

            const browserCrypto = {
                base64Decode: (input: string) => atob(input),
            } as any;

            const state = btoa(JSON.stringify({ id: "late-expiry-test-id" }));
            const request = {
                state,
                correlationId: "test-correlation-id",
            } as any;

            const waitPromise = BrowserUtils.waitForBridgeResponse(
                1000,
                logger,
                browserCrypto,
                request,
                performanceClient,
                { iframeTimeoutTelemetry: true }
            );

            jest.advanceTimersByTime(1000);

            await expect(waitPromise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.timedOut,
                subError: "redirect_bridge_timeout",
            });

            expect(performanceClient.startMeasurement).toHaveBeenCalledWith(
                "waitForBridgeLateResponse",
                "test-correlation-id"
            );

            jest.advanceTimersByTime(60000);

            expect(mockLateMeasurement.end).toHaveBeenCalledWith({
                success: false,
            });
            expect(mockLateMeasurement.discard).not.toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
});
