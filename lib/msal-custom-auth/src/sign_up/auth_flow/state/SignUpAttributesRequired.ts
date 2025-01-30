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
import { UserAttribute } from "../../../core/network_client/custom_auth_api/response/UserAttribute.js";

export class SignUpAttributesRequired extends SignUpActionRequiredState {
    constructor(
        correlationId: string,
        continuationToken: string,
        logger: Logger,
        config: CustomAuthBrowserConfiguration,
        signInClient: SignInClient,
        signUpClient: SignUpClient,
        username: string,
        public requiredAttributes: Array<UserAttribute>,
    ) {
        super(
            SignUpState.AttributesRequired,
            correlationId,
            continuationToken,
            logger,
            config,
            signInClient,
            signUpClient,
            username,
        );
    }
}
