/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error returned when additional V2 sign-up attributes cannot be submitted.
 */
export class SubmitAttributesErrorV2 extends AuthFlowErrorBaseV2 {
    isMissingRequiredAttributes(): boolean {
        return this.getAttributeValidationDetails().some(
            (detail) => detail.code === "attributeRequired"
        );
    }

    isInvalidPassword(): boolean {
        return this.getAttributeValidationDetails().some(
            (detail) =>
                detail.code === "passwordPolicyViolation" &&
                detail.attributeIds?.some(
                    (attributeId) => attributeId.toLowerCase() === "password"
                ) === true
        );
    }
}
