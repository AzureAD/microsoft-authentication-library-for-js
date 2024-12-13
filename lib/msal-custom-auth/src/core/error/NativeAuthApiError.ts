/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAttribute } from "../network_client/response/UserAttribute.js";
import { InvalidArgumentError } from "./InvalidArgumentError.js";
import { NativeAuthError } from "./NativeAuthError.js";

/**
 * Error when no required authentication method by Microsoft Entra is supported
 */
export class RedirectError extends NativeAuthError {
    constructor(correlationId?: string) {
        super(
            "redirect",
            "No required authentication method by Microsoft Entra is supported, a fallback to the web-based authentication flow is needed.",
            correlationId
        );
        Object.setPrototypeOf(this, RedirectError.prototype);
    }
}

export class NativeAuthApiError extends NativeAuthError {
    constructor(
        error: string,
        errorDescription: string,
        correlationId: string,
        public errorCodes: Array<string>,
        public subError?: string
    ) {
        super(error, errorDescription, correlationId);
        Object.setPrototypeOf(this, NativeAuthApiError.prototype);

        this.errorCodes = errorCodes;
        this.subError = subError;
    }
}

export class UserNotFoundError extends NativeAuthApiError {}

export class InvalidCredentialsError extends NativeAuthApiError {}

export class IncorrectCodeError extends NativeAuthApiError {}

export class InvalidUserError extends NativeAuthApiError {}

export class UserAlreadyExistsError extends NativeAuthApiError {}

export class AttributeRequiredError extends NativeAuthApiError {
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

export class InvalidPasswordError extends NativeAuthApiError {}

export class InvalidCodeError extends NativeAuthApiError {}

export class InvalidAttributesError extends NativeAuthApiError {
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

export class PasswordNotSetError extends NativeAuthApiError {}

export class EmailNotVerifiedError extends NativeAuthApiError {}

export class PasswordNotAcceptedError extends NativeAuthApiError {}

export class PasswordResetFailedError extends NativeAuthApiError {}

export class UnknownApiError extends NativeAuthApiError {}
