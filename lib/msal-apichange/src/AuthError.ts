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

import { Constants } from "./Constants";
import { E } from "./Error";
import { Utils } from "./Utils";
 /**
 * @hidden
 *
 * General error class thrown by the MSAL.js library.
 */
export class AuthError extends Error {
    errorCode: string;
    tokenRequestType: string;
    userState: string;
    constructor(errorCode: string, detailMessage: string, tokenRequestType: string, userState: string) {
        super(detailMessage);
        this.errorCode = errorCode;
        this.name = "AuthError";
        this.stack = new Error().stack;
        this.tokenRequestType = tokenRequestType;
        this.userState = userState;

        Object.setPrototypeOf(this, AuthError.prototype);
    }
     static createUnexpectedError(errDesc: string, tokenRequestType: string, userState: string) {
        return new AuthError(E.unexpectedError.code, errDesc, tokenRequestType, userState);
    }
}

// TODO: Add error codes
// TODO: Create interaction type enum
// TODO: Replace tokenType with enum (4 values: id_token, access_token, id_token_token, unknown/unavailable)
// TODO: Create table of error and error codes

/**
 * @hidden
 *
 * Error thrown when there is an error in the client code running on the browser.
 */
export class ClientAuthError extends AuthError {
    constructor(errorCode: string, message: string, tokenRequestType: string, userState: string) {
        super(errorCode, message, tokenRequestType, userState);
        this.name = "ClientAuthError";
        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }

    static createEndpointResolutionError(errDesc: string, tokenType: string, userState: string) : ClientAuthError {
        var errorMessage = "ErrorL: could not resolve endpoints. Please check network and try again.";
        if (!Utils.isEmpty(errDesc)) {
            errorMessage += " Details: " + errDesc;
        }
        // TODO: Isn't this supposed to be "errorMessage" instead of "errorDesc"?
        return new ClientAuthError(E.endpointResolutionError.code, errDesc, tokenType, userState);
    }

    static createMultipleMatchingTokensInCacheError(scope: string, tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.multipleMatchingTokens.code,
            "Cache error for scope " + scope + ": " + E.multipleMatchingTokens.desc,
            tokenType,
            userState);
    }

    static createMultipleAuthoritiesInCacheError(scope: string, tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.multipleMatchingAuthorities.code,
            "Cache error for scope " + scope + ": " + E.multipleMatchingAuthorities.desc,
            tokenType,
            userState);
    }

    static createPopupWindowError(tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.popUpWindowError.code,
            E.popUpWindowError.desc,
            tokenType,
            userState);
    }

    static createTokenRenewalTimeoutError(tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.tokenRenewalError.code,
            E.tokenRenewalError.desc,
            tokenType,
            userState);
    }

    static createInvalidStateError(invalidState: string, actualState: string, tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.invalidStateError.code,
            E.invalidStateError.desc + invalidState + ", state expected : " + actualState,
            tokenType,
            userState);
    }

    static createNonceMismatchError(invalidNonce: string, actualNonce: string, tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.nonceMismatchError.code,
            E.nonceMismatchError + invalidNonce + ", nonce expected : " + actualNonce,
            tokenType,
            userState);
    }

    static createLoginInProgressError(tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.loginProgressError.code,
            E.loginProgressError.desc,
            tokenType,
            userState);
    }

    static createAcquireTokenInProgressError(tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.acquireTokenProgressError.code,
            E.acquireTokenProgressError.desc,
            tokenType,
            userState);
    }

    static createUserCancelledError(tokenType: string, userState: string) : ClientAuthError {
        return new ClientAuthError(E.userCancelledError.code,
            E.userCancelledError.desc,
            tokenType,
            userState);
    }
     static createErrorInCallbackFunction(errorDesc: string, tokenType: string, userState: string) : ClientAuthError {
       return new ConfigurationError(E.callbackError.code,
            E.callbackError.desc + errorDesc,
            tokenType,
            userState);
    }
}

/**
 * @hidden
 *
 * Error thrown when there is an error in configuration of the .js library.
 */
export class ConfigurationError extends ClientAuthError {
    constructor(errorCodes: string, message: string, tokenType: string, userState: string) {
        super(errorCodes, message, tokenType, userState);
        this.name = "ConfigurationError";
        Object.setPrototypeOf(this, ConfigurationError.prototype);
    }

    static createInvalidCacheLocationConfigError(givenCacheLocation: string, tokenType: string, userState: string) : ConfigurationError {
        return new ConfigurationError(E.invalidCacheLocation.code,
            E.invalidCacheLocation.desc + "Provided value:" + givenCacheLocation +
            ". Possible values are: " + Constants.cacheLocationLocal + ", " + Constants.cacheLocationSession,
            tokenType,
            userState);
    }

