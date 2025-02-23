/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { AuthFlowStateBase, SignInState } from "../../../core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokenClient.js";

export abstract class SignInActionRequiredState extends AuthFlowStateBase {
    constructor(
        type: SignInState,
        public correlationId: string,
        public continuationToken: string,
        public logger: Logger,
        public config: CustomAuthBrowserConfiguration,
        public signInClient: SignInClient,
        public tokenClient: CustomAuthTokenClient,
        public username: string,
        public scope?: Array<string>,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", correlationId);
        ArgumentValidator.ensureArgumentIsNotEmptyString("continuationToken", continuationToken);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("logger", logger);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signInClient", signInClient);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("tokenClient", tokenClient);
        ArgumentValidator.ensureArgumentIsNotEmptyString("username", username);

        super(type);
    }
}
