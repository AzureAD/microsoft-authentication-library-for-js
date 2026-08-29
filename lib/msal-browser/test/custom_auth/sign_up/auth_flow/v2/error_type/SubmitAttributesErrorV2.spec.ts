/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SubmitAttributesErrorV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/error_type/SubmitAttributesErrorV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";

describe("SubmitAttributesErrorV2", () => {
    it("detects missing required attributes", () => {
        const error = new SubmitAttributesErrorV2(
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
                        attributeIds: ["jobTitle"],
                        code: "attributeRequired",
                        message: "Attribute 'jobTitle' is required.",
                    },
                ]
            ),
            "signUp"
        );

        expect(error.isMissingRequiredAttributes()).toBe(true);
        expect(error.isInvalidPassword()).toBe(false);
    });

    it("detects password policy violations targeting password", () => {
        const error = new SubmitAttributesErrorV2(
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

        expect(error.isMissingRequiredAttributes()).toBe(false);
        expect(error.isInvalidPassword()).toBe(true);
    });

    it("leaves duplicate and unsupported flatusername details as general errors", () => {
        const error = new SubmitAttributesErrorV2(
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
                        attributeIds: ["email"],
                        code: "userAlreadyExists",
                        message: "The account already exists.",
                    },
                    {
                        attributeIds: ["flatusername"],
                        code: "notSupported",
                        message: "The attribute is not supported.",
                    },
                ]
            ),
            "signUp"
        );

        expect(error.isMissingRequiredAttributes()).toBe(false);
        expect(error.isInvalidPassword()).toBe(false);
        expect(
            (error.errorData as CustomAuthApiError).attributeValidationDetails
        ).toHaveLength(2);
    });
});
