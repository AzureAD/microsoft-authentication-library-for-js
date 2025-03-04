/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { ArgumentValidator } from "../utils/ArgumentValidator.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

/**
 * Base class for handling the state of an authentication flow.
 */
export abstract class AuthFlowStateHandlerBase {
    /**
     * Creates a new instance of AuthFlowStateHandlerBase.
     * @param correlationId The correlation ID for the authentication flow.
     * @param logger The logger for the authentication flow.
     * @param continuationToken The continuation token for the authentication flow.
     */
    protected constructor(
        protected correlationId: string,
        protected logger: Logger,
        protected continuationToken?: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("logger", logger, correlationId);
    }

    protected ensureCodeIsValid(code: string, codeLength: number): void {
        if (!code || code.length !== codeLength) {
            this.logger.error("Code parameter is not provided or invalid for authentication flow.", this.correlationId);

            throw new InvalidArgumentError("code", this.correlationId);
        }
    }

    protected ensurePasswordIsNotEmpty(password: string): void {
        if (!password) {
            this.logger.error("Password parameter is not provided for authentication flow.", this.correlationId);

            throw new InvalidArgumentError("password", this.correlationId);
        }
    }
}
