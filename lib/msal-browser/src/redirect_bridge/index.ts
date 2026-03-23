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
 * @throws {AuthError} If no authentication payload is found in the URL (hash or query string).
 * @throws {AuthError} If the state parameter is missing from the redirect URL.
 * @throws {AuthError} If the state is missing required 'id' or 'meta' attributes.
 */
export async function broadcastResponseToMainFrame(
    navigationClient?: NavigationClient
): Promise<void> {
    let parsedResponse;
    try {
        parsedResponse = parseAuthResponseFromUrl();
    } catch (error) {
        // Clear hash and query string before re-throwing parse errors
        if (typeof window.history.replaceState === "function") {
            window.history.replaceState(
                null,
                "",
                `${window.location.origin}${window.location.pathname}`
            );
        }
        throw error;
    }

    const {
        payload,
        urlHash,
        urlQuery,
        hasResponseInHash,
        hasResponseInQuery,
        libraryState,
    } = parsedResponse;

    const { id, meta } = libraryState;

    if (meta["interactionType"] === InteractionType.Redirect) {
        const navClient = navigationClient || new NavigationClient();
        const navigationOptions: NavigationOptions = {
            apiId: ApiId.handleRedirectPromise,
            noHistory: true,
            timeout: DEFAULT_REDIRECT_TIMEOUT_MS,
        };

        let navigateToUrl = "";
        let clientId = "";
        const interactionKey = `${PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        /*
         * Retrieve the original navigation URL from sessionStorage.
         * sessionStorage access is outside the try/catch so failures
         * propagate immediately. Only JSON.parse is caught since
         * interaction status may be missing or malformed.
         */
        const rawInteractionStatus =
            window.sessionStorage.getItem(interactionKey);
        try {
            const interactionStatus = JSON.parse(rawInteractionStatus || "");
            clientId = interactionStatus.clientId || "";
        } catch (e) {
            // JSON.parse failed — interaction status is missing or malformed
        }

        if (clientId) {
            const originKey = `${PREFIX}.${clientId}.${TemporaryCacheKeys.ORIGIN_URI}`;
            navigateToUrl = window.sessionStorage.getItem(originKey) || "";
        }

        /*
         * Cache the auth response payload in sessionStorage under the URL_HASH
         * key, then navigate directly to the origin URL. This replicates what
         * RedirectClient.handleRedirectPromise does when the current page is
         * not the loginRequestUrl: it caches the response and navigates.
         *
         * On the target page, handleRedirectPromise will find no response in
         * the URL but will pick up the cached payload from sessionStorage.
         * This avoids appending the auth response to the URL, which would
         * create malformed URLs for hash-routed SPAs (e.g. /#/route#code=...).
         *
         * If clientId is unavailable (interaction status missing/malformed),
         * fall back to appending the auth response to the navigation URL so
         * handleRedirectPromise can still extract it from window.location.
         */
        let homepage: string;
        if (clientId) {
            window.sessionStorage.setItem(
                `${PREFIX}.${clientId}.${TemporaryCacheKeys.URL_HASH}`,
                payload
            );
            homepage = navigateToUrl || BrowserUtils.getHomepage();
        } else {
            // Reconstruct response URL for fallback when clientId is unknown
            let responseFragment = "";
            if (hasResponseInHash && hasResponseInQuery) {
                responseFragment = `${urlQuery}${urlHash}`;
            } else if (hasResponseInHash) {
                responseFragment = urlHash;
            } else {
                responseFragment = urlQuery;
            }
            homepage = `${BrowserUtils.getHomepage()}${responseFragment}`;
        }

        await navClient.navigateInternal(homepage, navigationOptions);

        // Do NOT clear URL for redirect flow - we're navigating away anyway
        return;
    }

    // Clear only the part(s) containing the auth response from redirect bridge URL
    if (typeof window.history.replaceState === "function") {
        let newUrl = `${window.location.origin}${window.location.pathname}`;
        // Preserve hash if it didn't contain the response
        if (!hasResponseInHash && urlHash) {
            newUrl += urlHash;
        }
        // Preserve query if it didn't contain the response
        if (!hasResponseInQuery && urlQuery) {
            newUrl += urlQuery;
        }
        window.history.replaceState(null, "", newUrl);
    }

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
