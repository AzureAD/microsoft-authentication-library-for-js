/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { AuthFlowActionRequiredStateBase } from "../../../core/auth_flow/AuthFlowState.js";
import { SignInStateParameters } from "./SignInStateParameters.js";

/*
 * Base state handler for sign-in flow.
 */
export abstract class SignInState<
    TParameters extends SignInStateParameters,
> extends AuthFlowActionRequiredStateBase<TParameters> {
    /*
     * Creates a new SignInState.
     * @param stateParameters - The state parameters for sign-in.
     */
    constructor(stateParameters: TParameters) {
        super(stateParameters);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            stateParameters.username,
            stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            stateParameters.continuationToken,
            stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            stateParameters.config,
            stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signInClient",
            stateParameters.signInClient,
            stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "cacheClient",
            stateParameters.cacheClient,
            stateParameters.correlationId,
        );
    }
}
