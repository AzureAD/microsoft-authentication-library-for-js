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
import { POPUP_RELAY_RESPONSE_TYPE } from "./constants.js";

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
 * Builds the URL of the popup-relay page to open. The action the relay page
 * must perform (GET navigation or POST form) is carried in the page's hash
 * (client-side only, never sent to a server), keyed by the per-request
 * library-state `id` so the relay page can listen on the right BroadcastChannel
 * and echo the id back. The relay URI is resolved against the app origin, so it
 * must be same-origin as the embedded frame. See `runPopupRelay`.
 *
 * @internal
 */
export function buildPopupRelayUrl(
    popupRelayUri: string,
    id: string,
    action: PopupRelayAction,
    correlationId: string
): string {
    const req = { id, ...action };
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
    hashParams.set("req", JSON.stringify(req));
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
 * The response is accepted only from the popup window we opened, on our own
 * origin (the relay page is same-origin as the embedded frame), and only when
 * it carries the matching per-request library-state id.
 *
 * @internal
 */
export async function waitForPopupRelayResponse(
    timeoutMs: number,
    logger: Logger,
    request: WaitForBridgeRequest,
    popupWindow: Window,
    performanceClient: IPerformanceClient
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const correlationId = request.correlationId;
        logger.verbose(
            "PopupRelay.waitForPopupRelayResponse - started",
            correlationId
        );
        performanceClient.addFields(
            { redirectBridgeTimeoutMs: timeoutMs },
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
            if (
                !data ||
                data.type !== POPUP_RELAY_RESPONSE_TYPE ||
                data.id !== expectedId
            ) {
                return;
            }
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            if (data.error) {
                reject(createBrowserAuthError(data.error, correlationId));
            } else if (data.payload) {
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
