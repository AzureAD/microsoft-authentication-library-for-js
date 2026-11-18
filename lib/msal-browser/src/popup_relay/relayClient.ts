/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IPerformanceClient,
    Logger,
    ProtocolUtils,
} from "@azure/msal-common/browser";
import { base64Decode } from "../encode/Base64Decode.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import { redirectBridgeEmptyResponse } from "../error/BrowserAuthErrorCodes.js";
import type { WaitForBridgeRequest } from "../utils/BrowserUtils.js";
import {
    POPUP_RELAY_READY_TYPE,
    POPUP_RELAY_REQUEST_TYPE,
    POPUP_RELAY_RESPONSE_TYPE,
    POPUP_RELAY_V2_RESPONSE_TYPE,
    getPopupRelayProtocolVersion,
} from "./constants.js";

/**
 * The navigation the popup-relay page should perform in its IdP child popup:
 * either a GET navigation to a URL, or a POST form submission (used by the
 * form_post and EAR response modes).
 *
 * @internal
 */
export type PopupRelayAction =
    | { method: "GET"; url: string }
    | { method: "POST"; action: string; fields: Record<string, string> };

/**
 * Builds the same-origin relay URL. V1 preserves the fragment descriptor;
 * explicitly selected v2 carries only the id and retains the navigation for
 * the authenticated handoff.
 *
 * @internal
 */
export function buildPopupRelayUrl(
    popupRelayUri: string,
    id: string,
    action: PopupRelayAction,
    correlationId: string,
    protocolVersion?: 1 | 2
): string {
    const version = getPopupRelayProtocolVersion(
        protocolVersion,
        correlationId
    );
    const target = new URL(popupRelayUri, window.location.origin);
    /*
     * The relay page must be same-origin as the embedded frame: the response is
     * relayed back via postMessage and only accepted from this origin, and a
     * cross-origin page would also receive the relayed /authorize request. Fail
     * fast with a clear error instead of silently relaying to (and timing out
     * against) the wrong origin.
     */
    if (target.origin !== window.location.origin) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            correlationId,
            "popup_relay_cross_origin"
        );
    }
    const hashParams = new URLSearchParams();
    if (version === 1) {
        hashParams.set("req", JSON.stringify({ id, ...action }));
    } else {
        hashParams.set("id", id);
    }
    target.hash = hashParams.toString();
    return target.toString();
}

/**
 * Waits for the popup-relay page to relay the raw auth response back to the
 * embedded frame via postMessage. Used in place of `waitForBridgeResponse`
 * when `auth.popupRelayUri` is configured, because third-party storage
 * partitioning blocks the BroadcastChannel the redirect bridge uses from
 * reaching the embedded frame.
 *
 * In v2, the retained navigation is sent once, after a ready signal from the popup
 * window we opened on our own origin with the matching library-state id.
 * Successful responses must also carry that handoff's relay-document nonce.
 * Setup failures can reject the request before the handoff completes.
 *
 * @internal
 */
export async function waitForPopupRelayResponse(
    timeoutMs: number,
    logger: Logger,
    request: WaitForBridgeRequest,
    popupWindow: Window,
    performanceClient: IPerformanceClient,
    action?: PopupRelayAction,
    protocolVersion?: 1 | 2
): Promise<string> {
    const version = getPopupRelayProtocolVersion(
        protocolVersion,
        request.correlationId
    );
    if (version === 2 && !action) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            request.correlationId,
            "popup_relay_bad_request"
        );
    }
    return new Promise<string>((resolve, reject) => {
        const correlationId = request.correlationId;
        logger.verbose(
            "PopupRelay.waitForPopupRelayResponse - started",
            correlationId
        );
        performanceClient.addFields(
            {
                redirectBridgeTimeoutMs: timeoutMs,
                popupRelayProtocolVersion: version,
            },
            correlationId
        );
        const { libraryState } = ProtocolUtils.parseRequestState(
            base64Decode,
            request.state || "",
            correlationId
        );
        const expectedId = libraryState.id;
        const expectedOrigin = window.location.origin;
        let settled = false;
        let handoffNonce = "";

        const cleanup = (): void => {
            window.removeEventListener("message", onMessage);
            clearTimeout(timeoutId);
            clearInterval(closedPoll);
        };

        const onMessage = (event: MessageEvent): void => {
            if (
                event.origin !== expectedOrigin ||
                event.source !== popupWindow
            ) {
                return;
            }
            const data = event.data;
            if (!data || data.id !== expectedId) {
                return;
            }
            if (settled) {
                return;
            }
            if (version === 2 && data.type === POPUP_RELAY_READY_TYPE) {
                if (
                    handoffNonce ||
                    typeof data.nonce !== "string" ||
                    !data.nonce
                ) {
                    return;
                }
                handoffNonce = data.nonce;
                try {
                    popupWindow.postMessage(
                        {
                            type: POPUP_RELAY_REQUEST_TYPE,
                            id: expectedId,
                            nonce: handoffNonce,
                            request: { id: expectedId, ...action },
                        },
                        expectedOrigin
                    );
                    performanceClient.addFields(
                        { "ext.popupRelayRequestSent": true },
                        correlationId
                    );
                } catch {
                    settled = true;
                    cleanup();
                    logger.error(
                        "PopupRelay.waitForPopupRelayResponse - request handoff failed",
                        correlationId
                    );
                    reject(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.popupWindowError,
                            correlationId,
                            "popup_relay_handoff_failed"
                        )
                    );
                }
                return;
            }
            const hasError =
                typeof data.error === "string" && data.error.length > 0;
            const responseType =
                version === 1
                    ? POPUP_RELAY_RESPONSE_TYPE
                    : POPUP_RELAY_V2_RESPONSE_TYPE;
            if (
                data.type !== responseType ||
                (version === 2 &&
                    ((!handoffNonce && !hasError) ||
                        (handoffNonce && data.nonce !== handoffNonce)))
            ) {
                return;
            }
            settled = true;
            cleanup();
            if (hasError) {
                reject(
                    createBrowserAuthError(
                        data.error,
                        correlationId,
                        data.subError
                    )
                );
            } else if (typeof data.payload === "string" && data.payload) {
                resolve(data.payload);
            } else {
                reject(
                    createBrowserAuthError(
                        redirectBridgeEmptyResponse,
                        correlationId
                    )
                );
            }
        };
        window.addEventListener("message", onMessage);

        const timeoutId = window.setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.timedOut,
                    correlationId,
                    "popup_relay_timeout"
                )
            );
        }, timeoutMs);

        const closedPoll = window.setInterval(() => {
            if (popupWindow.closed && !settled) {
                settled = true;
                cleanup();
                reject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.userCancelled,
                        correlationId
                    )
                );
            }
        }, 500);
    });
}
