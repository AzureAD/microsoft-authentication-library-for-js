/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../../../core/auth_flow/AuthFlowStateHandlerBase.js";
import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { SignInResult } from "../result/SignInResult.js";

/*
 * Sign-in continuation state handler.
 */
export class SignInContinuationStateHandler extends AuthFlowStateHandlerBase {
    /*
     * Constructor for SignInContinuationStateHandler.
     * @param correlationId - The correlation ID for the request.
     * @param continuationToken - The continuation token for the sign-in operation.
     * @param config - The configuration for the client.
     * @param username - The username for the sign-in operation.
     */
    constructor(
        correlationId: string,
        continuationToken: string,
        private config: CustomAuthConfiguration,
        private username: string
    ) {
        super(correlationId, continuationToken);

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }

        if (!config) {
            throw new InvalidArgumentError("config", correlationId);
        }

        if (!username) {
            throw new InvalidArgumentError("username", correlationId);
        }
    }

    /*
     * Initiates the sign-in flow with continuation token.
     * @param scopes - The scopes to request during sign-in.
     * @returns The result of the operation.
     */
    async signIn(scopes?: Array<string>): Promise<SignInResult> {
        throw new Error(`Method not implemented with parameter: ${scopes}`);
    }
}
