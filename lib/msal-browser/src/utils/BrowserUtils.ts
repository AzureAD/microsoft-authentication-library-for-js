/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    UrlString,
    invoke,
    invokeAsync,
    UrlUtils,
    RequestParameterBuilder,
    ICrypto,
    Logger,
    CommonAuthorizationUrlRequest,
    CommonEndSessionRequest,
    ProtocolUtils,
} from "@azure/msal-common/browser";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { BrowserCacheLocation, InteractionType } from "./BrowserConstants.js";
import * as BrowserCrypto from "../crypto/BrowserCrypto.js";
import {
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../error/BrowserConfigurationAuthError.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import {
    redirectBridgeEmptyResponse,
    redirectBridgeTimeout,
} from "../error/BrowserAuthErrorCodes.js";
import { base64Decode } from "../encode/Base64Decode.js";

/**
 * Clears hash from window url.
 */
export function clearHash(contentWindow: Window): void {
    // Office.js sets history.replaceState to null
    contentWindow.location.hash = "";
    if (typeof contentWindow.history.replaceState === "function") {
        // Full removes "#" from url
        contentWindow.history.replaceState(
            null,
            "",
            `${contentWindow.location.origin}${contentWindow.location.pathname}${contentWindow.location.search}`
        );
    }
}

/**
 * Replaces current hash with hash from provided url
 */
export function replaceHash(url: string): void {
    const urlParts = url.split("#");
    urlParts.shift(); // Remove part before the hash
    window.location.hash = urlParts.length > 0 ? urlParts.join("#") : "";
}

/**
 * Returns boolean of whether the current window is in an iframe or not.
 */
export function isInIframe(): boolean {
    return window.parent !== window;
}

/**
 * Returns boolean of whether or not the current window is a popup opened by msal
 */
export function isInPopup(): boolean {
    if (isInIframe()) {
        return false;
    }

    const hasHash = !!window.location.hash && window.location.hash.length > 1;
    const hash = hasHash ? window.location.hash : window.location.search;
    if (!hash) {
        return false;
    }

    // Strip leading ? / #
    const payload = hash.substring(1);
    const params = new URLSearchParams(payload);

    const state = params.get("state");
    if (!state) {
        return false;
    }

    const { libraryState } = ProtocolUtils.parseRequestState(
        base64Decode,
        state
    );

    const { meta } = libraryState;
    return !!(meta && meta["interactionType"] === InteractionType.Popup);
}

/**
 * Await a response from a redirect bridge using BroadcastChannel.
 * This unified function works for both popup and iframe scenarios by listening on a
 * BroadcastChannel for the server payload.
 *
 * @param timeoutMs - Timeout in milliseconds.
 * @param logger - Logger instance for logging monitoring events.
 * @param browserCrypto - Browser crypto instance for decoding state.
 * @param request - The authorization or end session request.
 * @returns Promise<string> - Resolves with the response string (query or hash) from the window.
 */

// Track the active bridge monitor to allow cancellation when overriding interactions
let activeBridgeMonitor: {
    timeoutId: number;
    channel: BroadcastChannel;
    reject: (reason?: unknown) => void;
} | null = null;

/**
 * Cancels the pending bridge response monitor if one exists.
 * This is called when overrideInteractionInProgress is used to cancel
 * any pending popup interaction before starting a new one.
 */
export function cancelPendingBridgeResponse(
    logger: Logger,
    correlationId: string
): void {
    if (activeBridgeMonitor) {
        logger.verbose(
            "BrowserUtils.cancelPendingBridgeResponse - Cancelling pending bridge monitor",
            correlationId
        );

        clearTimeout(activeBridgeMonitor.timeoutId);
        activeBridgeMonitor.channel.close();
        activeBridgeMonitor.reject(
            createBrowserAuthError(
                BrowserAuthErrorCodes.interactionInProgressOverridden
            )
        );

        activeBridgeMonitor = null;
    }
}

export async function waitForBridgeResponse(
    timeoutMs: number,
    logger: Logger,
    browserCrypto: ICrypto,
    request: CommonAuthorizationUrlRequest | CommonEndSessionRequest
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        logger.verbose(
            "BrowserUtils.waitForBridgeResponse - started",
            request.correlationId
        );

        const { libraryState } = ProtocolUtils.parseRequestState(
            browserCrypto.base64Decode,
            request.state || ""
        );
        const channel = new BroadcastChannel(libraryState.id);
        let responseString: string | undefined = undefined;

        const timeoutId = window.setTimeout(() => {
            // Clear the active monitor
            activeBridgeMonitor = null;

            channel.close();
            reject(createBrowserAuthError(redirectBridgeTimeout));
        }, timeoutMs);

        // Track this monitor so it can be cancelled if needed
        activeBridgeMonitor = {
            timeoutId,
            channel,
            reject,
        };

        channel.onmessage = (event) => {
            responseString = event.data.payload;

            // Clear the active monitor
            activeBridgeMonitor = null;

            clearTimeout(timeoutId);
            channel.close();
            if (responseString) {
                resolve(responseString);
            } else {
                reject(createBrowserAuthError(redirectBridgeEmptyResponse));
            }
        };
    });
}

