/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInStartParams } from "../../../../sign_in/interaction_client/parameter/SignInParams.js";
import { GrantType } from "../../../../CustomAuthConstants.js";
import { CustomAuthApiRequestBase } from "./CustomAuthApiRequestBase.js";
import { ServerTelemetryManager } from "@azure/msal-browser";
import { ArgumentValidator } from "../../../utils/ArgumentValidator.js";

export class SignInInitiateRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignInInitiateRequestParameters
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId
        );
    }

    static create(
        signInStartParams: SignInStartParams,
        telemetryManager: ServerTelemetryManager
    ): SignInInitiateRequest {
        return new SignInInitiateRequest(
            signInStartParams.correlationId,
            telemetryManager,
            new SignInInitiateRequestParameters(
                signInStartParams.username,
                signInStartParams.clientId,
                signInStartParams.challengeType.join(" "),
                signInStartParams.correlationId
            )
        );
    }
}

export class SignInInitiateRequestParameters {
    constructor(
        public username: string,
        public clientId: string,
        public challengeType: string,
        correlationId: string
    ) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "correlationId",
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "username",
            username,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "clientId",
            clientId,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "challengeType",
            challengeType,
            correlationId
        );
    }
}

export class SignInChallengeRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignInChallengeRequestParameters
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId
        );
    }

    static create(
        signInStartParams: SignInStartParams,
        continuationToken: string,
        telemetryManager: ServerTelemetryManager
    ): SignInChallengeRequest {
        return new SignInChallengeRequest(
            signInStartParams.correlationId,
            telemetryManager,
            new SignInChallengeRequestParameters(
                signInStartParams.clientId,
                signInStartParams.challengeType.join(" "),
                continuationToken,
                signInStartParams.correlationId
            )
        );
    }
}

export class SignInChallengeRequestParameters {
    /*
     * In the current Android implmenetation, it has a parameter named 'id', but this parameter cannot be found In the Native Auth API document.
     * Double check whether the parameter 'id' is required.
     */
    constructor(
        public clientId: string,
        public challengeType: string,
        public continuationToken: string,
        correlationId: string
    ) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "correlationId",
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "continuationToken",
            continuationToken,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "clientId",
            clientId,
            correlationId
        );
    }
}

export class SignInOobTokenRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignInOobTokenRequestParameters
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId
        );
    }
}

export class SignInPasswordTokenRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignInPasswordTokenRequestParameters
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId
        );
    }
}

export class SignInContinuationTokenRequest extends CustomAuthApiRequestBase {
    constructor(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        public parameters: SignInContinuationTokenRequestParameters
    ) {
        super(correlationId, telemetryManager);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
            correlationId
        );
    }
}

abstract class SignInTokenRequestBase {
    constructor(
        public clientId: string,
        public continuationToken: string,
        public grantType: string,
        correlationId: string,
        public scopes?: Array<string>,
        public challengeType?: string
    ) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "correlationId",
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "grantType",
            grantType,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "clientId",
            clientId,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "continuationToken",
            continuationToken,
            correlationId
        );
    }
}

export class SignInOobTokenRequestParameters extends SignInTokenRequestBase {
    constructor(
        clientId: string,
        continuationToken: string,
        correlationId: string,
        public oob: string,
        challengeType?: string,
        scopes?: Array<string>
    ) {
        super(
            clientId,
            continuationToken,
            GrantType.OOB,
            correlationId,
            scopes,
            challengeType
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "oob",
            oob,
            correlationId
        );
    }
}

export class SignInPasswordTokenRequestParameters extends SignInTokenRequestBase {
    constructor(
        clientId: string,
        continuationToken: string,
        correlationId: string,
        public password: string,
        challengeType?: string,
        scopes?: Array<string>
    ) {
        super(
            clientId,
            continuationToken,
            GrantType.PASSWORD,
            correlationId,
            scopes,
            challengeType
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "password",
            password,
            correlationId
        );
    }
}

export class SignInContinuationTokenRequestParameters extends SignInTokenRequestBase {
    constructor(
        clientId: string,
        continuationToken: string,
        correlationId: string,
        public username: string,
        challengeType?: string,
        scopes?: Array<string>
    ) {
        super(
            clientId,
            continuationToken,
            GrantType.CONTINUATION_TOKEN,
            correlationId,
            scopes,
            challengeType
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "username",
            username,
            correlationId
        );
    }
}
