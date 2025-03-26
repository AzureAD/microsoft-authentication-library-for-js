/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { ArgumentValidator } from "../utils/ArgumentValidator.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";
import { AuthFlowStateType } from "./AuthFlowStateType.js";
import { CustomAuthBrowserConfiguration } from "../../configuration/CustomAuthConfiguration.js";

export interface AuthFlowActionRequiredStateParameters {
    correlationId: string;
    logger: Logger;
    config: CustomAuthBrowserConfiguration;
    continuationToken?: string;
}

/**
 * Base class for the state of an authentication flow.
 */
export abstract class AuthFlowStateBase {
    /**
     * Creates a new instance of AuthFlowStateHandlerBase.
     * @param type The state type of the authentication flow.
     */
    protected constructor(public readonly type: AuthFlowStateType) {}
}

/**
 * Base class for the action requried state in an authentication flow.
 */
export abstract class AuthFlowActionRequiredStateBase<
    TParameter extends AuthFlowActionRequiredStateParameters,
> extends AuthFlowStateBase {
    /**
     * Creates a new instance of AuthFlowStateHandlerBase.
     * @param type The state type of the authentication flow.
     * @param correlationId The correlation ID for the authentication flow.
     * @param logger The logger for the authentication flow.
     * @param continuationToken The continuation token for the authentication flow.
     */
    protected constructor(
        type: AuthFlowStateType,
        protected readonly stateParameters: TParameter,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", stateParameters.correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "logger",
            stateParameters.logger,
            stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            stateParameters.config,
            stateParameters.correlationId,
        );

        super(type);
    }

    protected ensureCodeIsValid(code: string, codeLength: number): void {
        if (!code || code.length !== codeLength) {
            this.stateParameters.logger.error(
                "Code parameter is not provided or invalid for authentication flow.",
                this.stateParameters.correlationId,
            );

            throw new InvalidArgumentError("code", this.stateParameters.correlationId);
        }
    }

    protected ensurePasswordIsNotEmpty(password: string): void {
        if (!password) {
            this.stateParameters.logger.error(
                "Password parameter is not provided for authentication flow.",
                this.stateParameters.correlationId,
            );

            throw new InvalidArgumentError("password", this.stateParameters.correlationId);
        }
    }
}

/**
 * Class representing the completed state of an authentication flow.
 */
export abstract class AuthFlowCompletedState extends AuthFlowStateBase {
    constructor() {
        super(AuthFlowStateType.Completed);
    }
}

/**
 * Class representing the failed state of an authentication flow.
 */
export abstract class AuthFlowFailedState extends AuthFlowStateBase {
    constructor() {
        super(AuthFlowStateType.Failed);
    }
}
