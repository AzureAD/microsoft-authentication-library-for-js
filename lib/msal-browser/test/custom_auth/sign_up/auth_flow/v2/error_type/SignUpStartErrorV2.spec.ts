/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpStartErrorV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/error_type/SignUpStartErrorV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";

describe("SignUpStartErrorV2", () => {
    it("detects password policy violations targeting password", () => {
        const error = new SignUpStartErrorV2(
            new CustomAuthApiError(
                "invalidRequest",
                "Attribute validation failed.",
                "corr-1",
                [],
                "attributeValidationError",
                undefined,
                undefined,
                undefined,
                undefined,
                [
                    {
                        attributeIds: ["password"],
                        code: "passwordPolicyViolation",
                        message: "Password does not satisfy policy.",
                    },
                ]
            ),
            "signUp"
        );

        expect(error.isInvalidPassword()).toBe(true);
    });

    it("does not classify unrelated attribute validation failures as invalid passwords", () => {
        const error = new SignUpStartErrorV2(
            new CustomAuthApiError(
                "invalidRequest",
                "Attribute validation failed.",
                "corr-1",
                [],
                "attributeValidationError",
                undefined,
                undefined,
                undefined,
                undefined,
                [
                    {
                        attributeIds: ["displayName"],
                        code: "passwordPolicyViolation",
                        message: "Attribute validation failed.",
                    },
                ]
            ),
            "signUp"
        );

        expect(error.isInvalidPassword()).toBe(false);
    });
});
