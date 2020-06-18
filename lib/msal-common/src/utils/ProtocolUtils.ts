/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils } from "./StringUtils";
import { Constants } from "./Constants";
import { ICrypto } from "../crypto/ICrypto";
import { TimeUtils } from "./TimeUtils";
import { ClientAuthError } from "../error/ClientAuthError";

export type LibraryStateObject = {
    id: string,
    ts: number
};

export type RequestStateObject = {
    userRequestState: string,
    libraryState: LibraryStateObject
};

/**
 * Class which provides helpers for OAuth 2.0 protocol specific values
 */
export class ProtocolUtils {

    /**
     * Appends user state with random guid, or returns random guid.
     * @param userState 
     * @param randomGuid 
     */
    static setRequestState(userState: string, cryptoObj: ICrypto): string {
        const libraryState = ProtocolUtils.generateLibraryState(cryptoObj);
        return !StringUtils.isEmpty(userState) ? `${libraryState}${Constants.RESOURCE_DELIM}${userState}` : libraryState;
    }

    /**
     * Generates the state value used by the library.
     * @param randomGuid 
     * @param cryptoObj 
     */
    static generateLibraryState(cryptoObj: ICrypto): string {
        const stateObj: LibraryStateObject = {
            id: cryptoObj.createNewGuid(),
            ts: TimeUtils.nowSeconds()
        };

        const stateString = JSON.stringify(stateObj);

        return cryptoObj.base64Encode(stateString);
    }

    static parseRequestState(state: string, cryptoObj: ICrypto): RequestStateObject {
        if (StringUtils.isEmpty(state)) {
            throw ClientAuthError.createInvalidStateError(state, "Null, undefined or empty state");
        }

        try {
            const splitState = decodeURIComponent(state).split(Constants.RESOURCE_DELIM);
            const libraryState = splitState[0];
            const userState = splitState.length > 1 ? splitState.slice(1).join(Constants.RESOURCE_DELIM) : "";
            const libraryStateString = cryptoObj.base64Decode(libraryState);
            const libraryStateObj = JSON.parse(libraryStateString) as LibraryStateObject;
            return {
                userRequestState: !StringUtils.isEmpty(userState) ? userState : "",
                libraryState: libraryStateObj
            };
        } catch(e) {
            throw ClientAuthError.createInvalidStateError(state, e);
        }
    }
}
