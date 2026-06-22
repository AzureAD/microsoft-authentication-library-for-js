/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RESOURCE_DELIM } from "./Constants.js";
import { ICrypto } from "../crypto/ICrypto.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import { LibraryStateObject, RequestStateObject } from "./StateTypes.js";

/**
 * Appends user state with random guid, or returns random guid.
 * @param cryptoObj
 * @param userState
 * @param meta
 * @param correlationId
 */
export function setRequestState(
    cryptoObj: ICrypto,
    userState: string | undefined,
    meta: Record<string, string> | undefined,
    correlationId: string
): string {
    const libraryState = generateLibraryState(cryptoObj, correlationId, meta);
    return userState
        ? `${libraryState}${RESOURCE_DELIM}${userState}`
        : libraryState;
}

/**
 * Generates the state value used by the common library.
 * @param cryptoObj
 * @param correlationId
 * @param meta
 */
export function generateLibraryState(
    cryptoObj: ICrypto,
    correlationId: string,
    meta?: Record<string, string>
): string {
    if (!cryptoObj) {
        throw createClientAuthError(
            ClientAuthErrorCodes.noCryptoObject,
            correlationId
        );
    }

    // Create a state object containing a unique id and the timestamp of the request creation
    const stateObj: LibraryStateObject = {
        id: cryptoObj.createNewGuid(),
    };

    if (meta) {
        stateObj.meta = meta;
    }

    const stateString = JSON.stringify(stateObj);

    return cryptoObj.base64Encode(stateString);
}

/**
 * Parses the state into the RequestStateObject, which contains the LibraryState info and the state passed by the user.
 * @param base64Decode
 * @param state
 * @param correlationId
 */
export function parseRequestState(
    base64Decode: (input: string) => string,
    state: string,
    correlationId: string
): RequestStateObject {
    if (!base64Decode) {
        throw createClientAuthError(
            ClientAuthErrorCodes.noCryptoObject,
            correlationId
        );
    }

    if (!state) {
        throw createClientAuthError(
            ClientAuthErrorCodes.invalidState,
            correlationId
        );
    }

    try {
        // Split the state between library state and user passed state and decode them separately
        const splitState = state.split(RESOURCE_DELIM);
        const libraryState = splitState[0];
        const userState =
            splitState.length > 1
                ? splitState.slice(1).join(RESOURCE_DELIM)
                : "";
        const libraryStateString = base64Decode(libraryState);
        const libraryStateObj = JSON.parse(
            libraryStateString
        ) as LibraryStateObject;
        return {
            userRequestState: userState || "",
            libraryState: libraryStateObj,
        };
    } catch (e) {
        throw createClientAuthError(
            ClientAuthErrorCodes.invalidState,
            correlationId
        );
    }
}
