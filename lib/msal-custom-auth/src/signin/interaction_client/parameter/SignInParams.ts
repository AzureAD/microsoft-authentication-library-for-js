/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { ClientActionParamsBase } from "../../../core/interaction_client/ClientActionParams.js";

abstract class SignInParamsBase extends ClientActionParamsBase {
    constructor(
        authorityUrl: string,
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        public scopes: Array<string>
    ) {
        super(authorityUrl, clientId, correlationId, challengeType);

        if (!scopes) {
            throw new InvalidArgumentError("scopes");
        }
    }
}

export class SignInResendCodeParams extends SignInParamsBase {
    constructor(
        authorityUrl: string,
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string
    ) {
        super(authorityUrl, clientId, correlationId, challengeType, scopes);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }
    }
}

export class SignInStartParams extends SignInParamsBase {
    constructor(
        authorityUrl: string,
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public username: string,
        public password?: string
    ) {
        super(authorityUrl, clientId, correlationId, challengeType, scopes);

        if (!username) {
            throw new InvalidArgumentError("username", correlationId);
        }
    }
}

export class SignInSubmitCodeParams extends SignInParamsBase {
    constructor(
        authorityUrl: string,
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
        public code: string
    ) {
        super(authorityUrl, clientId, correlationId, challengeType, scopes);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }

        if (!code) {
            throw new InvalidArgumentError("code", correlationId);
        }
    }
}

export class SignInSubmitPasswordParams extends SignInParamsBase {
    constructor(
        authorityUrl: string,
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
        public password: string
    ) {
        super(authorityUrl, clientId, correlationId, challengeType, scopes);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }

        if (!password) {
            throw new InvalidArgumentError("password", correlationId);
        }
    }
}

export class SignInContinuationTokenParams extends SignInParamsBase {
    constructor(
        authorityUrl: string,
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
        public username: string
    ) {
        super(authorityUrl, clientId, correlationId, challengeType, scopes);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }

        if (!username) {
            throw new InvalidArgumentError("username", correlationId);
        }
    }
}
