/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAttribute } from "../network_client/response/UserAttribute.js";
import { InvalidArgumentError } from "./InvalidArgumentError.js";
import { CustomAuthError } from "./CustomAuthError.js";

/**
 * Error when no required authentication method by Microsoft Entra is supported
 */
export class RedirectError extends CustomAuthError {
    constructor(correlationId?: string) {
        super(
            "redirect",
            "No required authentication method by Microsoft Entra is supported, a fallback to the web-based authentication flow is needed.",
            correlationId
        );
        Object.setPrototypeOf(this, RedirectError.prototype);
    }
}

export class CustomAuthApiError extends CustomAuthError {
    constructor(
        error: string,
        errorDescription: string,
        correlationId: string,
        public errorCodes: Array<string>,
        public subError?: string
    ) {
        super(error, errorDescription, correlationId);
        Object.setPrototypeOf(this, CustomAuthApiError.prototype);

        this.errorCodes = errorCodes;
        this.subError = subError;
    }
}

export class UserNotFoundError extends CustomAuthApiError {}

export class InvalidCredentialsError extends CustomAuthApiError {}

export class IncorrectCodeError extends CustomAuthApiError {}

export class InvalidUserError extends CustomAuthApiError {}

export class UserAlreadyExistsError extends CustomAuthApiError {}

export class AttributeRequiredError extends CustomAuthApiError {
    constructor(
        error: string,
        errorDescription: string,
        correlationId: string,
        errorCodes: Array<string>,
        public requiredAttributes: Array<UserAttribute>,
        public continuationToken: string,
        subError?: string
    ) {
        super(error, errorDescription, correlationId, errorCodes, subError);
        Object.setPrototypeOf(this, AttributeRequiredError.prototype);

        if (!requiredAttributes) {
            throw new InvalidArgumentError("requiredAttributes", correlationId);
        }

        if (!continuationToken) {
            throw new InvalidArgumentError("continuationToken", correlationId);
        }
    }
}

export class InvalidPasswordError extends CustomAuthApiError {}

export class InvalidCodeError extends CustomAuthApiError {}

export class InvalidAttributesError extends CustomAuthApiError {
    constructor(
        error: string,
        errorDescription: string,
        correlationId: string,
        errorCodes: Array<string>,
        public invalidAttributes: Array<string>,
        subError?: string
    ) {
        super(error, errorDescription, correlationId, errorCodes, subError);
        Object.setPrototypeOf(this, InvalidAttributesError.prototype);

        if (!invalidAttributes) {
            throw new InvalidArgumentError("invalidAttributes", correlationId);
        }
    }
}

export class PasswordNotSetError extends CustomAuthApiError {}

export class EmailNotVerifiedError extends CustomAuthApiError {}

export class PasswordNotAcceptedError extends CustomAuthApiError {}

export class PasswordResetFailedError extends CustomAuthApiError {}

export class UnknownApiError extends CustomAuthApiError {}
