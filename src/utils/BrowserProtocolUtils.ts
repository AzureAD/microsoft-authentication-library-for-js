/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "./BrowserConstants";
import { StringUtils, ClientAuthError, ICrypto, RequestStateObject, ProtocolUtils } from "@azure/msal-common";

export type BrowserStateObject = {
    interactionType: InteractionType
};

export class BrowserProtocolUtils {

    /**
     * Extracts the BrowserStateObject from the state string.
     * @param browserCrypto 
     * @param state 
     */
    static extractBrowserRequestState(browserCrypto: ICrypto, state: string): BrowserStateObject {
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
}
