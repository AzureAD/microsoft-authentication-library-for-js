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
 import { ErrorMessage } from "./ErrorMessage";
 import { Utils } from "./Utils";
  /**
  * @hidden
  *
  * General error class thrown by the MSAL.js library.
  */
 export class AuthError extends Error {
     error: string;
     errorDesc: string;

     constructor(error: string, detailMessage: string) {
         super(detailMessage);
         this.error = error;
         this.errorDesc = detailMessage;
         this.name = "AuthError";
         this.stack = new Error().stack;
 
         Object.setPrototypeOf(this, AuthError.prototype);
     }
      static createUnexpectedError(errDesc: string) {
         return new AuthError(ErrorMessage.unexpectedError.code, errDesc);
     }
 }
 
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
 
     static createEndpointResolutionError(errDesc: string) : ClientAuthError {
         var errorMessage = "Error: could not resolve endpoints. Please check network and try again.";
         if (!Utils.isEmpty(errDesc)) {
             errorMessage += " Details: " + errDesc;
         }
         return new ClientAuthError(ErrorMessage.endpointResolutionError.code, errorMessage);
     }
 
     static createMultipleMatchingTokensInCacheError(scope: string) : ClientAuthError {
        return new ClientAuthError(ErrorMessage.multipleMatchingTokens.code,
            "Cache error for scope " + scope + ": " + ErrorMessage.multipleMatchingTokens.desc);
     }
 
     static createMultipleAuthoritiesInCacheError(scope: string) : ClientAuthError {
         return new ClientAuthError(ErrorMessage.multipleMatchingAuthorities.code,
             "Cache error for scope " + scope + ": " + ErrorMessage.multipleMatchingAuthorities.desc);
     }
 
     static createPopupWindowError() : ClientAuthError {
         return new ClientAuthError(ErrorMessage.popUpWindowError.code,
             ErrorMessage.popUpWindowError.desc);
     }
 
     static createTokenRenewalTimeoutError() : ClientAuthError {
         return new ClientAuthError(ErrorMessage.tokenRenewalError.code,
             ErrorMessage.tokenRenewalError.desc);
     }
 
     static createInvalidStateError(invalidState: string, actualState: string) : ClientAuthError {
         return new ClientAuthError(ErrorMessage.invalidStateError.code,
             ErrorMessage.invalidStateError.desc + invalidState + ", state expected : " + actualState);
     }
 
     static createNonceMismatchError(invalidNonce: string, actualNonce: string) : ClientAuthError {
         return new ClientAuthError(ErrorMessage.nonceMismatchError.code,
             ErrorMessage.nonceMismatchError + invalidNonce + ", nonce expected : " + actualNonce);
     }
 
     static createLoginInProgressError() : ClientAuthError {
         return new ClientAuthError(ErrorMessage.loginProgressError.code,
             ErrorMessage.loginProgressError.desc);
     }
 
     static createAcquireTokenInProgressError() : ClientAuthError {
         return new ClientAuthError(ErrorMessage.acquireTokenProgressError.code,
             ErrorMessage.acquireTokenProgressError.desc);
     }
 
     static createUserCancelledError() : ClientAuthError {
         return new ClientAuthError(ErrorMessage.userCancelledError.code,
             ErrorMessage.userCancelledError.desc);
     }
 }
 
 /**
  * @hidden
  *
  * Error thrown when there is an error in configuration of the .js library.
  */
 export class ConfigurationError extends ClientAuthError {
     constructor(error: string, errorDesc: string) {
         super(error, errorDesc);
         this.name = "ConfigurationError";
         Object.setPrototypeOf(this, ConfigurationError.prototype);
     }
 
     static createInvalidCacheLocationConfigError(givenCacheLocation: string) : ConfigurationError {
         return new ConfigurationError(ErrorMessage.invalidCacheLocation.code,
             ErrorMessage.invalidCacheLocation.desc + "Provided value:" + givenCacheLocation +
             ". Possible values are: " + Constants.cacheLocationLocal + ", " + Constants.cacheLocationSession);
     }
 
     static createNoCallbackError() : ConfigurationError {
         return new ConfigurationError(ErrorMessage.noCallback.code,
             ErrorMessage.noCallback.desc);
     }

     static createErrorInCallbackFunction(errorDesc: string) : ClientAuthError {
        return new ConfigurationError(ErrorMessage.callbackError.code,
             ErrorMessage.callbackError.desc + errorDesc);
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
 
     static createEmptyScopesArrayError(scopesValue: string) : ConfigurationError {
         return new ConfigurationError(ErrorMessage.emptyScopes.code,
             ErrorMessage.emptyScopes.desc + ". Given value: " + scopesValue);
     }
 
     static createScopesNonArrayError(scopesValue: string) : ConfigurationError {
         return new ConfigurationError(ErrorMessage.nonArrayScopes.code,
             ErrorMessage.nonArrayScopes.desc + " Given value: " + scopesValue);
     }
 
     static createClientIdSingleScopeError(scopesValue: string) : ConfigurationError {
         return new ConfigurationError(ErrorMessage.clientScope.code,
            ErrorMessage.clientScope.desc + " Given value: " + scopesValue);
     }
 }
 
 /**
  * @hidden
  *
  * Error thrown when there is an error with the server code, for example, unavailability.
  */
 export class ServerError extends AuthError {
     constructor(error: string, errorDesc: string) {
         super(error, errorDesc);
         this.name = "ServerError";
 
         Object.setPrototypeOf(this, ServerError.prototype);
     }
 
     static createServerUnavailableError() : ServerError {
         return new ServerError(ErrorMessage.serverUnavailable.code,
             ErrorMessage.serverUnavailable.desc);
     }
 
     static createUnknownServerError(errorDesc: string) : ServerError {
         return new ServerError(ErrorMessage.unknownServerError.code,
             errorDesc);
     }
 }
 
 /**
  * @hidden
  *
  * Error thrown when the user is required to perform an interactive token request.
  */
 export class InteractionRequiredAuthError extends ServerError {
     constructor(error: string, errorDesc: string) {
         super(error, errorDesc);
         this.name = "InteractionRequiredAuthError";
 
         Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
     }

    static createLoginRequiredAuthError(errorDesc: string) : InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(ErrorMessage.loginRequired, errorDesc);
    }

    static createInteractionRequiredAuthError(errorDesc: string) : InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(ErrorMessage.interactionRequired, errorDesc);
    }

    static createConsentRequiredAuthError(errorDesc: string) : InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(ErrorMessage.consentRequired, errorDesc);
    }
 }
 
 /**
  * @hidden
  *
  * Error thrown when the client must provide additional proof to acquire a token. This will be used for conditional access cases.
  */
 export class ClaimsRequiredAuthError extends InteractionRequiredAuthError {
     claimsRequired: string;
     constructor(error: string, errorDesc: string, claimsRequired: string) {
        super(error, errorDesc);
         this.name = "ClaimsRequiredAuthError";
         this.claimsRequired = claimsRequired;
 
         Object.setPrototypeOf(this, ClaimsRequiredAuthError.prototype);
     }
 }