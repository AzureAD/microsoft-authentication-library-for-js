/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { AuthFlowStateBase, ResetPasswordState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";

export abstract class ResetPasswordActionRequiredState extends AuthFlowStateBase {
    constructor(
        type: ResetPasswordState,
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        public username: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", correlationId);
        ArgumentValidator.ensureArgumentIsNotEmptyString("continuationToken", continuationToken);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("logger", logger);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config);
        ArgumentValidator.ensureArgumentIsNotEmptyString("username", username);

        super(type, correlationId, continuationToken, logger, config);
    }
}
