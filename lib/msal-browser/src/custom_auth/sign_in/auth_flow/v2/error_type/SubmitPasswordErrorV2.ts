/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error returned when a password cannot be submitted for V2 sign-in.
 */
export class SubmitPasswordErrorV2 extends AuthFlowErrorBaseV2 {
    /**
     * Checks whether the supplied password was rejected.
     * @returns True when the password is incorrect.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordIncorrectError();
    }
}
