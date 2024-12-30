/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

export abstract class AuthActionResultBase {
    protected constructor(public correlationId: string) {
        if (!correlationId) {
            throw new InvalidArgumentError("correlationId");
        }
    }
}

export abstract class ContinuationTokenResult extends AuthActionResultBase {
    constructor(
        public continuationToken: string,
        correlationId: string,
        public challengeType?: string,
    ) {
        super(correlationId);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }
    }
}

export abstract class CodeSendResult extends ContinuationTokenResult {
    constructor(
        continuationToken: string,
        public challengeType: string,
        public challengeChannel: string,
        public challengeTargetLabel: string,
        public codeLength: number,
        correlationId: string,
    ) {
        super(continuationToken, correlationId);

        // No validation for these fields as they are not required
    }
}
