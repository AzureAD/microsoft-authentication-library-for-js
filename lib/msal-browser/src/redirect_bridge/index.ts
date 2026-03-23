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
         * Retrieve the clientId and original navigation URL from
         * sessionStorage. If sessionStorage access or JSON.parse fails,
         * we fall back to URL-based navigation below.
         */
        try {
            const rawInteractionStatus =
                window.sessionStorage.getItem(interactionKey);
            const interactionStatus = JSON.parse(rawInteractionStatus || "");
            clientId = interactionStatus.clientId || "";

            if (clientId) {
                const originKey = `${PREFIX}.${clientId}.${TemporaryCacheKeys.ORIGIN_URI}`;
                navigateToUrl = window.sessionStorage.getItem(originKey) || "";
            }
        } catch {
            // sessionStorage access or JSON.parse failed
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
         * If caching fails (clientId unavailable, quota exceeded, storage
         * disabled), fall back to appending the auth response to the
         * navigation URL so handleRedirectPromise can still extract it
         * from window.location.
         */
        let navigationUrl: string;
        let cached = false;
        if (clientId) {
            try {
                window.sessionStorage.setItem(
                    `${PREFIX}.${clientId}.${TemporaryCacheKeys.URL_HASH}`,
                    payload
                );
                cached = true;
            } catch {
                // sessionStorage write failed — fall through to URL-based fallback
            }
        }

        if (cached) {
            const url = navigateToUrl || BrowserUtils.getHomepage();
            /*
             * Strip bare trailing "?" (empty query string) so the final URL
             * matches the canonical form
             */
            navigationUrl = url.endsWith("?") ? url.slice(0, -1) : url;
        } else {
            /*
             * Reconstruct response URL for fallback when caching is unavailable.
             * Prefer the cached origin URL when available; fall back to homepage.
             */
            const baseUrl = navigateToUrl || BrowserUtils.getHomepage();
            /*
             * Strip any existing hash fragment to avoid double-hash URLs
             * (e.g., /#/route#code=...)
             */
            const hashIndex = baseUrl.indexOf("#");
            let baseUrlWithoutHash =
                hashIndex === -1 ? baseUrl : baseUrl.substring(0, hashIndex);
            // Strip bare trailing "?" to avoid "??" when responseFragment starts with "?"
            if (baseUrlWithoutHash.endsWith("?")) {
                baseUrlWithoutHash = baseUrlWithoutHash.slice(0, -1);
            }

            let responseFragment = "";
            if (hasResponseInHash && hasResponseInQuery) {
                responseFragment = `${urlQuery}${urlHash}`;
            } else if (hasResponseInHash) {
                responseFragment = urlHash;
            } else {
                responseFragment = urlQuery;
            }
            navigationUrl = `${baseUrlWithoutHash}${responseFragment}`;
        }

        await navClient.navigateInternal(navigationUrl, navigationOptions);

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
