/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "./BrowserConstants.js";
import {
    ICrypto,
    RequestStateObject,
    ProtocolUtils,
    createClientAuthError,
    ClientAuthErrorCodes,
    AuthError,
    Constants,
    Logger,
    UrlUtils,
} from "@azure/msal-common/browser";
import { base64Decode } from "../encode/Base64Decode.js";

const redirectResponseKeys = [
    "code",
    "ear_jwe",
    "accountId",
    "nativeAccountId",
];
const authResponseKeys = new Set([
    ...redirectResponseKeys,
    "state",
    "error",
    "error_description",
]);

export type BrowserStateObject = {
    interactionType: InteractionType;
};

/**
 * Extracts the BrowserStateObject from the state string.
 * @param browserCrypto
 * @param state
 */
export function extractBrowserRequestState(
    browserCrypto: ICrypto,
    state: string,
    correlationId: string
): BrowserStateObject | null {
    if (!state) {
        return null;
    }

    try {
        const requestStateObj: RequestStateObject =
            ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                state,
                correlationId
            );
        return requestStateObj.libraryState.meta as BrowserStateObject;
    } catch (e) {
        throw createClientAuthError(
            ClientAuthErrorCodes.invalidState,
            correlationId
        );
    }
}

/**
 * Filters redirect response fields, preserving application parameters verbatim.
 * Query strings require redirect state unless query response mode is selected.
 */
function removeAuthResponse(
    response: string,
    allowResponseWithoutState: boolean,
    responseValuesOnly: boolean
): string {
    if (response.startsWith("#/")) {
        return response;
    }
    const content = UrlUtils.stripLeadingHashOrQuery(response);
    if (!content || !/^[^=&?#/]+(?:=|&|$)/.test(content)) {
        return response;
    }

    const params = new URLSearchParams(content);
    const hasResponseValue = redirectResponseKeys.some((key) =>
        params.has(key)
    );
    if (responseValuesOnly && !hasResponseValue) {
        return response;
    }
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
        return response;
    }

    if (
        interactionType !== InteractionType.Redirect &&
        !(allowResponseWithoutState && hasResponseValue)
    ) {
        return response;
    }

    const remaining = content
        .split("&")
        .filter((parameter) => {
            const key = new URLSearchParams(parameter).keys().next().value;
            return !authResponseKeys.has(key);
        })
        .join("&");
    return remaining ? response.charAt(0) + remaining : "";
}

/**
 * Checks both query and fragment for redirect response fields and preserves app parameters.
 * Cleans the visible URL without adding history or navigating. Hash
 * assignment is the fallback for hosts such as Office that disable replaceState.
 * When responseValuesOnly is true, state/error metadata alone is preserved.
 * Returns whether a response was found for cleanup, even if cleanup is unavailable.
 */
export function clearRedirectResponseFromUrl(
    contentWindow: Window,
    responseMode: string = Constants.ResponseMode.FRAGMENT,
    logger?: Logger,
    correlationId: string = "",
    responseValuesOnly: boolean = false
): boolean {
    const { origin, pathname, search, hash } = contentWindow.location;
    const originalUrl = origin + pathname + search + hash;
    const cleanQuery = removeAuthResponse(
        search,
        responseMode === Constants.ResponseMode.QUERY,
        responseValuesOnly
    );
    const cleanHash = removeAuthResponse(hash, true, responseValuesOnly);
    const cleanUrl = origin + pathname + cleanQuery + cleanHash;
    if (cleanUrl === originalUrl) {
        return false;
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
            return true;
        }
    } catch {
        // Some hosts expose replaceState but reject its use. Try hash cleanup.
    }
    try {
        // eslint-disable-next-line security/detect-possible-timing-attacks -- Comparing URL fragments to determine whether an update is needed.
        if (hash !== cleanHash) {
            contentWindow.location.hash = cleanHash;
        }
        if (search === cleanQuery) {
            return true;
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
    return true;
}
