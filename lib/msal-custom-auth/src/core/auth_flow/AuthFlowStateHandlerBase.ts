/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

/**
 * Base class for handling the state of an authentication flow.
 */
export abstract class AuthFlowStateHandlerBase {
    /**
     * Creates a new instance of AuthFlowStateHandlerBase.
     * @param correlationId The correlation ID for the authentication flow.
     * @param continuationToken The continuation token for the authentication flow.
     */
    protected constructor(
        protected correlationId: string,
        protected continuationToken?: string
    ) {
        if (!correlationId) {
            throw new InvalidArgumentError("correlationId");
        }
    }
}
