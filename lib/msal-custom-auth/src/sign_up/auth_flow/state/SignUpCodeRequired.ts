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
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

export class SignUpCodeRequired extends SignUpActionRequiredState {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        signInClient: SignInClient,
        signUpClient: SignUpClient,
        cacheClient: CustomAuthSilentCacheClient,
        username: string,
        public codeLength: number,
        public codeResendInterval: number,
    ) {
        super(
            SignUpState.CodeRequired,
            correlationId,
            continuationToken,
            logger,
            config,
            signInClient,
            signUpClient,
            cacheClient,
            username,
        );
    }
}
