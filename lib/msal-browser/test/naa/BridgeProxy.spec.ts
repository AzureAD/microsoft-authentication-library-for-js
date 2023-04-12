/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import BridgeProxy from "../../src/naa/BridgeProxy";
import { IBridgeProxy } from "../../src/naa/IBridgeProxy";
import {
    ACCOUNT_INFO_HOME_ID,
    ACCOUNT_INFO_LOCAL_ID,
    ACCOUNT_INFO_RESPONSE,
    ACCOUNT_INFO_USERNAME,
    BRIDGE_ERROR_ACCOUNT_UNAVAILABLE,
    BRIDGE_ERROR_NAA_UNAVAILABLE,
    BRIDGE_ERROR_NOT_NETWORK,
    BRIDGE_ERROR_PERSISTENT_ERROR_SERVER,
    BRIDGE_ERROR_TRANSIENT_ERROR_SERVER,
    BRIDGE_ERROR_USER_INTERACTION_REQUIRED,
    INIT_BRIDGE_RESPONSE,
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

        it("should throw an error if window.crypto is undefined", () => {
            windowSpy.mockImplementation(() => ({ nestedAppAuthBridge: {} }));
            expect(() => BridgeProxy.create()).rejects.toThrow(
                "window.crypto is undefined"
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
            mockBridge.addResponse("GetInitContext", INIT_BRIDGE_RESPONSE);
            bridgeProxy = await BridgeProxy.create();
        });

        it("should create a BridgeProxy", async () => {
            // Just checking that bridgeProxy was initialized correctly in beforeAll
            expect(bridgeProxy).toBeInstanceOf(BridgeProxy);
        });

        it("should get a token silently", async () => {
            mockBridge.addResponse("GetToken", SILENT_TOKEN_RESPONSE);
            const response = await bridgeProxy.getTokenSilent(
                SILENT_TOKEN_REQUEST
            );
            expect(response.scope).toEqual(SILENT_TOKEN_RESPONSE.scope);
        });

        it("should fail with no network", async () => {
            mockBridge.addResponse("GetToken", BRIDGE_ERROR_NOT_NETWORK);
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NOT_NETWORK);
        });

        it("should fail user interaction required", async () => {
            mockBridge.addResponse(
                "GetToken",
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_USER_INTERACTION_REQUIRED);
        });

        it("should fail user account unavailable", async () => {
            mockBridge.addResponse(
                "GetToken",
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_ACCOUNT_UNAVAILABLE);
        });

        it("should fail with transient error", async () => {
            mockBridge.addResponse(
                "GetToken",
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_TRANSIENT_ERROR_SERVER);
        });

        it("should fail with persistent error", async () => {
            mockBridge.addResponse(
                "GetToken",
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER
            );
            await expect(
                bridgeProxy.getTokenSilent(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_PERSISTENT_ERROR_SERVER);
        });

        it("should fail with nested app auth unavailable", async () => {
            mockBridge.addResponse("GetToken", BRIDGE_ERROR_NAA_UNAVAILABLE);
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
            mockBridge.addResponse("GetInitContext", INIT_BRIDGE_RESPONSE);
            bridgeProxy = await BridgeProxy.create();
        });

        it("should create a BridgeProxy", async () => {
            // Just checking that bridgeProxy was initialized correctly in beforeAll
            expect(bridgeProxy).toBeInstanceOf(BridgeProxy);
        });

        it("should get a token via popup", async () => {
            mockBridge.addResponse("GetTokenPopup", SILENT_TOKEN_RESPONSE);
            const response = await bridgeProxy.getTokenInteractive(
                SILENT_TOKEN_REQUEST
            );
            expect(response.scope).toEqual(SILENT_TOKEN_RESPONSE.scope);
        });

        it("should fail with no network", async () => {
            mockBridge.addResponse("GetTokenPopup", BRIDGE_ERROR_NOT_NETWORK);
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NOT_NETWORK);
        });

        it("should fail user account unavailable", async () => {
            mockBridge.addResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_ACCOUNT_UNAVAILABLE);
        });

        it("should fail with persistent error", async () => {
            mockBridge.addResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_PERSISTENT_ERROR_SERVER);
        });

        it("should fail with nested app auth unavailable", async () => {
            mockBridge.addResponse(
                "GetTokenPopup",
                BRIDGE_ERROR_NAA_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getTokenInteractive(SILENT_TOKEN_REQUEST)
            ).rejects.toMatchObject(BRIDGE_ERROR_NAA_UNAVAILABLE);
        });
    });

    describe("get account info tests", () => {
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
            mockBridge.addResponse("GetInitContext", INIT_BRIDGE_RESPONSE);
            bridgeProxy = await BridgeProxy.create();
        });

        it("should create a BridgeProxy", async () => {
            // Just checking that bridgeProxy was initialized correctly in beforeAll
            expect(bridgeProxy).toBeInstanceOf(BridgeProxy);
        });

        it("get account info by home account id", async () => {
            mockBridge.addResponse("GetAccountByHomeId", ACCOUNT_INFO_RESPONSE);
            const response = await bridgeProxy.getAccountInfo(
                ACCOUNT_INFO_HOME_ID
            );
            expect(response.homeAccountId).toEqual(
                ACCOUNT_INFO_RESPONSE.homeAccountId
            );
        });

        it("get account info by local account id", async () => {
            mockBridge.addResponse(
                "GetAccountByLocalId",
                ACCOUNT_INFO_RESPONSE
            );
            const response = await bridgeProxy.getAccountInfo(
                ACCOUNT_INFO_LOCAL_ID
            );
            expect(response.localAccountId).toEqual(
                ACCOUNT_INFO_RESPONSE.localAccountId
            );
        });

        it("get account info by username", async () => {
            mockBridge.addResponse(
                "GetAccountByUsername",
                ACCOUNT_INFO_RESPONSE
            );
            const response = await bridgeProxy.getAccountInfo(
                ACCOUNT_INFO_USERNAME
            );
            expect(response.username).toEqual(ACCOUNT_INFO_RESPONSE.username);
        });

        it("get account info by username", async () => {
            mockBridge.addResponse(
                "GetAccountByUsername",
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            await expect(
                bridgeProxy.getAccountInfo(ACCOUNT_INFO_USERNAME)
            ).rejects.toMatchObject(BRIDGE_ERROR_ACCOUNT_UNAVAILABLE);
        });
    });
});