// #endregion

/**
 * Returns current window URL as redirect uri
 */
export function getCurrentUri(): string {
    return typeof window !== "undefined" && window.location
        ? window.location.href.split("?")[0].split("#")[0]
        : "";
}

/**
 * Gets the homepage url for the current window location.
 */
export function getHomepage(): string {
    const currentUrl = new UrlString(window.location.href);
    const urlComponents = currentUrl.getUrlComponents();
    return `${urlComponents.Protocol}//${urlComponents.HostNameAndPort}/`;
}

/**
 * Throws error if we have completed an auth and are
 * attempting another auth request inside an iframe.
 */
export function blockReloadInHiddenIframes(): void {
    const isResponseHash = UrlUtils.getDeserializedResponse(
        window.location.hash
    );
    // return an error if called from the hidden iframe created by the msal js silent calls
    if (isResponseHash && isInIframe()) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.blockIframeReload);
    }
}

/**
 * Block redirect operations in iframes unless explicitly allowed
 * @param interactionType Interaction type for the request
 * @param allowRedirectInIframe Config value to allow redirects when app is inside an iframe
 */
export function blockRedirectInIframe(allowRedirectInIframe: boolean): void {
    if (isInIframe() && !allowRedirectInIframe) {
        // If we are not in top frame, we shouldn't redirect. This is also handled by the service.
        throw createBrowserAuthError(BrowserAuthErrorCodes.redirectInIframe);
    }
}

/**
 * Block redirectUri loaded in popup from calling AcquireToken APIs
 */
export function blockAcquireTokenInPopups(): void {
    // Popups opened by msal popup APIs are given a name that starts with "msal."
    if (isInPopup()) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.blockNestedPopups);
    }
}

/**
 * Throws error if token requests are made in non-browser environment
 * @param isBrowserEnvironment Flag indicating if environment is a browser.
 */
export function blockNonBrowserEnvironment(): void {
    if (typeof window === "undefined") {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.nonBrowserEnvironment
        );
    }
}

/**
 * Throws error if initialize hasn't been called
 * @param initialized
 */
export function blockAPICallsBeforeInitialize(initialized: boolean): void {
    if (!initialized) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.uninitializedPublicClientApplication
        );
    }
}

/**
 * Helper to validate app environment before making an auth request
 * @param initialized
 */
export function preflightCheck(initialized: boolean): void {
    // Block request if not in browser environment
    blockNonBrowserEnvironment();

    // Block auth requests inside a hidden iframe
    blockReloadInHiddenIframes();

    // Block redirectUri opened in a popup from calling MSAL APIs
    blockAcquireTokenInPopups();

    // Block token acquisition before initialize has been called
    blockAPICallsBeforeInitialize(initialized);
}

/**
 * Helper to validate app enviornment before making redirect request
 * @param initialized
 * @param config
 */
export function redirectPreflightCheck(
    initialized: boolean,
    config: BrowserConfiguration
): void {
    preflightCheck(initialized);
    blockRedirectInIframe(config.system.allowRedirectInIframe);
    // Block redirects if memory storage is enabled
    if (config.cache.cacheLocation === BrowserCacheLocation.MemoryStorage) {
        throw createBrowserConfigurationAuthError(
            BrowserConfigurationAuthErrorCodes.inMemRedirectUnavailable
        );
    }
}

/**
 * Adds a preconnect link element to the header which begins DNS resolution and SSL connection in anticipation of the /token request
 * @param loginDomain Authority domain, including https protocol e.g. https://login.microsoftonline.com
 * @returns
 */
export function preconnect(authority: string): void {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = new URL(authority).origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);

    // The browser will close connection if not used within a few seconds, remove element from the header after 10s
    window.setTimeout(() => {
        try {
            document.head.removeChild(link);
        } catch {}
    }, 10000); // 10s Timeout
}

/**
 * Wrapper function that creates a UUID v7 from the current timestamp.
 * @returns {string}
 */
export function createGuid(): string {
    return BrowserCrypto.createNewGuid();
}

export { invoke };
export { invokeAsync };
export const addClientCapabilitiesToClaims =
    RequestParameterBuilder.addClientCapabilitiesToClaims;
