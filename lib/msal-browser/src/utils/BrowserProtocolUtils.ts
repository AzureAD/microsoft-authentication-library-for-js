/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "./BrowserConstants";
import {
    ICrypto,
    RequestStateObject,
    ProtocolUtils,
    createClientAuthError,
    ClientAuthErrorCodes,
} from "@azure/msal-common";

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
    state: string
): BrowserStateObject | null {
    if (!state) {
        return null;
    }

    try {
        const requestStateObj: RequestStateObject =
            ProtocolUtils.parseRequestState(browserCrypto, state);
        return requestStateObj.libraryState.meta as BrowserStateObject;
    } catch (e) {
        throw createClientAuthError(ClientAuthErrorCodes.invalidState);
    }
}
