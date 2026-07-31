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
import {
    WebBrokerBridgeError,
    WebBrokerBridgeErrorCode,
} from "./WebBrokerBridgeError.js";

/**
 * Lift a normalized `WebBrokerBridgeError` to one of the four base
 * MSAL error classes. Callers are responsible for lowering
 * transport-specific errors into `WebBrokerBridgeError` before calling
 * this function.
 */
export function toAuthError(err: WebBrokerBridgeError): AuthError {
    const correlationId = err.correlationId ?? "";

    switch (err.code) {
        case WebBrokerBridgeErrorCode.UserInteractionRequired:
            return new InteractionRequiredAuthError(
                err.innerErrorCode || "",
                correlationId,
                err.description,
                err.subError
            );

        case WebBrokerBridgeErrorCode.TransientError:
        case WebBrokerBridgeErrorCode.PersistentError:
            return new ServerError(
                err.innerErrorCode || "",
                correlationId,
                err.description,
                err.subError
            );

        case WebBrokerBridgeErrorCode.UserCanceled:
            return new ClientAuthError(
                ClientAuthErrorCodes.userCanceled,
                correlationId
            );

        case WebBrokerBridgeErrorCode.NoNetwork:
            return new ClientAuthError(
                ClientAuthErrorCodes.noNetworkConnectivity,
                correlationId
            );

        case WebBrokerBridgeErrorCode.AccountUnavailable:
            return new ClientAuthError(
                ClientAuthErrorCodes.noAccountFound,
                correlationId
            );

        case WebBrokerBridgeErrorCode.BridgeDisabled:
            return new ClientAuthError(
                ClientAuthErrorCodes.nestedAppAuthBridgeDisabled,
                correlationId
            );

        case WebBrokerBridgeErrorCode.BridgeUnavailable:
            /*
             * NAA parity: pass through inner code when the broker supplied
             * one, otherwise fall back to the disabled code.
             */
            return new ClientAuthError(
                err.innerErrorCode ||
                    ClientAuthErrorCodes.nestedAppAuthBridgeDisabled,
                correlationId,
                err.description
            );

        /*
         * PWB broker-channel failures. The common code doubles as the
         * concrete errorCode on AuthError so the original error identity
         * can be recovered by round-tripping the string.
         */
        case WebBrokerBridgeErrorCode.BridgeTimeout:
        case WebBrokerBridgeErrorCode.BridgeHandshakeFailed:
        case WebBrokerBridgeErrorCode.BridgeConnectionReset:
        case WebBrokerBridgeErrorCode.BridgeResponseInvalid:
        case WebBrokerBridgeErrorCode.PopupWillRedirect:
        case WebBrokerBridgeErrorCode.ShrGenerationError:
            return new AuthError(
                err.code,
                correlationId,
                err.description,
                err.subError
            );

        case WebBrokerBridgeErrorCode.Unknown:
        default:
            return new AuthError(
                err.innerErrorCode || "unknown_error",
                correlationId,
                err.description || "An unknown error occurred",
                err.subError
            );
    }
}
