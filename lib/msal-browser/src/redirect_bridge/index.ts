/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ProtocolUtils } from "@azure/msal-common/browser";
import { clearHash } from "../utils/BrowserUtils.js";
import { base64Decode } from "../encode/Base64Decode.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { ApiId, InteractionType } from "../utils/BrowserConstants.js";
import { NavigationOptions } from "../navigation/NavigationOptions.js";
import { DEFAULT_REDIRECT_TIMEOUT_MS } from "../config/Configuration.js";
import { NavigationClient } from "../navigation/NavigationClient.js";

/**
 * Processes the authentication response from the redirect URL
 * For SSO and popup scenarios broadcasts it to the main frame
 * For redirect scenario navigates to the home page
 *
 * @param {string} navigateToUrl - Optional URL to navigate to for redirect scenario.
 * If not provided, defaults to the application's homepage.
 *
 * @returns {Promise<void>} A promise that resolves when the response has been broadcast and cleanup is complete.
 *
 * @throws {Error} If no authentication payload is found in the URL (hash or query string).
 * @throws {Error} If the state parameter is missing from the redirect URL.
 * @throws {Error} If the state is missing required 'id' or 'meta' attributes.
 */
export async function broadcastResponseToMainFrame(
    navigateToUrl?: string
): Promise<void> {
    // 1) Determine which URL container carries the payload
    const hasHash = !!window.location.hash && window.location.hash.length > 1;
    const hash = hasHash ? window.location.hash : window.location.search;
    if (!hash) {
        throw new Error("No auth payload found on URL (hash or query)");
    }

    // Strip leading ? / #
    const payload = hash.substring(1);
    const params = new URLSearchParams(payload);

    const state = params.get("state");
    if (!state) {
        clearHash(window);
        throw new Error("Missing state on redirect URL");
    }

    const { libraryState } = ProtocolUtils.parseRequestState(
        base64Decode,
        state
    );

    const { id, meta } = libraryState;
    if (!id || !meta) {
        clearHash(window);
        throw new Error("Missing state 'id' and/or 'meta' attributes");
    }

    if (meta && meta["interactionType"] === InteractionType.Redirect) {
        const navigationClient = new NavigationClient();
        const navigationOptions: NavigationOptions = {
            apiId: ApiId.handleRedirectPromise,
            noHistory: true,
            timeout: DEFAULT_REDIRECT_TIMEOUT_MS,
        };
        const homepage = `${
            navigateToUrl || BrowserUtils.getHomepage()
        }${hash}`;
        await navigationClient.navigateInternal(homepage, navigationOptions);
        return;
    }

    clearHash(window);
    // Send the raw URL payload to the main frame
    const channel = new BroadcastChannel(id);
    channel.postMessage({
        v: 1,
        payload,
    });
    channel.close();
    try {
        window.close();
    } catch {}
}
