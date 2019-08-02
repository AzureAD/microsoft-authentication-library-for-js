// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthError } from "./AuthError";
import { IdToken } from "../IdToken";
import { StringUtils } from "../utils/StringUtils";

export const EnvironmentErrorMessage = {
    noResolveInIframe: {
        code: "no_resolve_in_iframe",
        desc: `Msal.js does not currently support resolving a silent token request in an iframe`
    }
};

/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export class EnvironmentError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "EnvironmentError";

        Object.setPrototypeOf(this, EnvironmentError.prototype);
    }

    static createNoResolveInIframeError(): EnvironmentError {
        const { code, desc } = EnvironmentErrorMessage.noResolveInIframe
        return new EnvironmentError(code, desc);
    }


}
