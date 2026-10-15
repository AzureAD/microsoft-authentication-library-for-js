/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error returned when additional V2 sign-up attributes cannot be submitted. It
 * identifies attribute failures that an app can correct and resubmit.
 */
export class SubmitAttributesErrorV2 extends AuthFlowErrorBaseV2 {
    /**
     * Checks whether the service requires attributes omitted from the request.
     * Use it to collect the required attributes before resubmitting.
     * @returns True when required attributes are missing, otherwise false.
     */
    isMissingRequiredAttributes(): boolean {
        return this.getAttributeValidationDetails().some(
            (detail) => detail.code === "attributeRequired"
        );
    }

    /**
     * Checks whether a submitted password violates the tenant's password policy.
     * Use it to prompt the user for a stronger password.
     * @returns True when the password violates policy, otherwise false.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordPolicyViolationError();
    }
}
