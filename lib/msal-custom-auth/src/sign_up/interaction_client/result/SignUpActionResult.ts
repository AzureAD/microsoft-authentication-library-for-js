/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAttribute } from "../../../core/network_client/types/UserAttributes.js";

class SignUpResultBase {
    constructor(
        public correlationId: string,
        public continuationToken: string,
    ) {}
}

export class SignUpCompletedResult extends SignUpResultBase {}

export class SignUpPasswordRequiredResult extends SignUpResultBase {}

export class SignUpCodeRequiredResult extends SignUpResultBase {
    constructor(
        correlationId: string,
        continuationToken: string,
        public challengeChannel: string,
        public challengeTargetLabel: string,
        public codeLength: number,
        public interval: number,
    ) {
        super(correlationId, continuationToken);
    }
}

export class SignUpAttributesRequiredResult extends SignUpResultBase {
    constructor(
        correlationId: string,
        continuationToken: string,
        public requiredAttributes: Array<UserAttribute>,
    ) {
        super(correlationId, continuationToken);
    }
}
