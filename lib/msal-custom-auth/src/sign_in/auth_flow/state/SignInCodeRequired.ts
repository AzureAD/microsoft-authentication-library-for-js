/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { SignInState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { SignInActionRequiredState } from "./SignInActionRequiredState.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokenClient.js";

export class SignInCodeRequired extends SignInActionRequiredState {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        signInClient: SignInClient,
        tokenClient: CustomAuthTokenClient,
        username: string,
        public codeLength: number,
        scope?: Array<string>,
    ) {
        super(
            SignInState.CodeRequired,
            correlationId,
            continuationToken,
            logger,
            config,
            signInClient,
            tokenClient,
            username,
            scope,
        );
    }
}
