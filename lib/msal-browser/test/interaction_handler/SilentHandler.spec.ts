/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    LoggerOptions,
    IPerformanceClient,
    Constants,
} from "@azure/msal-common";
import * as SilentHandler from "../../src/interaction_handler/SilentHandler.js";
import { testNavUrl, RANDOM_TEST_GUID } from "../utils/StringConstants.js";
import {
    BrowserAuthError,
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import { StubPerformanceClient } from "@azure/msal-common/browser";

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
        performanceClient = new StubPerformanceClient();
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

        it("Creates a frame", async () => {
            const authFrame = await SilentHandler.initiateCodeRequest(
                testNavUrl,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID
            );
            expect(authFrame instanceof HTMLIFrameElement).toBe(true);
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
                Constants.ResponseMode.FRAGMENT
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
                Constants.ResponseMode.FRAGMENT
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
                Constants.ResponseMode.FRAGMENT
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
    });
});
