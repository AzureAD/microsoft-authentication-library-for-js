/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "./BrowserConstants";
import { CryptoOps } from "../crypto/CryptoOps";
import { StringUtils, ClientAuthError } from "@azure/msal-common";

export type BrowserStateObject = {
    interactionType: string
};

export class BrowserProtocolUtils {

    /**
     * Generates the state value used by the platform library
     * @param browserCrypto 
     * @param requestInteractionType 
     */
    static generateBrowserRequestState(browserCrypto: CryptoOps, requestInteractionType: InteractionType): string {
        const stateObj: BrowserStateObject = {
            interactionType: requestInteractionType
        };

        const stateString = JSON.stringify(stateObj);

        return browserCrypto.base64Encode(stateString);
    }

    /**
     * Parses the platform state string into the BrowserStateObject.
     * @param browserCrypto 
     * @param state 
     */
    static parseBrowserRequestState(browserCrypto: CryptoOps, state: string): BrowserStateObject {
        if (StringUtils.isEmpty(state)) {
            return null;
        }

        try {
            const platformStateString = browserCrypto.base64Decode(state);
            return JSON.parse(platformStateString) as BrowserStateObject;
        } catch (e) {
            throw ClientAuthError.createInvalidStateError(state, e);
        }
    }
}
