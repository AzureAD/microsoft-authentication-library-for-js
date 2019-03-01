/**
  * Copyright (c) Microsoft Corporation
  *  All Rights Reserved
  *  MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy of this
  * software and associated documentation files (the "Software"), to deal in the Software
  * without restriction, including without limitation the rights to use, copy, modify,
  * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  * permit persons to whom the Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
  * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */

import { AuthError } from "./AuthError";
import { ErrorMessage } from "../ErrorMessage";
import { Utils } from "../Utils";

/**
 * @hidden
 *
 * Error thrown when there is an error in the client code running on the browser.
 */
export class ClientAuthError extends AuthError {
    constructor(error: string, errorDesc: string) {
        super(error, errorDesc);
        this.name = "ClientAuthError";

        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }

    static createEndpointResolutionError(errDesc: string): ClientAuthError {
        var errorMessage = "Error: could not resolve endpoints. Please check network and try again.";
        if (!Utils.isEmpty(errDesc)) {
            errorMessage += " Details: " + errDesc;
        }
        return new ClientAuthError(ErrorMessage.endpointResolutionError.code, errorMessage);
    }

    static createMultipleMatchingTokensInCacheError(scope: string): ClientAuthError {
        return new ClientAuthError(ErrorMessage.multipleMatchingTokens.code,
            "Cache error for scope " + scope + ": " + ErrorMessage.multipleMatchingTokens.desc);
    }

    static createMultipleAuthoritiesInCacheError(scope: string): ClientAuthError {
        return new ClientAuthError(ErrorMessage.multipleMatchingAuthorities.code,
            "Cache error for scope " + scope + ": " + ErrorMessage.multipleMatchingAuthorities.desc);
    }

    static createPopupWindowError(): ClientAuthError {
        return new ClientAuthError(ErrorMessage.popUpWindowError.code,
            ErrorMessage.popUpWindowError.desc);
    }

    static createTokenRenewalTimeoutError(): ClientAuthError {
        return new ClientAuthError(ErrorMessage.tokenRenewalError.code,
            ErrorMessage.tokenRenewalError.desc);
    }

    static createInvalidStateError(invalidState: string, actualState: string): ClientAuthError {
        return new ClientAuthError(ErrorMessage.invalidStateError.code,
            ErrorMessage.invalidStateError.desc + invalidState + ", state expected : " + actualState);
    }

    static createNonceMismatchError(invalidNonce: string, actualNonce: string): ClientAuthError {
        return new ClientAuthError(ErrorMessage.nonceMismatchError.code,
            ErrorMessage.nonceMismatchError + invalidNonce + ", nonce expected : " + actualNonce);
    }

    static createLoginInProgressError(): ClientAuthError {
        return new ClientAuthError(ErrorMessage.loginProgressError.code,
            ErrorMessage.loginProgressError.desc);
    }

    static createAcquireTokenInProgressError(): ClientAuthError {
        return new ClientAuthError(ErrorMessage.acquireTokenProgressError.code,
            ErrorMessage.acquireTokenProgressError.desc);
    }

    static createUserCancelledError(): ClientAuthError {
        return new ClientAuthError(ErrorMessage.userCancelledError.code,
            ErrorMessage.userCancelledError.desc);
    }
}