    static createNoCallbackError(tokenType: string, userState: string) : ConfigurationError {
        return new ConfigurationError(E.noCallback.code,
            E.noCallback.desc,
            tokenType,
            userState);
    }

    // TODO: Add these to Error.ts in case if they are uncommented/not deleted later
    // static createCallbackParametersError(numArgs: number, tokenType: string, userState: string) : ClientAuthError {
    //     return new ClientConfigurationAuthError("Error occurred in callback - incorrect number of arguments, expected 2, got " + numArgs + ".",
    //         tokenType,
    //         userState);
    // }

    // static createSuccessCallbackParametersError(numArgs: number, tokenType: string, userState: string) : ClientAuthError {
    //     return new ConfigurationAuthError("Error occurred in callback for successful token response - incorrect number of arguments, expected 1, got " + numArgs + ".", tokenType, userState);
    // }

    // static createErrorCallbackParametersError(numArgs: number, tokenType: string, userState: string) : ClientAuthError {
    //     return new ConfigurationAuthError("Error occurred in callback for error response - incorrect number of arguments, expected 1, got " + numArgs + ".", tokenType, userState);
    // }

    static createEmptyScopesArrayError(scopesValue: string, tokenType: string, userState: string) : ConfigurationError {
        return new ConfigurationError(E.emptyScopes.code,
            E.emptyScopes.desc + ". Given value: " + scopesValue,
            tokenType,
            userState);
    }

    static createScopesNonArrayError(scopesValue: string, tokenType: string, userState: string) : ConfigurationError {
        return new ConfigurationError(E.nonArrayScopes.code,
            E.nonArrayScopes.desc + " Given value: " + scopesValue,
            tokenType,
            userState);
    }

    static createClientIdSingleScopeError(scopesValue: string, tokenType: string, userState: string) : ConfigurationError {
        return new ConfigurationError(E.clientScope.code,
           E.clientScope.desc + " Given value: " + scopesValue,
           tokenType,
           userState);
    }
}

/**
 * @hidden
 *
 * Error thrown when there is an error with the server code, for example, unavailability.
 */
export class ServerError extends AuthError {
    constructor(errorCode: string, message: string, tokenType: string, userState: string) {
        super(errorCode, message, tokenType, userState);
        this.name = "ServerError";

        Object.setPrototypeOf(this, ServerError.prototype);
    }

    static createServerUnavailableError(tokenType: string, userState: string) : ServerError {
        return new ServerError(E.serverUnavailable.code,
            E.serverUnavailable.desc,
            tokenType,
            userState);
    }

    static createUnknownServerError(errorDesc: string, tokenType: string, userState: string) : ServerError {
        return new ServerError(E.unknownServerError.code,
            errorDesc,
            tokenType,
            userState);
    }
}

/**
 * @hidden
 *
 * Error thrown when the user is required to perform an interactive token request.
 */
export class InteractionRequiredAuthError extends ServerError {
    interactionType: string;
    constructor(errorCode: string, message: string, tokenType: string, userState: string) {
        super(errorCode, message, tokenType, userState);
        this.name = "InteractionRequiredAuthError";

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    setInteractionType(interactionType: string) : void {
        this.interactionType = interactionType;
    }

    static createLoginRequiredAuthError(tokenType: string, userState: string) : InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(E.loginRequired.code,
            E.loginRequired.desc,
            tokenType,
            userState);
    }

    static createInteractionRequiredAuthError(errorDesc: string, tokenType: string, userState: string) : InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(E.interactionRequired.code,
            E.interactionRequired + errorDesc,
            tokenType,
            userState);
    }

    static createConsentRequiredAuthError(errorDesc: string, tokenType: string, userState: string) : InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(E.consentRequired.code,
            E.consentRequired.desc + errorDesc,
            tokenType,
            userState);
    }
}

/**
 * @hidden
 *
 * Error thrown when the client must provide additional proof to acquire a token. This will be used for conditional access cases.
 */
export class ClaimsRequiredAuthError extends InteractionRequiredAuthError {
    claimsRequired: string;
    constructor(errorCode: string, message: string, tokenType: string, userState: string, claimsRequired: string) {
       super(errorCode, message, tokenType, userState);
        this.name = "ClaimsRequiredAuthError";
        this.claimsRequired = claimsRequired;

        Object.setPrototypeOf(this, ClaimsRequiredAuthError.prototype);
    }
}
