/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthError,
    AuthError,
    ServerError,
    ICrypto,
    InteractionRequiredAuthError,
    AuthenticationResult,
    Logger,
} from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { NestedAppAuthAdapter } from "../../src/naa/mapping/NestedAppAuthAdapter";
import {
    BRIDGE_ERROR_ACCOUNT_UNAVAILABLE,
    BRIDGE_ERROR_DISABLED,
    BRIDGE_ERROR_NAA_UNAVAILABLE,
    BRIDGE_ERROR_NOT_NETWORK,
    BRIDGE_ERROR_PERSISTENT_ERROR_SERVER,
    BRIDGE_ERROR_TRANSIENT_ERROR_SERVER,
    BRIDGE_ERROR_USER_CANCEL,
    BRIDGE_ERROR_USER_INTERACTION_REQUIRED,
    SILENT_TOKEN_RESPONSE,
    SILENT_TOKEN_REQUEST,
    POPUP_REQUEST,
    NAA_CLIENT_ID,
    NAA_SCOPE,
    REDIRECT_REQUEST,
} from "./BridgeProxyConstants";
import { TokenRequest } from "../../src/naa/TokenRequest";

describe("NestedAppAuthAdapter tests", () => {
    let nestedAppAuthAdapter: NestedAppAuthAdapter;
    beforeAll(() => {
        // All logger options properties are optional... so passing empty object
        const logger = new Logger({});
        const crypto: ICrypto = new CryptoOps(logger);
        nestedAppAuthAdapter = new NestedAppAuthAdapter(
            NAA_CLIENT_ID,
            crypto,
            logger
        );
    });

    describe("to TokenRequest tests", () => {
        it("PopupRequest to TokenRequest", () => {
            const result: TokenRequest =
                nestedAppAuthAdapter.toNaaTokenRequest(POPUP_REQUEST);
            expect(result.clientId).toBe(NAA_CLIENT_ID);
            expect(result.correlationId).toBe(
                SILENT_TOKEN_REQUEST.correlationId
            );
            expect(result.scope).toBe(NAA_SCOPE);
        });

        it("RedirectRequest to TokenRequest", () => {
            const result: TokenRequest =
                nestedAppAuthAdapter.toNaaTokenRequest(REDIRECT_REQUEST);
            expect(result.clientId).toBe(NAA_CLIENT_ID);
            expect(result.correlationId).toBe(
                SILENT_TOKEN_REQUEST.correlationId
            );
            expect(result.scope).toBe(NAA_SCOPE);
        });
    });

    describe("to AuthenticationResult from TokenResponse tests", () => {
        it("TokenResponse to AuthenticationResult", () => {
            const result: AuthenticationResult =
                nestedAppAuthAdapter.fromNaaTokenResponse(
                    SILENT_TOKEN_REQUEST,
                    SILENT_TOKEN_RESPONSE
                );
            expect(result.authority).toBe(
                SILENT_TOKEN_RESPONSE.account.environment
            );
            expect(result.uniqueId).toBe(
                SILENT_TOKEN_RESPONSE.account.homeAccountId
            );
            expect(result.tenantId).toBe(
                SILENT_TOKEN_RESPONSE.account.tenantId
            );
            expect(result.accessToken).toBe(SILENT_TOKEN_RESPONSE.access_token);
            expect(result.account?.environment).toBe(
                SILENT_TOKEN_RESPONSE.account.environment
            );
            expect(result.account?.homeAccountId).toBe(
                SILENT_TOKEN_RESPONSE.account.homeAccountId
            );
            expect(result.account?.localAccountId).toBe(
                SILENT_TOKEN_RESPONSE.account.localAccountId
            );
            expect(result.account?.name).toBe(
                SILENT_TOKEN_RESPONSE.account.name
            );
        });
    });

    describe("to MSAL.js Error from BridgeError tests", () => {
        // No Network
        it("no network bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_NOT_NETWORK
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(BRIDGE_ERROR_NOT_NETWORK.code);
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_NOT_NETWORK.description
            );
        });

        // Disabled
        it("disabled bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_DISABLED
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(BRIDGE_ERROR_DISABLED.code);
            expect(error.errorMessage).toBe(BRIDGE_ERROR_DISABLED.description);
        });

        // Account Unavailable
        it("account unavailable bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(BRIDGE_ERROR_ACCOUNT_UNAVAILABLE.code);
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE.description
            );
        });

        // Nested App Auth Unavailable
        it("nested app auth bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_NAA_UNAVAILABLE
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(BRIDGE_ERROR_NAA_UNAVAILABLE.code);
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_NAA_UNAVAILABLE.description
            );
        });

        // User Cancelled
        it("user cancelled bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_USER_CANCEL
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(BRIDGE_ERROR_USER_CANCEL.code);
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_USER_CANCEL.description
            );
        });

        // Transient
        it("transient bridge error to ServerAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER
            );
            expect(error instanceof ServerError).toBe(true);
            expect(error.errorCode).toBe(
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER.code
            );
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER.description
            );
        });

        // Persistent
        it("persistent bridge error to ServerAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER
            );
            expect(error instanceof ServerError).toBe(true);
            expect(error.errorCode).toBe(
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER.code
            );
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER.description
            );
        });

        // InteractionRequired
        it("interaction required bridge error to InteractionRequiredAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED
            );
            expect(error instanceof InteractionRequiredAuthError).toBe(true);
            expect(error.errorCode).toBe(
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED.code
            );
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED.description
            );
        });

        // Some other error
        it("all other errors return AuthError", () => {
            const bridgeError = new Error("unknown");
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const error = nestedAppAuthAdapter.fromBridgeError(bridgeError);
            expect(error instanceof AuthError).toBe(true);
            expect(error.errorCode).toBe("unknown_error");
            expect(error.errorMessage).toBe("An unknown error occurred");
        });
    });
});
