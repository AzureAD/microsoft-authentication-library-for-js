/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ArgumentValidator } from "../utils/ArgumentValidator.js";

export abstract class AuthActionResultBase {
    protected constructor(public correlationId: string) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId
        );
    }
}

export abstract class ContinuationTokenResult extends AuthActionResultBase {
    constructor(
        public continuationToken: string,
        correlationId: string,
        public challengeType?: string,
    ) {
        super(correlationId);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId
        );
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
