/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../core/auth_flow/AuthFlowState.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { ResetPasswordStateParameters } from "./ResetPasswordStateParameters.js";

/*
 * Base state handler for reset password operation.
 */
export abstract class ResetPasswordState<
    TParameters extends ResetPasswordStateParameters,
> extends AuthFlowActionRequiredStateBase<TParameters> {
    /*
     * Creates a new state for reset password operation.
     * @param stateParameters - The state parameters for reset-password.
     */
    constructor(stateParameters: TParameters) {
        super(stateParameters);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            this.stateParameters.config,
            this.stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            this.stateParameters.username,
            this.stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "resetPasswordClient",
            this.stateParameters.resetPasswordClient,
            this.stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signInClient",
            this.stateParameters.signInClient,
            this.stateParameters.correlationId,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "cacheClient",
            this.stateParameters.cacheClient,
            this.stateParameters.correlationId,
        );
    }
}
