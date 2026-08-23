/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { ResetPasswordStartErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/ResetPasswordStartErrorV2.js";
import { RequestChallengeErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/RequestChallengeErrorV2.js";
import { VerifyChallengeErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/VerifyChallengeErrorV2.js";
import { SubmitNewPasswordErrorV2 } from "../../../../../../src/custom_auth/reset_password/auth_flow/v2/error_type/SubmitNewPasswordErrorV2.js";
import { SignInStartErrorV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/error_type/SignInStartErrorV2.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";

/*
 * Locks the V2 server-error -> detector mapping against real V2 traffic.
 */
describe("AuthFlowErrorBaseV2 error mapping", () => {
    const apiError = (
        code: string,
        options?: {
            innerErrorCode?: string;
            message?: string;
            errorCodes?: number[];
        }
    ): CustomAuthApiError =>
        new CustomAuthApiError(
            code,
            options?.message ?? "",
            undefined,
            options?.errorCodes,
            options?.innerErrorCode
        );

    describe("isInvalidCode (VerifyChallengeErrorV2)", () => {
        it("is true for invalidGrant with inner invalidOneTimeCode", () => {
            const error = new VerifyChallengeErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                    message: "AADSTS50181: Unable to validate the otp.",
                })
            );

            expect(error.isInvalidCode()).toBe(true);
        });

        it("is false for invalidGrant with inner invalidContinuationToken", () => {
            const error = new VerifyChallengeErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidContinuationToken",
                })
            );
            expect(error.isInvalidCode()).toBe(false);
            expect(error.isInvalidCode()).toBe(false);
        });

        it("is false for a bare outer invalidGrant with no inner code", () => {
            const error = new VerifyChallengeErrorV2(apiError("invalidGrant"));
            expect(error.isInvalidCode()).toBe(false);
            expect(error.isInvalidCode()).toBe(false);
        });

        it("is false for an unrelated failure", () => {
            const error = new VerifyChallengeErrorV2(
                apiError("invalidRequest")
            );

            expect(error.isInvalidCode()).toBe(false);
        });
    });

    describe("isInvalidPassword (SubmitNewPasswordErrorV2)", () => {
        it("is true for the inner passwordTooWeak (AADSTS120002)", () => {
            const error = new SubmitNewPasswordErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordTooWeak",
                    message:
                        "AADSTS120002: New password doesn't meet complexity requirements.",
                })
            );

            expect(error.isInvalidPassword()).toBe(true);
        });

        it("is false for the legacy synthetic passwordInvalid code", () => {
            const error = new SubmitNewPasswordErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordInvalid",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("is false when passwordTooWeak has a different outer code", () => {
            const error = new SubmitNewPasswordErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "passwordTooWeak",
                })
            );
            expect(error.isInvalidPassword()).toBe(false);
            expect(error.isInvalidPassword()).toBe(false);
        });
    });

    describe("isUserNotFound (ResetPasswordStartErrorV2)", () => {
        it("is true when AADSTS50034 is carried in the message (nested /api error)", () => {
            const error = new ResetPasswordStartErrorV2(
                apiError("invalidRequest", {
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
                })
            );

            expect(error.isUserNotFound()).toBe(true);
        });

        it("is false for an unrelated failure", () => {
            const error = new ResetPasswordStartErrorV2(
                apiError("invalidRequest", {
                    message: "AADSTS999999: some other failure.",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });

        it("is false when AADSTS50034 has a different outer code", () => {
            const error = new ResetPasswordStartErrorV2(
                apiError("invalidGrant", {
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
                })
            );
            expect(error.isUserNotFound()).toBe(false);
            expect(error.isUserNotFound()).toBe(false);
        });
    });

    describe("isUserNotFound (SignInStartErrorV2)", () => {
        it("is true for the sign-in user-not-found response", () => {
            const error = new SignInStartErrorV2(
                new CustomAuthApiError(
                    "invalidRequest",
                    "AADSTS50034: The user account does not exist in the directory.",
                    "66693bdf-6ecc-4b63-8773-8bdafe4f9ca4",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "c1cb8eb0-c234-4d17-9420-86b85fcb0300",
                    "2026-08-22 19:26:35Z"
                )
            );

            expect(error.isUserNotFound()).toBe(true);
            expect(error.correlationId).toBe(
                "66693bdf-6ecc-4b63-8773-8bdafe4f9ca4"
            );
            expect(
                (error.errorData as CustomAuthApiError).traceId
            ).toBe("c1cb8eb0-c234-4d17-9420-86b85fcb0300");
            expect(
                (error.errorData as CustomAuthApiError).timestamp
            ).toBe("2026-08-22 19:26:35Z");
        });

        it("is false for an unrelated sign-in start failure", () => {
            const error = new SignInStartErrorV2(
                apiError("invalidRequest", {
                    message: "AADSTS999999: some other failure.",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });
    });

    describe("sign-in start errors", () => {
        it("identifies invalidGrant with inner invalidUserNameOrPassword", () => {
            const error = new SignInStartErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidUserNameOrPassword",
                    message:
                        "AADSTS50126: Error validating credentials due to invalid username or password.",
                })
            );

            expect(error.isInvalidPassword()).toBe(true);
        });

        it("does not identify a password error from the outer code alone", () => {
            const error = new SignInStartErrorV2(apiError("invalidGrant"));

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("requires invalidGrant for invalidUserNameOrPassword", () => {
            const error = new SignInStartErrorV2(
                apiError("invalidRequest", {
                    innerErrorCode: "invalidUserNameOrPassword",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });

        it("identifies an invalid username parameter", () => {
            const error = new SignInStartErrorV2(
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
            expect(
                (error.errorData as CustomAuthApiError).traceId
            ).toBe("50708ac8-4bb6-44d4-be3c-0065413b0400");
            expect(
                (error.errorData as CustomAuthApiError).timestamp
            ).toBe("2026-08-22 19:25:11Z");
        });

        it("preserves an invalid continuation-token failure", () => {
            const error = new SignInStartErrorV2(
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
            expect(
                (error.errorData as CustomAuthApiError).traceId
            ).toBe("0fb57f04-25a3-4a68-878f-829645380400");
            expect(
                (error.errorData as CustomAuthApiError).timestamp
            ).toBe("2026-08-22 19:25:49Z");
        });
    });

    describe("isInvalidUsername (ResetPasswordStartErrorV2)", () => {
        it("uses the shared username mapping", () => {
            const error = new ResetPasswordStartErrorV2(
                apiError("invalidRequest", {
                    message:
                        "AADSTS90100: username parameter is empty or not valid.",
                })
            );

            expect(error.isInvalidUsername()).toBe(true);
        });
    });

    describe("isBrowserRequired (RequestChallengeErrorV2)", () => {
        it("is true for redirect_to_web", () => {
            const error = new RequestChallengeErrorV2(
                apiError("redirect_to_web")
            );

            expect(error.isBrowserRequired()).toBe(true);
        });
    });

    describe("isInvalidInput", () => {
        it("is true for an InvalidArgumentError", () => {
            const error = new ResetPasswordStartErrorV2(
                new InvalidArgumentError("username")
            );

            expect(error.isInvalidInput()).toBe(true);
            expect(error.isInvalidUsername()).toBe(false);
        });

        it("is false for a server failure", () => {
            const error = new VerifyChallengeErrorV2(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                })
            );

            expect(error.isInvalidInput()).toBe(false);
            expect(error.isInvalidCode()).toBe(true);
        });
    });
});
