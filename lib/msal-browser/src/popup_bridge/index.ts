/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, LogLevel, ProtocolUtils, StubPerformanceClient } from "@azure/msal-common/browser";
import { CryptoOps } from "../crypto/CryptoOps.js";
import { isInPopup } from "../utils/BrowserUtils.js";

export async function sendPopupPayloadToMainFrame(
): Promise<void> {
    const logger = new Logger({
        logLevel: LogLevel.Info,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        loggerCallback: (level, message, containsPii) => {
            // eslint-disable-next-line no-console
            console.log(message);
            return;
        }
    });

    logger.info("Popup bridge is called", "");

    if (!isInPopup()) {
        logger.info("Popup bridge. Not a popup", "");
        return;
    }

    // 1) Determine which URL container carries the payload
    const hasHash = !!window.location.hash && window.location.hash.length > 1;
    const raw = hasHash ? window.location.hash : window.location.search;
    if (!raw) {
        logger.info("No auth payload found on URL (hash or query)", "");
        return;
    }

    // Strip leading ? / #
    const payload = raw.substring(1);
    const params = new URLSearchParams(payload);

    const state = params.get("state");
    if (!state) {
        logger.info("Missing state on redirect URL", "");
        return;
    }

    // 2) Remove the response from URL for security
    logger.info("Removing auth response from URL", "");
    if (hasHash) {
        // Clear hash
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
        // Clear query string
        window.history.replaceState(null, "", window.location.pathname);
    }

    const { libraryState } = ProtocolUtils.parseRequestState(
        new CryptoOps(logger, new StubPerformanceClient(), true),
        state
    );

    const { id } = libraryState;
    if (!id) {
        throw new Error("State is missing id attribute");
    }

    // 4) Send the raw URL payload to the main frame
    const channel = new BroadcastChannel(id);
    channel.postMessage({
        v: 1,
        state,
        payload,
    });
    channel.close();

    try { window.close(); } catch {}
}
