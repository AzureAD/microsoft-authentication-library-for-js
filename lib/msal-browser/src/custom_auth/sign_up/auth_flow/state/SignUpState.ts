/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../core/auth_flow/AuthFlowState.js";
import {
    ensureArgumentIsNotEmptyString,
    ensureArgumentIsNotNullOrUndefined,
} from "../../../core/utils/ArgumentValidator.js";
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

        ensureArgumentIsNotNullOrUndefined(
            "config",
            stateParameters.config,
            stateParameters.correlationId
        );
        ensureArgumentIsNotEmptyString(
            "username",
            stateParameters.username,
            stateParameters.correlationId
        );
        ensureArgumentIsNotNullOrUndefined(
            "signUpClient",
            stateParameters.signUpClient,
            stateParameters.correlationId
        );
        ensureArgumentIsNotEmptyString(
            "continuationToken",
            stateParameters.continuationToken,
            stateParameters.correlationId
        );
        ensureArgumentIsNotNullOrUndefined(
            "signInClient",
            stateParameters.signInClient,
            stateParameters.correlationId
        );
        ensureArgumentIsNotNullOrUndefined(
            "cacheClient",
            stateParameters.cacheClient,
            stateParameters.correlationId
        );
    }
}
