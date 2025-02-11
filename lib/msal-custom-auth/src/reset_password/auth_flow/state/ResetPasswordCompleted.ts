/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { AuthFlowStateBase, ResetPasswordState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";

export class ResetPasswordCompleted extends AuthFlowStateBase {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        public signInClient: SignInClient,
        public username: string,
    ) {
        super(ResetPasswordState.Completed, correlationId, continuationToken, logger, config);
    }
}
