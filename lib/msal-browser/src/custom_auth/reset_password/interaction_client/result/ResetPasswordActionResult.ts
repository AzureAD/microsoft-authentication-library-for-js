/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

class ResetPasswordResultBase {
    constructor(
        public correlationId: string,
        public continuationToken: string,
    ) {}
}

export class ResetPasswordCodeRequiredResult extends ResetPasswordResultBase {
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

export class ResetPasswordPasswordRequiredResult extends ResetPasswordResultBase {}

export class ResetPasswordCompletedResult extends ResetPasswordResultBase {}
