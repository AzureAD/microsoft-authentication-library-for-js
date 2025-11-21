/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { parseAuthResponseFromUrl } from "../utils/BrowserUtils.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import {
    ApiId,
    InteractionType,
    TemporaryCacheKeys,
} from "../utils/BrowserConstants.js";
import { NavigationOptions } from "../navigation/NavigationOptions.js";
import { DEFAULT_REDIRECT_TIMEOUT_MS } from "../config/Configuration.js";
import { NavigationClient } from "../navigation/NavigationClient.js";
import { PREFIX } from "../cache/CacheKeys.js";

/**
 * Processes the authentication response from the redirect URL
 * For SSO and popup scenarios broadcasts it to the main frame
 * For redirect scenario navigates to the home page
 *
 * @param {NavigationClient} navigationClient - Optional navigation client for redirect scenario.
 *
 * @returns {Promise<void>} A promise that resolves when the response has been broadcast and cleanup is complete.
 *
 * @throws {Error} If no authentication payload is found in the URL (hash or query string).
 * @throws {Error} If the state parameter is missing from the redirect URL.
 * @throws {Error} If the state is missing required 'id' or 'meta' attributes.
 */
export async function broadcastResponseToMainFrame(
    navigationClient?: NavigationClient
): Promise<void> {
    let parsedResponse;
    try {
        parsedResponse = parseAuthResponseFromUrl();
    } catch (error) {
        // Clear hash before re-throwing parse errors
        BrowserUtils.clearHash(window);
        throw error;
    }

    const { params, payload, urlHash, urlQuery, libraryState } = parsedResponse;

    const { id, meta } = libraryState;

    if (meta["interactionType"] === InteractionType.Redirect) {
        const navClient = navigationClient || new NavigationClient();
        const navigationOptions: NavigationOptions = {
            apiId: ApiId.handleRedirectPromise,
            noHistory: true,
            timeout: DEFAULT_REDIRECT_TIMEOUT_MS,
        };

        /*
         * Retrieve the original navigation URL from sessionStorage
         */
        let navigateToUrl = "";
        const clientId = params.get("client_id");
        if (clientId) {
            try {
                const cacheKey = `${PREFIX}.${clientId}.${TemporaryCacheKeys.ORIGIN_URI}`;
                navigateToUrl = window.sessionStorage.getItem(cacheKey) || "";
            } catch (e) {
                // SessionStorage access may fail in some contexts, use default
            }
        }

        // Reconstruct full URL with auth response
        const fullUrlHash = `${urlQuery}${urlHash}`;
        const homepage = `${
            navigateToUrl || BrowserUtils.getHomepage()
        }${fullUrlHash}`;
        await navClient.navigateInternal(homepage, navigationOptions);
        return;
    }

    BrowserUtils.clearHash(window);
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
