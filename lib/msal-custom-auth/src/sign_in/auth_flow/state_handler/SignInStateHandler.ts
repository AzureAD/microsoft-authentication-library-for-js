/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SigninClient } from "../../interaction_client/SignInClient.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../../../core/auth_flow/AuthFlowStateHandlerBase.js";
import { ArgumentValidator } from "../../../core/utils/ArgumentValidator.js";

/*
 * Base state handler for sign-in flow.
 */
export abstract class SignInStateHandler extends AuthFlowStateHandlerBase {
    /*
     * Constructor for SignInStateHandler.
     * @param signInClient - The client to use for sign-in operations.
     * @param correlationId - The correlation ID for the request.
     * @param continuationToken - The continuation token for the sign-in operation.
     * @param config - The configuration for the client.
     * @param scopes - The scopes to request during sign-in.
     */
    constructor(
        protected signInClient: SigninClient,
        correlationId: string,
        continuationToken: string,
        protected config: CustomAuthBrowserConfiguration,
        protected scopes?: Array<string>
    ) {
        super(correlationId, continuationToken);

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "continuationToken",
            continuationToken,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "config",
            config,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "signInClient",
            signInClient,
            correlationId
        );
    }
}
