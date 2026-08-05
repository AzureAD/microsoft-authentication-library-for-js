/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised by the first call of the native auth V2 sign-up flow
 * (`signUpV2`).
 */
export class SignUpStartError extends AuthFlowErrorV2Base {
    /**
     * Checks if the error is due to the user already existing.
     * @returns True if the user already exists, false otherwise.
     */
    isUserAlreadyExists(): boolean {
        return this.isUserAlreadyExistsError();
    }

    /**
     * Checks if the error is due to the username being invalid.
     * @returns True if the username is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isInvalidUsernameError();
    }

    /**
     * Checks if the error is due to the password being invalid.
     * @returns True if the password is invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidPasswordError();
    }
}
