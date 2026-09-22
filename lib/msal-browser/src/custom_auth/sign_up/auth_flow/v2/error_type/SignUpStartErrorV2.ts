/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error returned when native auth V2 sign-up cannot start. It exposes
 * detectors for failures that an app can correct without restarting the flow.
 */
export class SignUpStartErrorV2 extends AuthFlowErrorBaseV2 {
    /**
     * Checks whether an upfront password violates the tenant's password policy.
     * Use it to prompt the user for a stronger password.
     * @returns True when the password violates policy, otherwise false.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordPolicyViolationError();
    }
}
