/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientActionParamsBase } from "../../../core/interaction_client/ClientActionParams.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";

abstract class SignInParamsBase extends ClientActionParamsBase {
    constructor(
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        public scopes: Array<string>,
    ) {
        super(clientId, correlationId, challengeType);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "scopes",
            scopes,
            correlationId
        );
    }
}

export class SignInResendCodeParams extends SignInParamsBase {
    constructor(
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
    ) {
        super(clientId, correlationId, challengeType, scopes);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId
        );
    }
}

export class SignInStartParams extends SignInParamsBase {
    constructor(
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public username: string,
        public password?: string,
    ) {
        super(clientId, correlationId, challengeType, scopes);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            username,
            correlationId
        );
    }
}

export class SignInSubmitCodeParams extends SignInParamsBase {
    constructor(
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
        public code: string,
    ) {
        super(clientId, correlationId, challengeType, scopes);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "code",
            code,
            correlationId
        );
    }
}

export class SignInSubmitPasswordParams extends SignInParamsBase {
    constructor(
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
        public password: string,
    ) {
        super(clientId, correlationId, challengeType, scopes);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "password",
            password,
            correlationId
        );
    }
}

export class SignInContinuationTokenParams extends SignInParamsBase {
    constructor(
        clientId: string,
        correlationId: string,
        challengeType: Array<string>,
        scopes: Array<string>,
        public continuationToken: string,
        public username: string,
    ) {
        super(clientId, correlationId, challengeType, scopes);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            username,
            correlationId
        );
    }
}
