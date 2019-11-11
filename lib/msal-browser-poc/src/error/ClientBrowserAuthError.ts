/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientAuthError } from "msal-common";

export const ClientAuthErrorMessage = {
    pkceNotGenerated: {
        code: "pkce_not_created",
        desc: "The PKCE code challenge and verifier could not be generated."
    },
    authCodeResponseDoesNotExist: {
        code: "auth_code_response_dne",
        desc: "The response from the auth code request does not exist, or does not contain an auth code."
    }
};

export class ClientBrowserAuthError extends ClientAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientBrowserAuthError";

        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }

    static createPKCENotGeneratedError(errDetail: string): ClientBrowserAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.pkceNotGenerated.code, `${ClientAuthErrorMessage.pkceNotGenerated.desc} Details: ${errDetail}`);
    }

    static createAuthCodeResponseDNEError(errDetail: string): ClientBrowserAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.authCodeResponseDoesNotExist.code, `${ClientAuthErrorMessage.authCodeResponseDoesNotExist.desc} Details: ${errDetail}`);
    }
}
