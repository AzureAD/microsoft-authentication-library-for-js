/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientAuthError } from "msal-common";

export const ClientAuthErrorMessage = {
    pkceNotGenerated: {
        code: "pkce_not_created",
        desc: "The PKCE code challenge and verifier could not be generated."
    }
};

export class ClientBrowserAuthError extends ClientAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientBrowserAuthError";

        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }

    static createPKCENotGeneratedError(errDetail: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.pkceNotGenerated.code, `${ClientAuthErrorMessage.pkceNotGenerated.desc} Details: ${errDetail}`);
    }
}
