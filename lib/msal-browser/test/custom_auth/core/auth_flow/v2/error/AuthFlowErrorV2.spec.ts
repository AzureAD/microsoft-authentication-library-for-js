/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { AuthFlowErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";

/*
 * Locks the V2 server-error -> detector mapping against real V2 traffic.
 */
describe("AuthFlowErrorV2 error mapping", () => {
    const apiError = (
        code: string,
        options?: {
            innerErrorCode?: string;
            subError?: string;
            message?: string;
            errorCodes?: number[];
        }
    ): CustomAuthApiError =>
        new CustomAuthApiError(
            code,
            options?.message ?? "",
            undefined,
            options?.errorCodes,
            options?.subError,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            options?.innerErrorCode
        );

    const errorWithAttributeValidationDetails = (
        details: unknown
    ): AuthFlowErrorV2 => {
        const errorData = apiError("invalidRequest", {
            innerErrorCode: "attributeValidationError",
            message: "Attribute validation failed.",
        });

        Object.defineProperty(errorData, "attributeValidationDetails", {
            value: details,
        });

        return new AuthFlowErrorV2(errorData);
    };

    describe("isInvalidCode", () => {
        it("is true for invalidGrant with inner invalidOneTimeCode", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                    message: "AADSTS50181: Unable to validate the otp.",
                })
            );

            expect(error.isInvalidCode()).toBe(true);
        });

        it("is false for invalidGrant with inner invalidContinuationToken", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidContinuationToken",
                })
            );
            expect(error.isInvalidCode()).toBe(false);
        });

        it("is false for a bare outer invalidGrant with no inner code", () => {
            const error = new AuthFlowErrorV2(apiError("invalidGrant"));
            expect(error.isInvalidCode()).toBe(false);
        });

        it("is false for an unrelated failure", () => {
            const error = new AuthFlowErrorV2(apiError("invalidRequest"));

            expect(error.isInvalidCode()).toBe(false);
        });
    });

    describe("isInvalidPassword", () => {
        it("is true for the inner passwordTooWeak (AADSTS120002)", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordTooWeak",
                    message:
                        "AADSTS120002: New password doesn't meet complexity requirements.",
                })
            );

            expect(error.isInvalidPassword()).toBe(true);
        });

        it("is false for the legacy synthetic passwordInvalid code", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordInvalid",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("is false when passwordTooWeak has a different outer code", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "passwordTooWeak",
                })
            );
            expect(error.isInvalidPassword()).toBe(false);
        });

        it("is true for a password-targeted policy violation", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "Attribute validation failed.",
                    undefined,
                    undefined,
                    "attributeValidationError",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    [
                        {
                            attributeIds: ["Password"],
                            code: "passwordPolicyViolation",
                            message: "Password does not satisfy policy.",
                        },
                    ]
                )
            );

            expect(error.isInvalidPassword()).toBe(true);
        });

        it("is false for a password-policy violation targeting another attribute", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "Attribute validation failed.",
                    undefined,
                    undefined,
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
                )
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it.each([
            [
                "a non-array value",
                [
                    {
                        attributeIds: "password",
                        code: "passwordPolicyViolation",
                    },
                ],
            ],
            [
                "a non-string array entry",
                [
                    {
                        attributeIds: [null],
                        code: "passwordPolicyViolation",
                    },
                ],
            ],
            [
                "no attribute ids",
                [
                    {
                        code: "passwordPolicyViolation",
                    },
                ],
            ],
        ])("is false when a password-policy violation has %s", (_, details) => {
            const error = errorWithAttributeValidationDetails(details);

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("ignores malformed entries when a valid password attribute is present", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: [null, "Password"],
                    code: "passwordPolicyViolation",
                },
            ]);

            expect(error.isInvalidPassword()).toBe(true);
        });
    });

    describe("isUserNotFound", () => {
        it("is true when AADSTS50034 is carried in the message (nested /api error)", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
                })
            );

            expect(error.isUserNotFound()).toBe(true);
        });

        it("is true when the nested error code is userNotFound", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "userNotFound",
                    message: "The supplied account was not found.",
                })
            );

            expect(error.innerErrorCode).toBe("userNotFound");
            expect(error.isUserNotFound()).toBe(true);
        });

        it("is false for an unrelated failure", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    message: "AADSTS999999: some other failure.",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });

        it("is false when AADSTS50034 has a different outer code", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
                })
            );
            expect(error.isUserNotFound()).toBe(false);
        });
    });

    describe("diagnostic preservation", () => {
        it("preserves the raw error and public diagnostics", () => {
            const errorData = new CustomAuthApiError(
                "invalidRequest",
                "AADSTS50034: The user account does not exist in the directory.",
                "66693bdf-6ecc-4b63-8773-8bdafe4f9ca4",
                [50034],
                undefined,
                undefined,
                undefined,
                "c1cb8eb0-c234-4d17-9420-86b85fcb0300",
                "2026-08-22 19:26:35Z"
            );
            const error = new AuthFlowErrorV2(
                errorData,
                CustomAuthFlowScenarioV2.SignIn
            );

            expect(error.errorData).toBe(errorData);
            expect(error.errorDescription).toBe(
                "AADSTS50034: The user account does not exist in the directory."
            );
            expect(error.errorCodes).toEqual([50034]);
            expect(error.scenario).toBe(CustomAuthFlowScenarioV2.SignIn);
            expect(error.isUserNotFound()).toBe(true);
            expect(error.correlationId).toBe(
                "66693bdf-6ecc-4b63-8773-8bdafe4f9ca4"
            );
            expect((error.errorData as CustomAuthApiError).traceId).toBe(
                "c1cb8eb0-c234-4d17-9420-86b85fcb0300"
            );
            expect((error.errorData as CustomAuthApiError).timestamp).toBe(
                "2026-08-22 19:26:35Z"
            );
        });

        it("is false for an unrelated sign-in start failure", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    message: "AADSTS999999: some other failure.",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });
    });

    describe("sign-in errors", () => {
        it("identifies invalidGrant with inner invalidUserNameOrPassword", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidUserNameOrPassword",
                    message:
                        "AADSTS50126: Error validating credentials due to invalid username or password.",
                })
            );

            expect(error.isInvalidCredentials()).toBe(true);
            expect(error.isInvalidPassword()).toBe(false);
        });

        it("does not identify invalid credentials from the outer code alone", () => {
            const error = new AuthFlowErrorV2(apiError("invalidGrant"));

            expect(error.isInvalidCredentials()).toBe(false);
        });

        it("requires invalidGrant for invalidUserNameOrPassword", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "invalidUserNameOrPassword",
                })
            );

            expect(error.isInvalidCredentials()).toBe(false);
        });

        it("does not identify another invalidGrant suberror as invalid credentials", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                })
            );

            expect(error.isInvalidCredentials()).toBe(false);
        });

        it("identifies an invalid username parameter", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "AADSTS90100: username parameter is empty or not valid.",
                    "6ed6616b-9580-4d7b-9d91-9dfe75d7bf97",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "50708ac8-4bb6-44d4-be3c-0065413b0400",
                    "2026-08-22 19:25:11Z"
                )
            );

            expect(error.isInvalidUsername()).toBe(true);
            expect(error.isUserNotFound()).toBe(false);
            expect(error.correlationId).toBe(
                "6ed6616b-9580-4d7b-9d91-9dfe75d7bf97"
            );
            expect((error.errorData as CustomAuthApiError).traceId).toBe(
                "50708ac8-4bb6-44d4-be3c-0065413b0400"
            );
            expect((error.errorData as CustomAuthApiError).timestamp).toBe(
                "2026-08-22 19:25:11Z"
            );
        });

        it("preserves an invalid continuation-token failure", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "AADSTS90100: continuationToken parameter is empty or not valid.",
                    "0125cc68-08de-42d2-819d-135ac42be44b",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "0fb57f04-25a3-4a68-878f-829645380400",
                    "2026-08-22 19:25:49Z"
                )
            );

            expect(error.isInvalidUsername()).toBe(false);
            expect(error.isUserNotFound()).toBe(false);
            expect(error.errorData.error).toBe("invalidRequest");
            expect(error.errorDescription).toContain(
                "continuationToken parameter"
            );
            expect(error.correlationId).toBe(
                "0125cc68-08de-42d2-819d-135ac42be44b"
            );
            expect((error.errorData as CustomAuthApiError).traceId).toBe(
                "0fb57f04-25a3-4a68-878f-829645380400"
            );
            expect((error.errorData as CustomAuthApiError).timestamp).toBe(
                "2026-08-22 19:25:49Z"
            );
        });
    });

    describe("isInvalidUsername", () => {
        it("uses the shared username mapping", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    message:
                        "AADSTS90100: username parameter is empty or not valid.",
                })
            );

            expect(error.isInvalidUsername()).toBe(true);
        });

        it("requires invalidRequest for the username message", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    message:
                        "AADSTS90100: username parameter is empty or not valid.",
                })
            );

            expect(error.isInvalidUsername()).toBe(false);
        });
    });

    describe("isBrowserRequired", () => {
        it("is true for invalid_grant with web_redirect_required", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalid_grant", {
                    subError: "web_redirect_required",
                    message: "AADSTS55214: Non-retryable error has occurred.",
                    errorCodes: [55214],
                })
            );

            expect(error.isBrowserRequired()).toBe(true);
        });

        it("is false for invalid_grant without web_redirect_required", () => {
            const error = new AuthFlowErrorV2(apiError("invalid_grant"));

            expect(error.isBrowserRequired()).toBe(false);
        });
    });

    describe("isInvalidInput", () => {
        it("is true for an InvalidArgumentError", () => {
            const error = new AuthFlowErrorV2(
                new InvalidArgumentError("username")
            );

            expect(error.isInvalidInput()).toBe(true);
            expect(error.isInvalidUsername()).toBe(false);
        });

        it("is false for a server failure", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                })
            );

            expect(error.isInvalidInput()).toBe(false);
            expect(error.isInvalidCode()).toBe(true);
        });
    });

    describe("isUserAlreadyExists", () => {
        it("is true for a nested userAlreadyExists validation detail", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "AADSTS1003037: An account may already exist.",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    [
                        {
                            attributeIds: ["email"],
                            code: "userAlreadyExists",
                            message:
                                "An account with this identifier already exists.",
                        },
                    ]
                )
            );

            expect(error.isUserAlreadyExists()).toBe(true);
        });

        it("is false for another attribute-validation error", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "Attribute validation failed.",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    [
                        {
                            attributeIds: ["email"],
                            code: "invalidFormat",
                            message: "The email address is invalid.",
                        },
                    ]
                )
            );

            expect(error.isUserAlreadyExists()).toBe(false);
        });
    });

    describe("isMissingRequiredAttributes", () => {
        it("is true for a nested attributeRequired validation detail", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "Attribute validation failed.",
                    undefined,
                    undefined,
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
                )
            );

            expect(error.isMissingRequiredAttributes()).toBe(true);
            expect(error.requiredAttributes).toEqual(["jobTitle"]);
            expect(error.invalidAttributes).toEqual([]);
        });

        it("is false for unrelated attribute validation details", () => {
            const error = new AuthFlowErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "Attribute validation failed.",
                    undefined,
                    undefined,
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
                            attributeIds: ["unsupportedAttribute"],
                            code: "notSupported",
                            message: "The attribute is not supported.",
                        },
                    ]
                )
            );

            expect(error.isMissingRequiredAttributes()).toBe(false);
            expect(error.isInvalidPassword()).toBe(false);
            expect(error.requiredAttributes).toEqual([]);
            expect(error.invalidAttributes).toEqual([]);
            expect(
                (error.errorData as CustomAuthApiError)
                    .attributeValidationDetails
            ).toHaveLength(2);
        });

        it("returns required and invalid attribute ids from validation details", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: ["password", "username", "password"],
                    code: "attributeRequired",
                },
                {
                    attributeIds: ["givenName"],
                    code: "attributeValidationFailed",
                },
                {
                    attributeIds: [null, "username"],
                    code: "attributeValidationFailed",
                },
                {
                    attributeIds: ["password"],
                    code: "passwordPolicyViolation",
                },
                {
                    attributeIds: ["email"],
                    code: "userAlreadyExists",
                },
            ]);

            expect(error.requiredAttributes).toEqual(["password", "username"]);
            expect(error.invalidAttributes).toEqual(["givenName", "username"]);
        });
    });
});
