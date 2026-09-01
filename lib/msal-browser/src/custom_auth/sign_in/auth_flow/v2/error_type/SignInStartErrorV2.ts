/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error returned when native auth V2 sign-in cannot start.
 */
export class SignInStartErrorV2 extends AuthFlowErrorBaseV2 {
    /**
     * Checks whether the service rejected the username parameter.
     * @returns True when the username was empty or invalid.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks whether the supplied username does not identify an account.
     * @returns True when the service reports that the user was not found.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks whether an automatically submitted password was rejected.
     * @returns True when the password is incorrect.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordIncorrectError();
    }
}
