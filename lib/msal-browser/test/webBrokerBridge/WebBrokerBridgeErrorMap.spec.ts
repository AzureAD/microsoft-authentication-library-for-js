/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    ClientAuthError,
    ClientAuthErrorCodes,
    InteractionRequiredAuthError,
    ServerError,
} from "@azure/msal-common/browser";
import { WebBrokerBridgeErrorCode } from "../../src/webBrokerBridge/WebBrokerBridgeError.js";
import { toAuthError } from "../../src/webBrokerBridge/WebBrokerBridgeErrorMap.js";

describe("WebBrokerBridgeErrorMap", () => {
    describe("toAuthError - base class selection", () => {
        // Each row asserts (a) which base class the common code lifts to,
        // and (b) the errorCode preserved on the resulting instance.
        const cases: Array<{
            code: WebBrokerBridgeErrorCode;
            ctor: new (...args: never[]) => AuthError;
            className: string;
            expectedErrorCode: string;
            innerErrorCode?: string;
        }> = [
            {
                code: WebBrokerBridgeErrorCode.UserInteractionRequired,
                ctor: InteractionRequiredAuthError,
                className: "InteractionRequiredAuthError",
                expectedErrorCode: "invalid_grant",
                innerErrorCode: "invalid_grant",
            },
            {
                code: WebBrokerBridgeErrorCode.TransientError,
                ctor: ServerError,
                className: "ServerError",
                expectedErrorCode: "server_temporarily_unavailable",
                innerErrorCode: "server_temporarily_unavailable",
            },
            {
                code: WebBrokerBridgeErrorCode.PersistentError,
                ctor: ServerError,
                className: "ServerError",
                expectedErrorCode: "invalid_request",
                innerErrorCode: "invalid_request",
            },
            {
                code: WebBrokerBridgeErrorCode.UserCanceled,
                ctor: ClientAuthError,
                className: "ClientAuthError",
                expectedErrorCode: ClientAuthErrorCodes.userCanceled,
            },
            {
                code: WebBrokerBridgeErrorCode.NoNetwork,
                ctor: ClientAuthError,
                className: "ClientAuthError",
                expectedErrorCode: ClientAuthErrorCodes.noNetworkConnectivity,
            },
            {
                code: WebBrokerBridgeErrorCode.AccountUnavailable,
                ctor: ClientAuthError,
                className: "ClientAuthError",
                expectedErrorCode: ClientAuthErrorCodes.noAccountFound,
            },
            {
                code: WebBrokerBridgeErrorCode.BridgeDisabled,
                ctor: ClientAuthError,
                className: "ClientAuthError",
                expectedErrorCode:
                    ClientAuthErrorCodes.nestedAppAuthBridgeDisabled,
            },
            {
                code: WebBrokerBridgeErrorCode.BridgeUnavailable,
                ctor: ClientAuthError,
                className: "ClientAuthError",
                expectedErrorCode: "custom_unavailable_code",
                innerErrorCode: "custom_unavailable_code",
            },
            {
                code: WebBrokerBridgeErrorCode.BridgeTimeout,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "bridge_timeout",
            },
            {
                code: WebBrokerBridgeErrorCode.BridgeHandshakeFailed,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "bridge_handshake_failed",
            },
            {
                code: WebBrokerBridgeErrorCode.BridgeConnectionReset,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "bridge_connection_reset",
            },
            {
                code: WebBrokerBridgeErrorCode.BridgeResponseInvalid,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "bridge_response_invalid",
            },
            {
                code: WebBrokerBridgeErrorCode.PopupWillRedirect,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "popup_will_redirect",
            },
            {
                code: WebBrokerBridgeErrorCode.ShrGenerationError,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "shr_generation_error",
            },
            {
                code: WebBrokerBridgeErrorCode.Unknown,
                ctor: AuthError,
                className: "AuthError",
                expectedErrorCode: "unknown_error",
            },
        ];

        it.each(cases)(
            "$code -> $className with errorCode=$expectedErrorCode",
            ({ code, ctor, className, expectedErrorCode, innerErrorCode }) => {
                const err = toAuthError({ code, innerErrorCode });
                expect(err).toBeInstanceOf(ctor);
                // Pin exact class (guard against silent subclass promotion).
                expect(err.name).toBe(className);
                expect(err.errorCode).toBe(expectedErrorCode);
            }
        );
    });

    describe("toAuthError - field propagation", () => {
        it("propagates correlationId", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.UserCanceled,
                correlationId: "corr-123",
            });
            expect(err.correlationId).toBe("corr-123");
        });

        it("defaults correlationId to empty string when omitted", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.UserCanceled,
            });
            expect(err.correlationId).toBe("");
        });

        it("propagates description and subError to ServerError", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.PersistentError,
                innerErrorCode: "invalid_grant",
                description: "AADSTS50076: MFA required",
                subError: "consent_required",
            });
            expect(err).toBeInstanceOf(ServerError);
            expect(err.errorMessage).toBe("AADSTS50076: MFA required");
            expect(err.subError).toBe("consent_required");
        });

        it("propagates description and subError to InteractionRequiredAuthError", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.UserInteractionRequired,
                innerErrorCode: "interaction_required",
                description: "user must sign in",
                subError: "consent_required",
            });
            expect(err).toBeInstanceOf(InteractionRequiredAuthError);
            expect(err.errorMessage).toBe("user must sign in");
            expect(err.subError).toBe("consent_required");
        });

        it("BridgeUnavailable falls back to nestedAppAuthBridgeDisabled when innerErrorCode is missing", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.BridgeUnavailable,
            });
            expect(err.errorCode).toBe(
                ClientAuthErrorCodes.nestedAppAuthBridgeDisabled
            );
        });

        it("Unknown supplies a default description when none is provided", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.Unknown,
            });
            expect(err.errorMessage).toBe("An unknown error occurred");
        });
    });

    describe("toAuthError - NAA fromBridgeError parity", () => {
        // Byte-for-byte parity with the current NAA fromBridgeError switch.
        // Passing correlationId="" (as NAA does today) preserves the
        // pre-migration wire behavior.
        it("UserCancel matches NAA output", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.UserCanceled,
                correlationId: "",
            });
            expect(err).toEqual(
                new ClientAuthError(ClientAuthErrorCodes.userCanceled, "")
            );
        });

        it("TransientError with no inner code matches NAA output", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.TransientError,
                correlationId: "",
                description: "temporary failure",
            });
            expect(err).toEqual(new ServerError("", "", "temporary failure"));
        });

        it("default (Unknown, no inner code) matches NAA's non-BridgeError branch", () => {
            const err = toAuthError({
                code: WebBrokerBridgeErrorCode.Unknown,
                correlationId: "",
            });
            expect(err).toEqual(
                new AuthError("unknown_error", "", "An unknown error occurred")
            );
        });
    });
});
