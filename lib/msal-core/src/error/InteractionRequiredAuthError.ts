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

import { ServerError } from "./ServerError";

export const InteractionRequiredAuthErrorMessage = {
    loginRequired: {
        code: "login_required"
    },
    interactionRequired: {
        code: "interaction_required"
    },
    consentRequired: {
        code: "consent_required"
    },
};

/**
 * Error thrown when the user is required to perform an interactive token request.
 */
export class InteractionRequiredAuthError extends ServerError {

    constructor(errorCode: string, errorMessage: string) {
        super(errorCode, errorMessage);
        this.name = "InteractionRequiredAuthError";

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    static createLoginRequiredAuthError(errorDesc: string): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.loginRequired.code, errorDesc);
    }

    static createInteractionRequiredAuthError(errorDesc: string): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.interactionRequired.code, errorDesc);
    }

    static createConsentRequiredAuthError(errorDesc: string): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.consentRequired.code, errorDesc);
    }
}
