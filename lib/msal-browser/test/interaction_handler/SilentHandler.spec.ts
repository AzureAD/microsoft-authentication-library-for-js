/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    LoggerOptions,
    IPerformanceClient,
    ServerResponseType,
} from "@azure/msal-common";
import * as SilentHandler from "../../src/interaction_handler/SilentHandler.js";
import { testNavUrl, RANDOM_TEST_GUID } from "../utils/StringConstants.js";
import {
    BrowserAuthError,
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";

const DEFAULT_IFRAME_TIMEOUT_MS = 6000;
const DEFAULT_POLL_INTERVAL_MS = 30;

describe("SilentHandler.ts Unit Tests", () => {
    let browserRequestLogger: Logger;
    let performanceClient: IPerformanceClient;

    beforeEach(() => {
        const loggerOptions: LoggerOptions = {
            loggerCallback: (): void => {},
            piiLoggingEnabled: true,
        };
        browserRequestLogger = new Logger(loggerOptions);
        performanceClient = {
            startMeasurement: jest.fn(),
            endMeasurement: jest.fn(),
            discardMeasurements: jest.fn(),
            removePerformanceCallback: jest.fn(),
            addPerformanceCallback: jest.fn(),
            emitEvents: jest.fn(),
            startPerformanceMeasurement: jest.fn(),
            generateId: jest.fn(),
            calculateQueuedTime: jest.fn(),
            addQueueMeasurement: jest.fn(),
            setPreQueueTime: jest.fn(),
            addFields: jest.fn(),
            incrementFields: jest.fn(),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("initiateAuthRequest()", () => {
        it("throws error if requestUrl is empty", async () => {
            await expect(
                SilentHandler.initiateCodeRequest(
                    "",
                    performanceClient,
                    browserRequestLogger,
                    RANDOM_TEST_GUID
                )
            ).rejects.toMatchObject(
                createBrowserAuthError(BrowserAuthErrorCodes.emptyNavigateUri)
            );
        });

        it(
            "Creates a frame asynchronously when created with default timeout",
            async () => {
                const startTime = Date.now();
                const authFrame = await SilentHandler.initiateCodeRequest(
                    testNavUrl,
                    performanceClient,
                    browserRequestLogger,
                    RANDOM_TEST_GUID,
                    DEFAULT_IFRAME_TIMEOUT_MS
                );
                const endTime = Date.now();
                expect(endTime - startTime).toBeGreaterThanOrEqual(
                    DEFAULT_IFRAME_TIMEOUT_MS
                );
                expect(authFrame instanceof HTMLIFrameElement).toBe(true);
            },
            DEFAULT_IFRAME_TIMEOUT_MS + 1000
        );

        it("Creates a frame synchronously when created with a timeout of 0", async () => {
            const startTime = Date.now();
            const authFrame = await SilentHandler.initiateCodeRequest(
                testNavUrl,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                0
            );
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(DEFAULT_IFRAME_TIMEOUT_MS);
            expect(authFrame instanceof HTMLIFrameElement).toBe(true);
        });

        it("Sets the allow attribute for local network access on iframe", async () => {
            const authFrame = await SilentHandler.initiateCodeRequest(
                testNavUrl,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                0
            );
            expect(authFrame.getAttribute("allow")).toBe(
                "local-network-access *"
            );
        });
    });

    describe("monitorIframeForHash", () => {
        it("times out", (done) => {
            const iframe = {
                contentWindow: {
                    // @ts-ignore
                    location: null, // example of scenario that would never otherwise resolve
                },
            };

            SilentHandler.monitorIframeForHash(
                // @ts-ignore
                iframe,
                500,
                DEFAULT_POLL_INTERVAL_MS,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                ServerResponseType.FRAGMENT
            ).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.monitorWindowTimeout
                    )
                );
                done();
            });
        });

        it("times out when event loop is suspended", (done) => {
            jest.setTimeout(5000);

            const iframe = {
                contentWindow: {
                    location: {
                        href: "about:blank",
                        hash: "",
                    },
                },
            };

            SilentHandler.monitorIframeForHash(
                // @ts-ignore
                iframe,
                2000,
                DEFAULT_POLL_INTERVAL_MS,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                ServerResponseType.FRAGMENT
            ).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.monitorWindowTimeout
                    )
                );
                done();
            });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#/code=hello",
                    hash: "#code=hello",
                };
            }, 1600);

            /**
             * This code mimics the JS event loop being synchonously paused (e.g. tab suspension) midway through polling the iframe.
             * If the event loop is suspended for longer than the configured timeout,
             * the polling operation should throw an error for a timeout.
             */
            const startPauseDelay = 200;
            const pauseDuration = 3000;
            setTimeout(() => {
                Atomics.wait(
                    new Int32Array(new SharedArrayBuffer(4)),
                    0,
                    0,
                    pauseDuration
                );
            }, startPauseDelay);
        });

        it("returns hash", (done) => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "about:blank",
                        hash: "",
                    },
                },
            };

            SilentHandler.monitorIframeForHash(
                // @ts-ignore
                iframe,
                1000,
                DEFAULT_POLL_INTERVAL_MS,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                ServerResponseType.FRAGMENT
            ).then((hash: string) => {
                expect(hash).toEqual("#code=hello");
                done();
            });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#code=hello",
                    hash: "#code=hello",
                };
            }, 500);
        });

        it("resolves successfully and verifies iframeTickCnt is incremented", (done) => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "about:blank",
                        hash: "",
                    },
                },
            };

            SilentHandler.monitorIframeForHash(
                // @ts-ignore
                iframe,
                2000,
                DEFAULT_POLL_INTERVAL_MS,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                ServerResponseType.FRAGMENT
            ).then((hash: string) => {
                expect(hash).toEqual("#code=response");
                expect(performanceClient.addFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        iframeTickCount: expect.any(Number),
                        crossOriginTickCount: expect.any(Number),
                    }),
                    RANDOM_TEST_GUID
                );
                const callArgs = (
                    performanceClient.addFields as jest.Mock
                ).mock.calls.find(
                    (call) => call[0].iframeTickCount !== undefined
                );
                expect(callArgs[0].iframeTickCount).toBeGreaterThan(0);
                done();
            });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#code=response",
                    hash: "#code=response",
                };
            }, 300);
        });

        it("increments crossOriginTickCnt on cross-origin access and reports on timeout", (done) => {
            jest.setTimeout(3000);

            const iframe = {
                contentWindow: {
                    get location() {
                        throw new Error("Cross-origin access denied");
                    },
                },
            };

            SilentHandler.monitorIframeForHash(
                // @ts-ignore
                iframe,
                500,
                DEFAULT_POLL_INTERVAL_MS,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID,
                ServerResponseType.FRAGMENT
            ).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.monitorWindowTimeout
                    )
                );
                expect(performanceClient.addFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        iframeTickCount: expect.any(Number),
                        crossOriginTickCount: expect.any(Number),
                    }),
                    RANDOM_TEST_GUID
                );
                const callArgs = (
                    performanceClient.addFields as jest.Mock
                ).mock.calls.find(
                    (call) => call[0].crossOriginTickCount !== undefined
                );
                expect(callArgs[0].crossOriginTickCount).toBeGreaterThan(0);
                done();
            });
        });
    });
});
