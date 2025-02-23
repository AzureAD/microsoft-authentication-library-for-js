/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { ResetPasswordActionRequiredState } from "./ResetPasswordActionRequiredState.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { ResetPasswordClient } from "../../interaction_client/ResetPasswordClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokenClient.js";

export class ResetPasswordCodeRequired extends ResetPasswordActionRequiredState {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        resetPasswordClient: ResetPasswordClient,
        signInClient: SignInClient,
        tokenClient: CustomAuthTokenClient,
        username: string,
        public codeLength: number,
    ) {
        super(
            ResetPasswordState.CodeRequired,
            correlationId,
            continuationToken,
            logger,
            config,
            resetPasswordClient,
            signInClient,
            tokenClient,
            username,
        );
    }
}
