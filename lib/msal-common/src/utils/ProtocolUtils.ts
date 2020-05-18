/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils } from "./StringUtils";
import { Constants } from "./Constants";
import { TimeUtils } from "./TimeUtils";
import { ICrypto } from "../crypto/ICrypto";
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
    static setRequestState(userState: string, randomGuid: string, cryptoObj: ICrypto): string {
        const libraryState = ProtocolUtils.generateLibraryState(randomGuid, cryptoObj);
        return !StringUtils.isEmpty(userState) ? `${libraryState}${Constants.RESOURCE_DELIM}${userState}` : libraryState;
    }

    /**
     * Generates the state value used by the library.
     * @param randomGuid 
     * @param cryptoObj 
     * 
     * @returns Base64 encoded string representing the state
     */
    static generateLibraryState(randomGuid: string, cryptoObj: ICrypto): string {
        const stateObject: LibraryStateObject = {
            id: randomGuid,
            ts: TimeUtils.nowSeconds()
        };

        const stateString = JSON.stringify(stateObject);

        return cryptoObj.base64Encode(stateString);
    }

    /**
     * Extracts user state value and library state value 
     * from the state sent with the authentication request.
     * @param state 
     * @param cryptoObj 
     */
    static parseRequestState(state: string, cryptoObj: ICrypto): RequestStateObject {
        try {
            if (StringUtils.isEmpty(state)) {
                state = "";
            }

            const [
                libraryState,
                userState
            ] = decodeURIComponent(state).split(Constants.RESOURCE_DELIM);

            const libraryStateString = cryptoObj.base64Decode(libraryState);

            const libraryStateObject = JSON.parse(libraryStateString) as LibraryStateObject;

            return {
                userRequestState: !StringUtils.isEmpty(userState) ? userState : "",
                libraryState: libraryStateObject
            };
        } catch (e) {
            throw ClientAuthError.createInvalidStateError(state);
        }
    }
}
