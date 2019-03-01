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

import { Constants } from "../Constants";
import { ClientAuthError } from "./ClientAuthError";
import { ErrorMessage } from "../ErrorMessage";

/**
 * @hidden
 *
 * Error thrown when there is an error in configuration of the .js library.
 */
export class ClientConfigurationError extends ClientAuthError {
    constructor(error: string, errorDesc: string) {
        super(error, errorDesc);
        this.name = "ConfigurationError";
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }

    static createInvalidCacheLocationConfigError(givenCacheLocation: string): ClientConfigurationError {
        return new ClientConfigurationError(ErrorMessage.invalidCacheLocation.code,
            ErrorMessage.invalidCacheLocation.desc + "Provided value:" + givenCacheLocation +
            ". Possible values are: " + Constants.cacheLocationLocal + ", " + Constants.cacheLocationSession);
    }

    static createNoCallbackError(): ClientConfigurationError {
        return new ClientConfigurationError(ErrorMessage.noCallback.code,
            ErrorMessage.noCallback.desc);
    }

    static createErrorInCallbackFunction(errorDesc: string): ClientAuthError {
        return new ClientConfigurationError(ErrorMessage.callbackError.code,
            ErrorMessage.callbackError.desc + errorDesc);
    }

    static createEmptyScopesArrayError(scopesValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ErrorMessage.emptyScopes.code,
            ErrorMessage.emptyScopes.desc + ". Given value: " + scopesValue);
    }

    static createScopesNonArrayError(scopesValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ErrorMessage.nonArrayScopes.code,
            ErrorMessage.nonArrayScopes.desc + " Given value: " + scopesValue);
    }

    static createClientIdSingleScopeError(scopesValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ErrorMessage.clientScope.code,
            ErrorMessage.clientScope.desc + " Given value: " + scopesValue);
    }
}
