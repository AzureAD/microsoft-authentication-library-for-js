/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "./ClientAuthError";

export const ClientConfigurationErrorMessage = {
    redirectUriNotSet: {
        code: "redirect_uri_empty",
        desc: "A redirect URI is required for all calls, and none has been set."
    },
    postLogoutUriNotSet: {
        code: "post_logout_uri_empty",
        desc: "A post logout redirect has not been set."
    }
};

/**
 * Error thrown when there is an error in configuration of the .js library.
 */
export class ClientConfigurationError extends ClientAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientConfigurationError";
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }

    static createRedirectUriEmptyError(): ClientAuthError {
        return new ClientAuthError(ClientConfigurationErrorMessage.redirectUriNotSet.code,
            ClientConfigurationErrorMessage.redirectUriNotSet.desc);
    }

    static createPostLogoutRedirectUriEmptyError(): ClientAuthError {
        return new ClientAuthError(ClientConfigurationErrorMessage.postLogoutUriNotSet.code,
            ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
    }
}
