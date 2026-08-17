/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2ApiError } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";
import { ResetPasswordStartError } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/ResetPasswordStartError.js";
import { RequestChallengeError } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/RequestChallengeError.js";
import { VerifyChallengeError } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/VerifyChallengeError.js";
import { SubmitNewPasswordError } from "../../../../../../src/custom_auth/core/auth_flow/v2/error/SubmitNewPasswordError.js";

/*
 * Locks the V2 server-error -> detector mapping against real V2 traffic.
 */
describe("AuthFlowErrorV2Base error mapping", () => {
    const apiError = (
        code: string,
        options?: {
            innerErrorCode?: string;
            message?: string;
            errorCodes?: number[];
        }
    ): CustomAuthV2ApiError =>
        new CustomAuthV2ApiError(code, options?.message, {
            innerErrorCode: options?.innerErrorCode,
            errorCodes: options?.errorCodes,
        });

    describe("isInvalidCode (VerifyChallengeError)", () => {
        it("is true only for inner invalidOneTimeCode AND outer invalidGrant (AADSTS50181)", () => {
            const error = new VerifyChallengeError(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                    message: "AADSTS50181: Unable to validate the otp.",
                })
            );

            expect(error.isInvalidCode()).toBe(true);
        });

        it("is false for a bare outer invalidGrant with no inner code", () => {
            const error = new VerifyChallengeError(apiError("invalidGrant"));

            expect(error.isInvalidCode()).toBe(false);
        });

        it("is false for an unrelated failure", () => {
            const error = new VerifyChallengeError(apiError("invalidRequest"));

            expect(error.isInvalidCode()).toBe(false);
        });
    });

    describe("isInvalidPassword (SubmitNewPasswordError)", () => {
        it("is true for the inner passwordTooWeak (AADSTS120002)", () => {
            const error = new SubmitNewPasswordError(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordTooWeak",
                    message:
                        "AADSTS120002: New password doesn't meet complexity requirements.",
                })
            );

            expect(error.isInvalidPassword()).toBe(true);
        });

        it("is false for the legacy synthetic passwordInvalid code", () => {
            const error = new SubmitNewPasswordError(
                apiError("invalidRequest", {
                    innerErrorCode: "passwordInvalid",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
        });
    });

    describe("isUserNotFound (ResetPasswordStartError)", () => {
        it("is true when AADSTS50034 is carried in the message (nested /api error)", () => {
            const error = new ResetPasswordStartError(
                apiError("invalidRequest", {
                    message:
                        "AADSTS50034: The user account does not exist in the tenant.",
                })
            );

            expect(error.isUserNotFound()).toBe(true);
        });

        it("is false for an unrelated failure", () => {
            const error = new ResetPasswordStartError(
                apiError("invalidRequest", {
                    message: "AADSTS999999: some other failure.",
                })
            );

            expect(error.isUserNotFound()).toBe(false);
        });
    });

    describe("isBrowserRequired (RequestChallengeError)", () => {
        it("is true for redirect_to_web", () => {
            const error = new RequestChallengeError(
                apiError("redirect_to_web")
            );

            expect(error.isBrowserRequired()).toBe(true);
        });
    });

    describe("isInvalidInput", () => {
        it("is true for an invalid_input error (client-side validation)", () => {
            const error = new ResetPasswordStartError(
                apiError("invalid_input")
            );

            expect(error.isInvalidInput()).toBe(true);
        });

        it("is false for a server failure", () => {
            const error = new VerifyChallengeError(
                apiError("invalidGrant", {
                    innerErrorCode: "invalidOneTimeCode",
                })
            );

            expect(error.isInvalidInput()).toBe(false);
            expect(error.isInvalidCode()).toBe(true);
        });
    });

    /*
     * Errors with no specific detector (invalid/expired continuation token,
     * malformed entry request) match none of the detectors. Apps handle them
     * generically; a body with no code at all is normalized to `unexpected_error`.
     */
    describe("unrecognised failures match no detector", () => {
        it("invalid continuation token (AADSTS10040144) matches nothing", () => {
            const error = new VerifyChallengeError(
                apiError("invalidRequest", {
                    innerErrorCode: "invalidContinuationToken",
                    message:
                        "AADSTS10040144: The continuation_token is invalid.",
                })
            );

            expect(error.isInvalidCode()).toBe(false);
            expect(error.isBrowserRequired()).toBe(false);
        });

        it("expired continuation token (AADSTS552001) matches nothing", () => {
            const error = new SubmitNewPasswordError(
                apiError("expiredToken", {
                    innerErrorCode: "expiredContinuationToken",
                    message:
                        "AADSTS552001: The continuation_token has expired.",
                })
            );

            expect(error.isInvalidPassword()).toBe(false);
            expect(error.isBrowserRequired()).toBe(false);
        });

        it("malformed entry request (AADSTS901001) matches nothing", () => {
            const error = new ResetPasswordStartError(
                apiError("invalid_request", {
                    message: "AADSTS901001: Invalid request.",
                    errorCodes: [901001],
                })
            );

            expect(error.isUserNotFound()).toBe(false);
            expect(error.isBrowserRequired()).toBe(false);
        });
    });
});
