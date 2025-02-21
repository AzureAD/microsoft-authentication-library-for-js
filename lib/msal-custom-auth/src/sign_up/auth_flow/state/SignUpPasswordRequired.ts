/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { SignUpState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { SignUpActionRequiredState } from "./SignUpActionRequiredState.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignUpClient } from "../../interaction_client/SignUpClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokeClient.js";

export class SignUpPasswordRequired extends SignUpActionRequiredState {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        signInClient: SignInClient,
        signUpClient: SignUpClient,
        tokenClient: CustomAuthTokenClient,
        username: string,
    ) {
        super(
            SignUpState.PasswordRequired,
            correlationId,
            continuationToken,
            logger,
            config,
            signInClient,
            signUpClient,
            tokenClient,
            username,
        );
    }
}
