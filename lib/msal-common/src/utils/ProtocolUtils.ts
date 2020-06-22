/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils } from "./StringUtils";
import { Constants } from "./Constants";

/**
 * Class which provides helpers for OAuth 2.0 protocol specific values
 */
export class ProtocolUtils {

    /**
     * Appends user state with random guid, or returns random guid.
     * @param userState 
     * @param randomGuid 
     */
    static setRequestState(userState: string, randomGuid: string): string {
        return !StringUtils.isEmpty(userState) ? `${randomGuid}${Constants.RESOURCE_DELIM}${userState}` : randomGuid;
    }

    /**
     *
     * Extracts user state value from the state sent with the authentication request.
     * @returns {string} scope.
     * @ignore
     */
    static getUserRequestState(serverResponseState: string): string {
        if (!StringUtils.isEmpty(serverResponseState)) {
            const splitIndex = serverResponseState.indexOf(Constants.RESOURCE_DELIM);
            if (splitIndex > -1 && splitIndex + 1 < serverResponseState.length) {
                return serverResponseState.substring(splitIndex + 1);
            }
        }
        return "";
    }
}
