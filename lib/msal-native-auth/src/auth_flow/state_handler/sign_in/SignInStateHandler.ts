/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { SigninClient } from "../../../interaction_client/SignInClient.js";
import { NativeAuthConfiguration } from "../../../NativeAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../AuthFlowStateHandlerBase.js";

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
        protected config: NativeAuthConfiguration,
        protected scopes?: Array<string>
    ) {
        super(correlationId, continuationToken);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }

        if (!config) {
            throw new InvalidArgumentError("config", correlationId);
        }

        if (!signInClient) {
            throw new InvalidArgumentError("signInClient", correlationId);
        }
    }
}
