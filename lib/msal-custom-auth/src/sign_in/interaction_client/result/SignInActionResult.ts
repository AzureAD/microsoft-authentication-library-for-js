/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";

export class SignInCompletedResult {
    constructor(
        public correlationId: string,
        public authenticationResult: AuthenticationResult,
    ) {}
}

class SignInContinuationTokenResult {
    constructor(
        public correlationId: string,
        public continuationToken: string,
    ) {}
}

export class SignInPasswordRequiredResult extends SignInContinuationTokenResult {}

export class SignInCodeSendResult extends SignInContinuationTokenResult {
    constructor(
        correlationId: string,
        continuationToken: string,
        public challengeChannel: string,
        public challengeTargetLabel: string,
        public codeLength: number,
        public bindingMethod: string,
    ) {
        super(correlationId, continuationToken);
    }
}
