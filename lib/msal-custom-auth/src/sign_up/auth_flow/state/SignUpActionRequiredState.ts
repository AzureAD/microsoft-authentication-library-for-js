/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { AuthFlowStateBase, SignUpState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { SignUpClient } from "../../interaction_client/SignUpClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

export abstract class SignUpActionRequiredState extends AuthFlowStateBase {
    constructor(
        type: SignUpState,
        public correlationId: string,
        public continuationToken: string,
        public logger: Logger,
        public config: CustomAuthBrowserConfiguration,
        public signInClient: SignInClient,
        public signUpClient: SignUpClient,
        public cacheClient: CustomAuthSilentCacheClient,
        public username: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", correlationId);
        ArgumentValidator.ensureArgumentIsNotEmptyString("continuationToken", continuationToken);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("logger", logger);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signInClient", signInClient);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signUpClient", signUpClient);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("cacheClient", cacheClient);
        ArgumentValidator.ensureArgumentIsNotEmptyString("username", username);

        super(type);
    }
}
