/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { ResetPasswordStartErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/ResetPasswordStartErrorV2.js";
import { RequestChallengeErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/RequestChallengeErrorV2.js";
import { VerifyChallengeErrorV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/VerifyChallengeErrorV2.js";
import { SubmitNewPasswordErrorV2 } from "../../../../../../src/custom_auth/reset_password/auth_flow/v2/error_type/SubmitNewPasswordErrorV2.js";
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
