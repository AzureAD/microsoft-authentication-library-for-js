/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAttribute } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

class SignInResultBase {
    constructor(
        public correlationId: string,
        public continuationToken: string,
    ) {}
}

export class SignInCompletedResult extends SignInResultBase {}

export class SignInPasswordRequiredResult extends SignInResultBase {}

export class SignInCodeRequiredResult extends SignInResultBase {
    constructor(
        correlationId: string,
        continuationToken: string,
        public challengeChannel: string,
        public challengeTargetLabel: string,
        public codeLength: number,
        public interval: number,
        public bindingMethod: string,
    ) {
        super(correlationId, continuationToken);
    }
}

export class SignInAttributesRequiredResult extends SignInResultBase {
    constructor(
        correlationId: string,
        continuationToken: string,
        public requiredAttributes: Array<UserAttribute>,
    ) {
        super(correlationId, continuationToken);
    }
}
