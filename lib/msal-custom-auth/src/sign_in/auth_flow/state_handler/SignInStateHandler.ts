/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInClient } from "../../interaction_client/SignInClient.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../../../core/auth_flow/AuthFlowStateHandlerBase.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";
import { Logger } from "@azure/msal-browser";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

/*
 * Base state handler for sign-in flow.
 */
export abstract class SignInStateHandler extends AuthFlowStateHandlerBase {
    /*
     * Constructor for SignInStateHandler.
     * @param username - The username to use for sign-in operations.
     * @param signInClient - The client to use for sign-in operations.
     * @param correlationId - The correlation ID for the request.
     * @param continuationToken - The continuation token for the sign-in operation.
     * @param config - The configuration for the client.
     * @param scopes - The scopes to request during sign-in.
     */
    constructor(
        protected username: string,
        protected signInClient: SignInClient,
        protected cacheClient: CustomAuthSilentCacheClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        protected config: CustomAuthBrowserConfiguration,
    ) {
        super(correlationId, logger, continuationToken);

        ArgumentValidator.ensureArgumentIsNotEmptyString("username", username, correlationId);
        ArgumentValidator.ensureArgumentIsNotEmptyString("continuationToken", continuationToken, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signInClient", signInClient, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("cacheClient", cacheClient, correlationId);
    }
}
