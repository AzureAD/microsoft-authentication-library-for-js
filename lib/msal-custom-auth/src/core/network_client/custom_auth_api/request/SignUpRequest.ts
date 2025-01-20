/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-browser";
import { CustomAuthApiRequestBase } from "./CustomAuthApiRequestBase.js";
import { ArgumentValidator } from "../../../utils/ArgumentValidator.js";
import {
    SignUpParamsBase,
    SignUpStartParams,
    SignUpSubmitCodeParams,
    SignUpSubmitPasswordParams,
    SignUpSubmitUserAttributesParams,
} from "../../../../sign_up/interaction_client/parameter/SignUpParams.js";
import { GrantType } from "../../../../CustomAuthConstants.js";

export class SignUpStartRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignUpStartRequestParameters,
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId,
        );
    }

    static create(
        signUpStartParams: SignUpStartParams,
        telemetryManager: ServerTelemetryManager,
    ): SignUpStartRequest {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpStartParams",
            signUpStartParams,
        );

        return new SignUpStartRequest(
            signUpStartParams.correlationId,
            telemetryManager,
            new SignUpStartRequestParameters(
                signUpStartParams.username,
                signUpStartParams.clientId,
                this.getChallengeTypes(signUpStartParams.challengeType),
                signUpStartParams.correlationId,
                signUpStartParams.password,
                signUpStartParams.attributes,
            ),
        );
    }
}

export class SignUpStartRequestParameters {
    constructor(
        public username: string,
        public clientId: string,
        public challengeType: string,
        correlationId: string,
        public password?: string,
        public attributes?: Record<string, string>,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            username,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "clientId",
            clientId,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "challengeType",
            challengeType,
            correlationId,
        );
    }
}

export class SignUpChallengeRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignUpChallengeRequestParameters,
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId,
        );
    }

    static create(
        signUpChallengeParams: SignUpParamsBase,
        continuationToken: string,
        telemetryManager: ServerTelemetryManager,
    ): SignUpChallengeRequest {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpChallengeParams",
            signUpChallengeParams,
        );

        return new SignUpChallengeRequest(
            signUpChallengeParams.correlationId,
            telemetryManager,
            new SignUpChallengeRequestParameters(
                signUpChallengeParams.clientId,
                this.getChallengeTypes(signUpChallengeParams.challengeType),
                continuationToken,
                signUpChallengeParams.correlationId,
            ),
        );
    }
}

export class SignUpChallengeRequestParameters {
    constructor(
        public clientId: string,
        public challengeType: string,
        public continuationToken: string,
        correlationId: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "clientId",
            clientId,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "challengeType",
            challengeType,
            correlationId,
        );
    }
}

export class SignUpSubmitCodeRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignUpSubmitCodeRequestParameters,
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId,
        );
    }

    static create(
        signUpSubmitCodeParams: SignUpSubmitCodeParams,
        telemetryManager: ServerTelemetryManager,
    ): SignUpSubmitCodeRequest {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpSubmitCodeParams",
            signUpSubmitCodeParams,
        );

        return new SignUpSubmitCodeRequest(
            signUpSubmitCodeParams.correlationId,
            telemetryManager,
            new SignUpSubmitCodeRequestParameters(
                signUpSubmitCodeParams.clientId,
                signUpSubmitCodeParams.continuationToken,
                GrantType.OOB,
                signUpSubmitCodeParams.correlationId,
                signUpSubmitCodeParams.code,
            ),
        );
    }
}

export class SignUpSubmitPasswordRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignUpSubmitPasswordRequestParameters,
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId,
        );
    }

    static create(
        signUpSubmitPasswordParams: SignUpSubmitPasswordParams,
        telemetryManager: ServerTelemetryManager,
    ): SignUpSubmitPasswordRequest {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpSubmitPasswordParams",
            signUpSubmitPasswordParams,
        );

        return new SignUpSubmitPasswordRequest(
            signUpSubmitPasswordParams.correlationId,
            telemetryManager,
            new SignUpSubmitPasswordRequestParameters(
                signUpSubmitPasswordParams.clientId,
                signUpSubmitPasswordParams.continuationToken,
                GrantType.PASSWORD,
                signUpSubmitPasswordParams.correlationId,
                signUpSubmitPasswordParams.password,
            ),
        );
    }
}

export class SignUpSubmitUserAttributesRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignUpSubmitUserAttributesRequestParameters,
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId,
        );
    }

    static create(
        signUpSubmitUserAttributesParams: SignUpSubmitUserAttributesParams,
        telemetryManager: ServerTelemetryManager,
    ): SignUpSubmitUserAttributesRequest {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpSubmitUserAttributesParams",
            signUpSubmitUserAttributesParams,
        );

        return new SignUpSubmitUserAttributesRequest(
            signUpSubmitUserAttributesParams.correlationId,
            telemetryManager,
            new SignUpSubmitUserAttributesRequestParameters(
                signUpSubmitUserAttributesParams.clientId,
                signUpSubmitUserAttributesParams.continuationToken,
                GrantType.ATTRIBUTES,
                signUpSubmitUserAttributesParams.correlationId,
                signUpSubmitUserAttributesParams.attributes,
            ),
        );
    }
}

export class SignUpContinueRequestParametersBase {
    constructor(
        public clientId: string,
        public continuationToken: string,
        public grantType: string,
        correlationId: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "clientId",
            clientId,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "grantType",
            grantType,
            correlationId,
        );
    }
}

export class SignUpSubmitCodeRequestParameters extends SignUpContinueRequestParametersBase {
    constructor(
        clientId: string,
        continuationToken: string,
        grantType: string,
        correlationId: string,
        public code: string,
    ) {
        super(clientId, continuationToken, grantType, correlationId);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "code",
            code,
            correlationId,
        );
    }
}

export class SignUpSubmitPasswordRequestParameters extends SignUpContinueRequestParametersBase {
    constructor(
        clientId: string,
        continuationToken: string,
        grantType: string,
        correlationId: string,
        public password: string,
    ) {
        super(clientId, continuationToken, grantType, correlationId);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "password",
            password,
            correlationId,
        );
    }
}

export class SignUpSubmitUserAttributesRequestParameters extends SignUpContinueRequestParametersBase {
    constructor(
        clientId: string,
        continuationToken: string,
        grantType: string,
        correlationId: string,
        public attributes: Record<string, string>,
    ) {
        super(clientId, continuationToken, grantType, correlationId);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "attributes",
            attributes,
            correlationId,
        );
    }
}
