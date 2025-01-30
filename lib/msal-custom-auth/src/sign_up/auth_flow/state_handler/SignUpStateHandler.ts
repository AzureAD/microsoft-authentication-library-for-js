/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../../../core/auth_flow/AuthFlowStateHandlerBase.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { SignUpClient } from "../../interaction_client/SignUpClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";

/*
 * Base state handler for sign-up flow.
 */
export abstract class SignUpStateHandler extends AuthFlowStateHandlerBase {
    /*
     * Creates a new SignUpStateHandler.
     * @param username - The username for the request.
     * @param signUpClient - The client for the sign up operation.
     * @param signInClient - The client for the sign-in operation.
     * @param correlationId - The correlation ID for the request.
     * @param logger - The logger for the request.
     * @param continuationToken - The continuation token for the request.
     * @param config - The configuration for the request.
     */
    constructor(
        protected username: string,
        protected signUpClient: SignUpClient,
        protected signInClient: SignInClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        protected config: CustomAuthBrowserConfiguration,
    ) {
        super(correlationId, logger, continuationToken);

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            config,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "username",
            username,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signUpClient",
            signUpClient,
            correlationId,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId,
        );
    }
}
