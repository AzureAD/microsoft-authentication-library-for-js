/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { ResetPasswordActionRequiredState } from "./ResetPasswordActionRequiredState.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";

export class ResetPasswordPasswordRequired extends ResetPasswordActionRequiredState {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        username: string,
    ) {
        super(ResetPasswordState.PasswordRequired, correlationId, continuationToken, logger, config, username);
    }
}
