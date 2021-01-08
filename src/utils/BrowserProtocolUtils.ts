/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "./BrowserConstants";
import { StringUtils, ClientAuthError, ICrypto, RequestStateObject, ProtocolUtils, ServerAuthorizationCodeResponse, UrlString } from "@azure/msal-common";

export type BrowserStateObject = {
    interactionType: InteractionType
};

export class BrowserProtocolUtils {

    /**
     * Extracts the BrowserStateObject from the state string.
     * @param browserCrypto 
     * @param state 
     */
    static extractBrowserRequestState(browserCrypto: ICrypto, state: string): BrowserStateObject | null {
        if (StringUtils.isEmpty(state)) {
            return null;
        }

        try {
            const requestStateObj: RequestStateObject = ProtocolUtils.parseRequestState(browserCrypto, state);
            return requestStateObj.libraryState.meta as BrowserStateObject;
        } catch (e) {
            throw ClientAuthError.createInvalidStateError(state, e);
        }
    }

    /**
     * Parses properties of server response from url hash
     * @param locationHash Hash from url
     */
    static parseServerResponseFromHash(locationHash: string): ServerAuthorizationCodeResponse {
        if (!locationHash) {
            return {};
        }
        
        const hashUrlString = new UrlString(locationHash);
        return UrlString.getDeserializedHash(hashUrlString.getHash());
    }
}
