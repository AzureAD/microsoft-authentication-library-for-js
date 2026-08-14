/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised by the first call of the native auth V2 sign-in flow
 * (`signInV2`).
 */
export class SignInStartError extends AuthFlowErrorV2Base {
    /**
     * Checks if the error is due to the user not being found.
     * @returns True if the user was not found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks if the error is due to the username being invalid.
     * @returns True if the username is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isInvalidUsernameError();
    }

    /**
     * Checks if the error is due to invalid credentials.
     * @returns True if the credentials are invalid, false otherwise.
     */
    isInvalidCredentials(): boolean {
        return this.isInvalidCredentialsError();
    }
}
