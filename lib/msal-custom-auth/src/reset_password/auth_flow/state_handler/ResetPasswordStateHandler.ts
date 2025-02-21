/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../../../core/auth_flow/AuthFlowStateHandlerBase.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { ResetPasswordClient } from "../../interaction_client/ResetPasswordClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokeClient.js";

/*
 * Base state handler for reset password operation.
 */
export abstract class ResetPasswordStateHandler extends AuthFlowStateHandlerBase {
    /*
     * Creates a new state for reset password operation.
     * @param correlationId - The correlationId for the request.
     * @param continuationToken - The continuation token for the request.
     * @param config - The configuration for the request.
     * @param username - The username for the request.
     */
    constructor(
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        protected config: CustomAuthBrowserConfiguration,
        protected resetPasswordClient: ResetPasswordClient,
        protected signInClient: SignInClient,
        protected tokenClient: CustomAuthTokenClient,
        protected username: string,
    ) {
        super(correlationId, logger, continuationToken);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config, correlationId);
        ArgumentValidator.ensureArgumentIsNotEmptyString("username", username, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("resetPasswordClient", resetPasswordClient, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signInClient", signInClient, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("tokenClient", tokenClient, correlationId);
    }
}
