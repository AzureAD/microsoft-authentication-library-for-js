/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "./BrowserConstants";
import {
    ICrypto,
    RequestStateObject,
    ProtocolUtils,
    ServerAuthorizationCodeResponse,
    UrlString,
    createClientAuthError,
    ClientAuthErrorCodes,
} from "@azure/msal-common";

export type BrowserStateObject = {
    interactionType: InteractionType;
};

export class BrowserProtocolUtils {
    /**
     * Extracts the BrowserStateObject from the state string.
     * @param browserCrypto
     * @param state
     */
    static extractBrowserRequestState(
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

    /**
     * Parses properties of server response from url hash
     * @param locationHash Hash from url
     */
    static parseServerResponseFromHash(
        locationHash: string
    ): ServerAuthorizationCodeResponse {
        if (!locationHash) {
            return {};
        }

        const hashUrlString = new UrlString(locationHash);
        return UrlString.getDeserializedHash(hashUrlString.getHash());
    }
}
