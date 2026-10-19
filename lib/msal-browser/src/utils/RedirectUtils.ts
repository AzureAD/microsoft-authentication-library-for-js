/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    Constants,
    Logger,
    ProtocolUtils,
} from "@azure/msal-common/browser";
import { base64Decode } from "../encode/Base64Decode.js";
import { InteractionType } from "./BrowserConstants.js";

const authResponseKeys = new Set<string>([
    "code",
    "ear_jwe",
    "client_info",
    "state",
    "session_state",
    "cloud_instance_name",
    "cloud_instance_host_name",
    "cloud_graph_host_name",
    "msgraph_host",
    "error",
    "error_uri",
    "error_description",
    "suberror",
    "timestamp",
    "trace_id",
    "correlation_id",
    "claims",
    "accountId",
    "nativeAccountId",
    "clientdata",
]);

/**
 * Identifies flat redirect response parameters without accepting the response.
 * Payload-only fragments include malformed or empty codes and broker account
 * identifiers. Query strings require MSAL redirect state unless query response
 * mode is explicitly selected.
 */
export function isRedirectResponse(
    response: string,
    allowResponseWithoutState: boolean = true
): boolean {
    const content = response.replace(/^[#?]/, "");
    if (!content || !/^[^=&?#/]+(?:=|&|$)/.test(content)) {
        return false;
    }

    const params = new URLSearchParams(content);
    let interactionType: string | undefined;
    const state = params.get("state");
    if (state) {
        try {
            const { libraryState } = ProtocolUtils.parseRequestState(
                base64Decode,
                state,
                ""
            );
            if (libraryState?.id) {
                interactionType = libraryState.meta?.interactionType;
            }
        } catch (e) {
            // Non-MSAL and malformed state cannot establish response ownership.
            if (!(e instanceof AuthError)) {
                throw e;
            }
        }
    }

    if (
        interactionType === InteractionType.Popup ||
        interactionType === InteractionType.Silent
    ) {
        return false;
    }

    return (
        interactionType === InteractionType.Redirect ||
        (allowResponseWithoutState &&
            (params.has("code") ||
                params.has("ear_jwe") ||
                params.has("accountId") ||
                params.has("nativeAccountId")))
    );
}

/**
 * Removes authentication parameters from a redirect destination, preserving
 * unrelated parameters verbatim and leaving application routing hashes intact.
 */
export function sanitizeRedirectUrl(
    url: string,
    responseMode: string = Constants.ResponseMode.FRAGMENT
): string {
    const hashIndex = url.indexOf("#");
    const beforeHash = hashIndex < 0 ? url : url.substring(0, hashIndex);
    const hash = hashIndex < 0 ? "" : url.substring(hashIndex);
    const queryIndex = beforeHash.indexOf("?");
    const base =
        queryIndex < 0 ? beforeHash : beforeHash.substring(0, queryIndex);
    const query = queryIndex < 0 ? "" : beforeHash.substring(queryIndex);

    return (
        base +
        removeAuthResponse(
            query,
            responseMode === Constants.ResponseMode.QUERY
        ) +
        removeAuthResponse(hash, true)
    );
}

/**
 * Filters only known response fields after recognizing a redirect response.
 */
function removeAuthResponse(
    response: string,
    allowResponseWithoutState: boolean
): string {
    if (!isRedirectResponse(response, allowResponseWithoutState)) {
        return response;
    }

    const remaining = response
        .substring(1)
        .split("&")
        .filter((parameter) => {
            const key = new URLSearchParams(parameter).keys().next().value;
            return !authResponseKeys.has(key);
        })
        .join("&");
    return remaining ? response.charAt(0) + remaining : "";
}

/**
 * Cleans the visible redirect URL without adding history or navigating. Hash
 * assignment is the fallback for hosts such as Office that disable replaceState.
 */
export function clearRedirectResponseFromUrl(
    contentWindow: Window,
    responseMode: string = Constants.ResponseMode.FRAGMENT,
    logger?: Logger,
    correlationId: string = ""
): void {
    const { origin, pathname, search, hash } = contentWindow.location;
    const originalUrl = origin + pathname + search + hash;
    const cleanUrl = sanitizeRedirectUrl(originalUrl, responseMode);
    if (cleanUrl === originalUrl) {
        return;
    }

    try {
        if (typeof contentWindow.history.replaceState === "function") {
            contentWindow.history.replaceState(
                contentWindow.history.state,
                "",
                cleanUrl
            );
            logger?.verbose(
                "Removed authentication response parameters from the URL.",
                correlationId
            );
            return;
        }
    } catch {
        // Some hosts expose replaceState but reject its use. Try hash cleanup.
    }
    try {
        const cleanLocation = new URL(cleanUrl);
        // eslint-disable-next-line security/detect-possible-timing-attacks -- Comparing URL fragments, not validating secrets.
        if (hash !== cleanLocation.hash) {
            contentWindow.location.hash = cleanLocation.hash;
        }
        if (search === cleanLocation.search) {
            return;
        }
    } catch {
        // Cleanup must not replace the result or error of authentication.
    }

    const message =
        "Unable to remove authentication response parameters from the URL without navigation.";
    if (logger) {
        logger.warning(message, correlationId);
    } else {
        // The standalone redirect bridge has no application logger.
        // eslint-disable-next-line no-console
        console.warn(message);
    }
}
