/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import {
    AuthActionResultBase,
    CodeSendResult,
    ContinuationTokenResult,
} from "../../../core/interaction_client/AuthActionResult.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";

export class SignInCompleteResult extends AuthActionResultBase {
    constructor(
        public authenticationResult: AuthenticationResult,
        correlationId: string
    ) {
        super(correlationId);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "authenticationResult",
            authenticationResult,
            correlationId
        );
    }
}

export class SignInWithContinuationTokenResult extends ContinuationTokenResult {}

export class SignInCodeSendResult extends CodeSendResult {}
