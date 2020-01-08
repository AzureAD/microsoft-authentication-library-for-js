/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientAuthError } from "../error/ClientAuthError";
import { ServerError } from "../error/ServerError";
import { buildClientInfo } from "../auth/ClientInfo";
import { ICrypto } from "../crypto/ICrypto";

/**
 * Deserialized response object from server authorization code request.
 * - code: authorization code from server
 * - client_info: client info object
 * - state: OAuth2 request state
 */
export type ServerAuthorizationCodeResponse = {
    code?: string;
    client_info?: string;
    state?: string;
    error?: string,
    error_description?: string;
};

export function validateServerAuthorizationCodeResponse(serverResponseHash: ServerAuthorizationCodeResponse, cachedState: string, cryptoObj: ICrypto): void {
    if (serverResponseHash.state !== cachedState) {
        throw ClientAuthError.createStateMismatchError();
    }

    // Check for error
    if (serverResponseHash.error || serverResponseHash.error_description) {
        throw new ServerError(serverResponseHash.error, serverResponseHash.error_description);
    }

    buildClientInfo(serverResponseHash.client_info, cryptoObj);
}
