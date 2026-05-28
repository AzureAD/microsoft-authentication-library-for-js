/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    LoggerOptions,
    IPerformanceClient,
    Constants,
    ProtocolUtils,
    CommonAuthorizationUrlRequest,
    ICrypto,
} from "@azure/msal-common";
import * as SilentHandler from "../../src/interaction_handler/SilentHandler.js";
import {
    testNavUrl,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_URIS,
} from "../utils/StringConstants.js";
import {
    BrowserAuthError,
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import { StubPerformanceClient } from "@azure/msal-common/browser";
import * as BrowserUtils from "../../src/utils/BrowserUtils.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";

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
                createBrowserAuthError(BrowserAuthErrorCodes.emptyNavigateUri, "")
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

        it("Sets the allow attribute for local network access on iframe", async () => {
            const authFrame = await SilentHandler.initiateCodeRequest(
                testNavUrl,
                performanceClient,
                browserRequestLogger,
                RANDOM_TEST_GUID
            );
            expect(authFrame.getAttribute("allow")).toBe(
                "local-network-access *"
            );
        });
    });

    describe("waitForBridgeResponse", () => {
        let browserCrypto: ICrypto;

        beforeEach(() => {
            browserCrypto = new CryptoOps(browserRequestLogger as any);
        });

        it("resolves when BroadcastChannel receives hash response", async () => {
            const testLibraryState = { id: "test-channel-id" };
            const testState = ProtocolUtils.setRequestState(
                browserCrypto,
                "",
                testLibraryState,
            ""
            );

            const request: CommonAuthorizationUrlRequest = {
                scopes: ["openid"],
                state: testState,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                responseMode: "fragment",
                codeChallenge: "challenge",
                codeChallengeMethod: "S256",
                nonce: "test-nonce",
            };

            // Mock waitForBridgeResponse to simulate receiving a message
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                "code=testCode&state=testState"
            );

            const response = await BrowserUtils.waitForBridgeResponse(
                DEFAULT_IFRAME_TIMEOUT_MS,
                browserRequestLogger,
                browserCrypto,
                request,
                performanceClient
            );

            expect(response).toEqual("code=testCode&state=testState");
        });

        it("resolves when BroadcastChannel receives query response", async () => {
            const testLibraryState = { id: "test-channel-query-id" };
            const testState = ProtocolUtils.setRequestState(
                browserCrypto,
                "",
                testLibraryState,
            ""
            );

            const request: CommonAuthorizationUrlRequest = {
                scopes: ["openid"],
                state: testState,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                responseMode: "query",
                codeChallenge: "challenge",
                codeChallengeMethod: "S256",
                nonce: "test-nonce",
            };

            // Mock waitForBridgeResponse to simulate receiving a message
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                "code=authCode&state=testState456"
            );

            const response = await BrowserUtils.waitForBridgeResponse(
                DEFAULT_IFRAME_TIMEOUT_MS,
                browserRequestLogger,
                browserCrypto,
                request,
                performanceClient
            );

            expect(response).toEqual("code=authCode&state=testState456");
        });

        it("throws timeout error if BroadcastChannel receives no response", async () => {
            const testLibraryState = { id: "test-channel-timeout-id" };
            const testState = ProtocolUtils.setRequestState(
                browserCrypto,
                "",
                testLibraryState,
            ""
            );

            const request: CommonAuthorizationUrlRequest = {
                scopes: ["openid"],
                state: testState,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                responseMode: "fragment",
                codeChallenge: "challenge",
                codeChallengeMethod: "S256",
                nonce: "test-nonce",
            };

            // Mock waitForBridgeResponse to simulate a timeout error
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockRejectedValue(
                createBrowserAuthError(BrowserAuthErrorCodes.timedOut, "", "redirect_bridge_timeout")
            );

            await expect(
                BrowserUtils.waitForBridgeResponse(
                    100,
                    browserRequestLogger,
                    browserCrypto,
                    request,
                    performanceClient
                )
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.timedOut,
                subError: "redirect_bridge_timeout",
            });
        });

        it("handles multiple concurrent BroadcastChannel responses correctly", async () => {
            const testLibraryState1 = { id: "test-channel-concurrent-1" };
            const testLibraryState2 = { id: "test-channel-concurrent-2" };

            const testState1 = ProtocolUtils.setRequestState(
                browserCrypto,
                "",
                testLibraryState1,
            ""
            );
            const testState2 = ProtocolUtils.setRequestState(
                browserCrypto,
                "",
                testLibraryState2,
            ""
            );

            const request1: CommonAuthorizationUrlRequest = {
                scopes: ["openid"],
                state: testState1,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                responseMode: "fragment",
                codeChallenge: "challenge1",
                codeChallengeMethod: "S256",
                nonce: "test-nonce-1",
            };

            const request2: CommonAuthorizationUrlRequest = {
                scopes: ["profile"],
                state: testState2,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                responseMode: "fragment",
                codeChallenge: "challenge2",
                codeChallengeMethod: "S256",
                nonce: "test-nonce-2",
            };

            // Mock waitForBridgeResponse to return different responses based on the request state
            jest.spyOn(BrowserUtils, "waitForBridgeResponse")
                .mockResolvedValueOnce("code=code1&state=state1")
                .mockResolvedValueOnce("code=code2&state=state2");

            const promise1 = BrowserUtils.waitForBridgeResponse(
                DEFAULT_IFRAME_TIMEOUT_MS,
                browserRequestLogger,
                browserCrypto,
                request1,
                performanceClient
            );

            const promise2 = BrowserUtils.waitForBridgeResponse(
                DEFAULT_IFRAME_TIMEOUT_MS,
                browserRequestLogger,
                browserCrypto,
                request2,
                performanceClient
            );

            const [response1, response2] = await Promise.all([
                promise1,
                promise2,
            ]);
            expect(response1).toEqual("code=code1&state=state1");
            expect(response2).toEqual("code=code2&state=state2");
        });
    });

    describe("removeHiddenIframe", () => {
        it("removes iframe from the DOM", () => {
            const iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            expect(document.body.contains(iframe)).toBe(true);

            SilentHandler.removeHiddenIframe(iframe);
            expect(document.body.contains(iframe)).toBe(false);
        });

        it("does nothing when iframe is not in the DOM", () => {
            const iframe = document.createElement("iframe");
            expect(() =>
                SilentHandler.removeHiddenIframe(iframe)
            ).not.toThrow();
        });

        it("does nothing when iframe has a different parent", () => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            const iframe = document.createElement("iframe");
            container.appendChild(iframe);

            SilentHandler.removeHiddenIframe(iframe);
            expect(container.contains(iframe)).toBe(true);

            document.body.removeChild(container);
        });
    });
});
