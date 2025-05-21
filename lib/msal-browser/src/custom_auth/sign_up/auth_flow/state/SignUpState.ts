/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { AuthFlowActionRequiredStateBase } from "../../../core/auth_flow/AuthFlowState.js";
import { SignUpStateParameters } from "./SignUpStateParameters.js";

/*
 * Base state handler for sign-up flow.
 */
export abstract class SignUpState<
    TParameters extends SignUpStateParameters
> extends AuthFlowActionRequiredStateBase<TParameters> {
    /*
     * Creates a new SignUpState.
     * @param stateParameters - The state parameters for sign-up.
     */
    constructor(stateParameters: TParameters) {
        super(stateParameters);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            stateParameters.config,
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            stateParameters.username,
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpClient",
            stateParameters.signUpClient,
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            stateParameters.continuationToken,
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signInClient",
            stateParameters.signInClient,
            stateParameters.correlationId
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "cacheClient",
            stateParameters.cacheClient,
            stateParameters.correlationId
        );
    }
}
