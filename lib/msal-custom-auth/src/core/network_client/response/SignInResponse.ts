/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NativeAuthApiResponseBase } from "./NativeAuthApiResponseBase.js";

export class SignInContinuationTokenResponse extends NativeAuthApiResponseBase {
    constructor(
        correlationId?: string,
        public continuationToken?: string,
        public challengeType?: string
    ) {
        super(correlationId);
    }
}

export class SignInCodeSendResponse extends NativeAuthApiResponseBase {
    constructor(
        correlationId?: string,
        public continuationToken?: string,
        public challengeType?: string,
        public bindingMethod?: string,
        public challengeTargetLabel?: string,
        public challengeChannel?: string,
        public codeLength?: number,
        public interval?: number
    ) {
        super(correlationId);
    }
}

export class SignInTokenResponse extends NativeAuthApiResponseBase {
    constructor(
        correlationId?: string,
        public tokenType?: string,
        public scopes?: string,
        public expiresIn?: number,
        public idToken?: string,
        public accessToken?: string,
        public refreshToken?: string
    ) {
        super(correlationId);
    }
}
