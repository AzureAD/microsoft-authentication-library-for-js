/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import * as BrowserConfigurationAuthErrorCodes from "./BrowserConfigurationAuthErrorCodes.js";
export { BrowserConfigurationAuthErrorCodes };

export const BrowserConfigurationAuthErrorMessages = {
    [BrowserConfigurationAuthErrorCodes.storageNotSupported]:
        "Given storage configuration option was not supported.",
    [BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled]:
        "Stub instance of Public Client Application was called. If using msal-react, please ensure context is not used without a provider. For more visit: aka.ms/msaljs/browser-errors",
    [BrowserConfigurationAuthErrorCodes.inMemRedirectUnavailable]:
        "Redirect cannot be supported. In-memory storage was selected, which would cause the library to be unable to handle the incoming hash. If you would like to use the redirect API, please use session/localStorage.",
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrowserConfigurationAuthError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "BrowserConfigurationAuthError";

        Object.setPrototypeOf(this, BrowserConfigurationAuthError.prototype);
    }
}

export function createBrowserConfigurationAuthError(
    errorCode: string
): BrowserConfigurationAuthError {
    return new BrowserConfigurationAuthError(
        errorCode,
        BrowserConfigurationAuthErrorMessages[errorCode]
    );
}
