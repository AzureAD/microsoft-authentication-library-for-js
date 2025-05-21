/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ArgumentValidator } from "../utils/ArgumentValidator.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";
import { CustomAuthBrowserConfiguration } from "../../configuration/CustomAuthConfiguration.js";
import { Logger } from "@azure/msal-common/browser";

export interface AuthFlowActionRequiredStateParameters {
    correlationId: string;
    logger: Logger;
    config: CustomAuthBrowserConfiguration;
    continuationToken?: string;
}

/**
 * Base class for the state of an authentication flow.
 */
export abstract class AuthFlowStateBase {}

/**
 * Base class for the action requried state in an authentication flow.
 */
export abstract class AuthFlowActionRequiredStateBase<
    TParameter extends AuthFlowActionRequiredStateParameters
> extends AuthFlowStateBase {
    /**
     * Creates a new instance of AuthFlowActionRequiredStateBase.
     * @param stateParameters The parameters for the auth state.
     */
    protected constructor(protected readonly stateParameters: TParameter) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "logger",
            stateParameters.logger,
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            stateParameters.config,
            stateParameters.correlationId
        );

        super();
    }

    protected ensureCodeIsValid(code: string, codeLength: number): void {
        if (!code || code.length !== codeLength) {
            this.stateParameters.logger.error(
                "Code parameter is not provided or invalid for authentication flow.",
                this.stateParameters.correlationId
            );

            throw new InvalidArgumentError(
                "code",
                this.stateParameters.correlationId
            );
        }
    }

    protected ensurePasswordIsNotEmpty(password: string): void {
        if (!password) {
            this.stateParameters.logger.error(
                "Password parameter is not provided for authentication flow.",
                this.stateParameters.correlationId
            );

            throw new InvalidArgumentError(
                "password",
                this.stateParameters.correlationId
            );
        }
    }
}
