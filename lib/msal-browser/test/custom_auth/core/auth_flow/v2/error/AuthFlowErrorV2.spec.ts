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
        details: unknown,
        context: {
            code: string;
            innerErrorCode?: string;
        } = {
            code: "invalidRequest",
            innerErrorCode: "attributeValidationError",
        }
    ): AuthFlowErrorV2 => {
        const errorData = apiError(context.code, {
            innerErrorCode: context.innerErrorCode,
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
            expect(error.isInvalidChallenge()).toBe(false);
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

    describe("isInvalidChallenge", () => {
        it.each(["mfaVerification", "authMethodRegistration"] as const)(
            "distinguishes a rejected %s challenge from an ordinary code",
            (errorContext) => {
                const errorData = apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                });
                const error = new AuthFlowErrorV2(
                    errorData,
                    CustomAuthFlowScenarioV2.SignIn,
                    errorContext
                );

                expect(error.isInvalidChallenge()).toBe(true);
                expect(error.isInvalidCode()).toBe(false);
                expect(error.errorData).toBe(errorData);
            }
        );

        it.each([
            {
                code: "invalidRequest",
                innerErrorCode: "invalidOneTimeCode",
            },
            {
                code: "invalidGrant",
                innerErrorCode: "invalidContinuationToken",
            },
        ])(
            "does not classify outer $code and inner $innerErrorCode as a challenge",
            ({ code, innerErrorCode }) => {
                const error = new AuthFlowErrorV2(
                    apiError(code, { innerErrorCode }),
                    CustomAuthFlowScenarioV2.SignIn,
                    "mfaVerification"
                );

                expect(error.isInvalidChallenge()).toBe(false);
            }
        );
    });

    describe("isInvalidAttributeError", () => {
        it.each(["username", "password", "displayName"])(
            "identifies attribute-validation errors targeting %s",
            (attributeId) => {
                const error = errorWithAttributeValidationDetails([
                    {
                        attributeIds: [attributeId],
                        code: "attributeValidationFailed",
                    },
                ]);

                expect(error.isInvalidAttributeError()).toBe(true);
                expect(error.invalidAttributes).toEqual([attributeId]);
                expect(error.isInvalidUsername()).toBe(false);
                expect(error.isInvalidInput()).toBe(false);
            }
        );

        it("does not require an attributeValidationFailed detail code", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: ["username"],
                    code: "attributeRequired",
                },
            ]);

            expect(error.isInvalidAttributeError()).toBe(true);
            expect(error.invalidAttributes).toEqual([]);
            expect(error.requiredAttributes).toEqual(["username"]);
        });

        it.each([
            { name: "missing", details: undefined },
            { name: "empty", details: [] },
        ])("identifies errors with $name details", ({ details }) => {
            const error = errorWithAttributeValidationDetails(details);

            expect(error.isInvalidAttributeError()).toBe(true);
            expect(error.invalidAttributes).toEqual([]);
        });

        it.each([
            {
                code: "invalidGrant",
                innerErrorCode: "attributeValidationError",
            },
            {
                code: "invalidRequest",
                innerErrorCode: "differentError",
            },
            {
                code: "invalidRequest",
                innerErrorCode: undefined,
            },
        ])(
            "rejects outer $code and inner $innerErrorCode",
            ({ code, innerErrorCode }) => {
                const error = new AuthFlowErrorV2(
                    apiError(code, { innerErrorCode })
                );

                expect(error.isInvalidAttributeError()).toBe(false);
            }
        );
    });

    describe("isInvalidPassword", () => {
        const passwordPolicyCodes = [
            "passwordTooWeak",
            "passwordTooShort",
            "passwordTooLong",
            "passwordIsInvalid",
            "passwordRecentlyUsed",
            "passwordBanned",
        ];

        it.each(passwordPolicyCodes)(
            "is true for inner %s",
            (innerErrorCode) => {
                const error = new AuthFlowErrorV2(
                    apiError("invalidRequest", {
                        innerErrorCode,
                        message:
                            "The supplied password does not meet password policy.",
                    })
                );

                expect(error.isInvalidPassword()).toBe(true);
            }
        );

        it("is false for the legacy synthetic passwordInvalid code", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordInvalid",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("is false when password reset is not enabled for the account", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordResetNotEnabledForUser",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it.each(passwordPolicyCodes)(
            "is false when %s has a different outer code",
            (innerErrorCode) => {
                const error = new AuthFlowErrorV2(
                    apiError("invalidGrant", {
                        innerErrorCode,
                    })
                );
                expect(error.isInvalidPassword()).toBe(false);
            }
        );

        it.each([
            "passwordPolicyViolation",
            "attributeValidationFailed",
            "unknownDetailCode",
            undefined,
        ])(
            "identifies a password attribute regardless of detail code %s",
            (code) => {
                const error = errorWithAttributeValidationDetails([
                    {
                        attributeIds: ["displayName"],
                        code: "attributeValidationFailed",
                    },
                    {
                        attributeIds: ["username", "password"],
                        code,
                    },
                ]);

                expect(error.isInvalidPassword()).toBe(true);
            }
        );

        it("is false for a password-policy violation targeting another attribute", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: ["displayName"],
                    code: "passwordPolicyViolation",
                    message: "Attribute validation failed.",
                },
            ]);

            expect(error.isInvalidPassword()).toBe(false);
        });

        it.each([
            {
                code: "invalidGrant",
                innerErrorCode: "attributeValidationError",
            },
            {
                code: "unexpected_error",
                innerErrorCode: "attributeValidationError",
            },
            {
                code: "invalidRequest",
                innerErrorCode: "differentError",
            },
            {
                code: "invalidRequest",
                innerErrorCode: undefined,
            },
        ])(
            "rejects password details for outer $code and inner $innerErrorCode",
            (context) => {
                const error = errorWithAttributeValidationDetails(
                    [
                        {
                            attributeIds: ["password"],
                            code: "passwordPolicyViolation",
                        },
                    ],
                    context
                );

                expect(error.isInvalidPassword()).toBe(false);
            }
        );

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
        ])(
            "is false when password attribute validation has %s",
            (_, details) => {
                const error = errorWithAttributeValidationDetails(details);

                expect(error.isInvalidPassword()).toBe(false);
            }
        );

        it("requires an exact lowercase password attribute id", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: ["Password"],
                    code: "passwordPolicyViolation",
                },
            ]);

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("ignores malformed entries when a valid password attribute is present", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: [null, "password"],
                    code: "passwordPolicyViolation",
                },
            ]);

            expect(error.isInvalidPassword()).toBe(true);
        });
    });

    describe("isUserNotFound", () => {
        it("does not classify a message-only AADSTS50034 failure", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });

        it("is true when the nested error code is userNotFound", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "userNotFound",
                    message:
                        "AADSTS10040172: The user account does not exist in the directory.",
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

        it("requires invalidRequest for inner userNotFound", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "userNotFound",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });

        it("does not override a different inner code using AADSTS50034", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "sessionExpiredOrInvalid",
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
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
            expect(error.isUserNotFound()).toBe(false);
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
        it("identifies invalidGrant with inner invalidUserNameOrPassword as an invalid password", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidUserNameOrPassword",
                    message:
                        "AADSTS50126: Error validating credentials due to invalid username or password.",
                })
            );

            expect(error.isInvalidPassword()).toBe(true);
        });

        it("does not identify an invalid password from the outer code alone", () => {
            const error = new AuthFlowErrorV2(apiError("invalidGrant"));

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("does not identify an invalid password from AADSTS50126 message text alone", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    message:
                        "AADSTS50126: Error validating credentials due to invalid username or password.",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("requires invalidGrant for invalidUserNameOrPassword", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "invalidUserNameOrPassword",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("does not identify another invalidGrant suberror as an invalid password", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("preserves a server username rejection without classifying it as local validation", () => {
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

            expect(error.isInvalidUsername()).toBe(false);
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
        it("identifies a locally rejected username and retains invalid-input classification", () => {
            const errorData = new InvalidArgumentError("inputs.username");
            const error = new AuthFlowErrorV2(errorData);

            expect(error.isInvalidUsername()).toBe(true);
            expect(error.isInvalidInput()).toBe(true);
            expect(error.isInvalidChallenge()).toBe(false);
            expect(error.errorData).toBe(errorData);
        });

        it.each([
            "inputs",
            "inputs.password",
            "inputs.claims",
            "inputs.scopes",
        ])("does not infer username validation from %s", (argName) => {
            const error = new AuthFlowErrorV2(
                new InvalidArgumentError(argName)
            );

            expect(error.isInvalidUsername()).toBe(false);
            expect(error.isInvalidInput()).toBe(true);
        });

        it("does not classify a server username message as local validation", () => {
            const error = new AuthFlowErrorV2(
                apiError("invalidRequest", {
                    message:
                        "AADSTS90100: username parameter is empty or not valid.",
                })
            );

            expect(error.isInvalidUsername()).toBe(false);
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

        it.each(["invalidGrant", "invalidRequest", ""])(
            "is false for outer %s with web_redirect_required",
            (code) => {
                const error = new AuthFlowErrorV2(
                    apiError(code, {
                        subError: "web_redirect_required",
                    })
                );

                expect(error.isBrowserRequired()).toBe(false);
            }
        );
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

    describe("attribute validation diagnostics", () => {
        it("preserves required ids from a nested attributeRequired validation detail", () => {
            const error = errorWithAttributeValidationDetails([
                {
                    attributeIds: ["givenName"],
                    code: "attributeRequired",
                    message: "This field is required.",
                },
            ]);

            expect(error.requiredAttributes).toEqual(["givenName"]);
            expect(error.invalidAttributes).toEqual([]);
            expect(error.isInvalidPassword()).toBe(false);
        });

        it("preserves unrelated attribute validation details", () => {
            const error = errorWithAttributeValidationDetails([
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
            ]);

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
            expect(error.isInvalidPassword()).toBe(true);
        });
    });
});
