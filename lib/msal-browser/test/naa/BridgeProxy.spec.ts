/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import BridgeProxy from "../../src/naa/BridgeProxy";
import { IBridgeProxy } from "../../src/naa/IBridgeProxy";
import {
    ACCOUNT_INFO_RESPONSE,
    BRIDGE_ERROR_ACCOUNT_UNAVAILABLE,
    BRIDGE_ERROR_NAA_UNAVAILABLE,
    BRIDGE_ERROR_NOT_NETWORK,
    BRIDGE_ERROR_PERSISTENT_ERROR_SERVER,
    BRIDGE_ERROR_TRANSIENT_ERROR_SERVER,
    BRIDGE_ERROR_USER_INTERACTION_REQUIRED,
    INIT_CONTEXT_RESPONSE,
    SILENT_TOKEN_REQUEST,
    SILENT_TOKEN_RESPONSE,
} from "./BridgeProxyConstants";
import MockBridge from "./MockBridge";

describe("BridgeProxy tests", () => {
    describe("create tests", () => {
        let windowSpy: jest.SpyInstance;

        beforeEach(() => {
            windowSpy = jest.spyOn(global, "window", "get");
        });

        afterEach(() => {
            windowSpy.mockRestore();
        });

        it("should throw an error if window is undefined", () => {
            windowSpy = jest.spyOn(global, "window", "get");
            windowSpy.mockImplementation(() => undefined);
            expect(() => BridgeProxy.create()).rejects.toThrow(
                "window is undefined"
            );
            windowSpy.mockRestore();
        });

        it("should throw an error if window.nestedAppAuthBridge is undefined", () => {
            windowSpy.mockImplementation(() => ({ crypto: {} }));
            expect(() => BridgeProxy.create()).rejects.toThrow(
                "window.nestedAppAuthBridge is undefined"
            );
        });
    });

    describe("get token silent tests", () => {
        let bridgeProxy: IBridgeProxy;
        let mockBridge: MockBridge;

        /**
         * @remarks This is a workaround for the fact that the bridge is not available in the test environment
         * @remarks Jest provides the MockBridge implementation via the jest config
         *
         * @remarks Add an expected response to the mockBridge providing the bridge method that the response is for
         */
        beforeAll(async () => {
            mockBridge = window.nestedAppAuthBridge as MockBridge;
            mockBridge.addInitContextResponse(
                "GetInitContext",
                INIT_CONTEXT_RESPONSE
            );
            bridgeProxy = await BridgeProxy.create();
        });

        it("should create a BridgeProxy", async () => {
            // Just checking that bridgeProxy was initialized correctly in beforeAll
            expect(bridgeProxy).toBeInstanceOf(BridgeProxy);
        });

        it("should get a token silently", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
            const response = await bridgeProxy.getTokenSilent(
                SILENT_TOKEN_REQUEST
            );
            expect(response.token.scope).toEqual(
                SILENT_TOKEN_RESPONSE.token?.scope
            );
        });

        it("should fail with no network", async () => {
            mockBridge.addErrorResponse("GetToken", BRIDGE_ERROR_NOT_NETWORK);
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NOT_NETWORK);
        });

        it("should fail user interaction required", async () => {
            mockBridge.addErrorResponse(
                "GetToken",
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_USER_INTERACTION_REQUIRED);
        });

        it("should fail user account unavailable", async () => {
            mockBridge.addErrorResponse(
                "GetToken",
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_ACCOUNT_UNAVAILABLE);
        });

        it("should fail with transient error", async () => {
            mockBridge.addErrorResponse(
                "GetToken",
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_TRANSIENT_ERROR_SERVER);
        });

        it("should fail with persistent error", async () => {
            mockBridge.addErrorResponse(
                "GetToken",
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_PERSISTENT_ERROR_SERVER);
        });

        it("should fail with nested app auth unavailable", async () => {
            mockBridge.addErrorResponse(
                "GetToken",
                BRIDGE_ERROR_NAA_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NAA_UNAVAILABLE);
        });
    });

    describe("get token popup tests", () => {
        let bridgeProxy: IBridgeProxy;
        let mockBridge: MockBridge;

        /**
         * @remarks This is a workaround for the fact that the bridge is not available in the test environment
         * @remarks Jest provides the MockBridge implementation via the jest config
         *
         * @remarks Add an expected response to the mockBridge providing the bridge method that the response is for
         */
        beforeAll(async () => {
            mockBridge = window.nestedAppAuthBridge as MockBridge;
            mockBridge.addInitContextResponse(
                "GetInitContext",
                INIT_CONTEXT_RESPONSE
            );
            bridgeProxy = await BridgeProxy.create();
        });

        it("should create a BridgeProxy", async () => {
            // Just checking that bridgeProxy was initialized correctly in beforeAll
            expect(bridgeProxy).toBeInstanceOf(BridgeProxy);
        });

        it("should get a token via popup", async () => {
            mockBridge.addAuthResultResponse(
                "GetTokenPopup",
                SILENT_TOKEN_RESPONSE
            );
            const response = await bridgeProxy.getTokenInteractive(
                SILENT_TOKEN_REQUEST
            );
            expect(response.token.scope).toEqual(
                SILENT_TOKEN_RESPONSE.token?.scope
            );
        });

        it("should fail with no network", async () => {
            mockBridge.addErrorResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_NOT_NETWORK
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NOT_NETWORK);
        });

        it("should fail user account unavailable", async () => {
            mockBridge.addErrorResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_ACCOUNT_UNAVAILABLE);
        });

        it("should fail with persistent error", async () => {
            mockBridge.addErrorResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_PERSISTENT_ERROR_SERVER);
        });

        it("should fail with nested app auth unavailable", async () => {
            mockBridge.addErrorResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_NAA_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NAA_UNAVAILABLE);
        });
    });
    describe("get account context tests", () => {
        let bridgeProxy: IBridgeProxy;
        let mockBridge: MockBridge;

        /**
         * @remarks This is a workaround for the fact that the bridge is not available in the test environment
         * @remarks Jest provides the MockBridge implementation via the jest config
         *
         * @remarks Add an expected response to the mockBridge providing the bridge method that the response is for
         */
        beforeAll(async () => {
            mockBridge = window.nestedAppAuthBridge as MockBridge;
            mockBridge.addInitContextResponse(
                "GetInitContext",
                INIT_CONTEXT_RESPONSE
            );
            bridgeProxy = await BridgeProxy.create();
        });

        it("should create a BridgeProxy", async () => {
            // Just checking that bridgeProxy was initialized correctly in beforeAll
            expect(bridgeProxy).toBeInstanceOf(BridgeProxy);
        });

        it("get account context", async () => {
            expect(bridgeProxy.getAccountContext()).toEqual(
                INIT_CONTEXT_RESPONSE.accountContext
            );
        });
    });
});
