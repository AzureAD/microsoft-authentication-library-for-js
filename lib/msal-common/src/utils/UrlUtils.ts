/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationCodeResponse } from "../response/ServerAuthorizationCodeResponse.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";

/**
 * Parses hash string from given string. Returns empty string if no hash symbol is found.
 * @param hashString
 */
export function stripLeadingHashOrQuery(responseString: string): string {
    if (responseString.startsWith("#/")) {
        return responseString.substring(2);
    } else if (
        responseString.startsWith("#") ||
        responseString.startsWith("?")
    ) {
        return responseString.substring(1);
    }

    return responseString;
}

/**
 * Returns URL hash as server auth code response object.
 */
export function getDeserializedResponse(
    responseString: string
): ServerAuthorizationCodeResponse | null {
    // Check if given hash is empty
    if (!responseString || responseString.indexOf("=") < 0) {
        return null;
    }
    try {
        // Strip the # or ? symbol if present
        const normalizedResponse = stripLeadingHashOrQuery(responseString);
        // If # symbol was not present, above will return empty string, so give original hash value
        const deserializedHash: ServerAuthorizationCodeResponse =
            Object.fromEntries(new URLSearchParams(normalizedResponse));

        // Check for known response properties
        if (
            deserializedHash.code ||
            deserializedHash.error ||
            deserializedHash.error_description ||
            deserializedHash.state
        ) {
            return deserializedHash;
        }
    } catch (e) {
        throw createClientAuthError(ClientAuthErrorCodes.hashNotDeserialized);
    }

    return null;
}
