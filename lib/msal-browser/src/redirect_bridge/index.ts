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
        const interactionKey = `${PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        try {
            /*
             * Retrieve the original navigation URL from sessionStorage
             */
            const { clientId } = JSON.parse(
                window.sessionStorage.getItem(interactionKey) || ""
            );
            if (clientId) {
                const cacheKey = `${PREFIX}.${clientId}.${TemporaryCacheKeys.ORIGIN_URI}`;
                navigateToUrl = window.sessionStorage.getItem(cacheKey) || "";
            }
        } catch (e) {
            // SessionStorage access may fail in some contexts, use default
        }

        /*
         * For apps that use hash-based routing (e.g. "/#/route"), the redirect bridge
         * must carefully reconstruct the URL so that the authentication response does
         * not break client-side routing:
         *
         * - When the server returns the response in the fragment (response_mode=fragment),
         *   the existing route fragment is stripped from the origin URL before appending
         *   the auth response hash. This avoids malformed URLs with two "#" fragments
         *   (e.g. "/#/route#code=...").
         *
         * - When the server returns the response in the query string (response_mode=query),
         *   the query parameters are inserted before any existing hash fragment so that
         *   the hash-based route is preserved (e.g. "/#/route").
         *
         * The original route fragment is restored later by
         * RedirectClient.handleRedirectPromise when navigateToLoginRequestUrl is enabled.
         */
        const baseUrl = navigateToUrl || BrowserUtils.getHomepage();

        // Decompose baseUrl into path (everything before #) and fragment (# and after)
        const baseHashIdx = baseUrl.indexOf("#");
        const basePath =
            baseHashIdx > -1 ? baseUrl.substring(0, baseHashIdx) : baseUrl;
        const baseFragment =
            baseHashIdx > -1 ? baseUrl.substring(baseHashIdx) : "";

        // Build query portion: if auth response has query params, append to basePath
        let queryPart = "";
        if (hasResponseInQuery) {
            queryPart = basePath.includes("?")
                ? urlQuery.replace("?", "&")
                : urlQuery;
        }

        // Build hash portion: auth response hash replaces the original, otherwise preserve it
        const hashPart = hasResponseInHash ? urlHash : baseFragment;

        const homepage = `${basePath}${queryPart}${hashPart}`;
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
