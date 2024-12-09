/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { NativeAuthConfiguration } from "../../../NativeAuthConfiguration.js";
import { AuthFlowStateHandlerBase } from "../AuthFlowStateHandlerBase.js";

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
        continuationToken: string,
        protected config: NativeAuthConfiguration,
        protected username: string
    ) {
        super(correlationId, continuationToken);

        if (!config) {
            throw new InvalidArgumentError("config", correlationId);
        }

        if (!username) {
            throw new InvalidArgumentError("username", correlationId);
        }
    }
}
