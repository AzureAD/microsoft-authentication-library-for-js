/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { AuthFlowStateBase, ResetPasswordState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

export class ResetPasswordCompleted extends AuthFlowStateBase {
    constructor(
        public correlationId: string,
        public continuationToken: string,
        public logger: Logger,
        public config: CustomAuthBrowserConfiguration,
        public signInClient: SignInClient,
        public cacheClient: CustomAuthSilentCacheClient,
        public username: string,
    ) {
        super(ResetPasswordState.Completed);
    }
}
