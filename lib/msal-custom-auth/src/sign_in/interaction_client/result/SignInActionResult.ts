/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAuthenticationResult } from "../../../core/interaction_client/CustomAuthAuthenticationResult.js";

export class SignInCompleteResult {
    constructor(
        public correlationId: string,
        public authenticationResult: CustomAuthAuthenticationResult
    ) {}
}

export class SignInContinuationTokenResult {
    constructor(
        public correlationId: string,
        public continuationToken: string,
        public challengeType: string
    ) {}
}

export class SignInCodeSendResult extends SignInContinuationTokenResult {
    constructor(
        correlationId: string,
        continuationToken: string,
        challengeType: string,
        public challengeChannel: string,
        public challengeTargetLabel: string,
        public codeLength: number
    ) {
        super(correlationId, continuationToken, challengeType);
    }
}
