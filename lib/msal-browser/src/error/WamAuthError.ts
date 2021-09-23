/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

export type OSError = {
    error: number;
    protocol_error: string;
    retryable: boolean;
    properties: object;
};

export const WamAuthErrorMessage = {
    wamAtPopNotSupported: {
        code: "wam_access_token_pop_not_supported",
        desc: "WAM flow does not currently support access token proof of posession."
    }
};

export class WamAuthError extends AuthError {
    ext: OSError | undefined;

    constructor(errorCode: string, description: string, ext?: OSError) {
        super(errorCode, description);

        Object.setPrototypeOf(this, WamAuthError.prototype);
        this.name = "WamAuthError";
        this.ext = ext;
    }

    /**
     * Errors thrown by the browser extension. Typically means the extension was uninstalled, disabled or unable to communicate with the native layer. These errors should result in a fallback to the 'standard' browser based auth flow 
     */
    isExtensionError(): boolean {
        return this.errorCode === "ContentError";
    }
    
    /*
     * Create an error thrown when a proof-of-posession request is made to WAM
     */
    static createWamAtPopNotSupportedError(): WamAuthError {
        return new WamAuthError(WamAuthErrorMessage.wamAtPopNotSupported.code, WamAuthErrorMessage.wamAtPopNotSupported.desc);
    }
}
