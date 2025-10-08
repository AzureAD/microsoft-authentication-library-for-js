/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CustomAuthApiError,
    RedirectError,
} from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import {
    MfaRequestChallengeError,
    MfaSubmitChallengeError,
} from "../../../../../../src/custom_auth/core/auth_flow/mfa/error_type/MfaError.js";
import * as CustomAuthApiSuberror from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.js";

describe("MfaRequestChallengeError", () => {
    const mockErrorData = {
        error: "test_error",
        errorDescription: "Test error description",
    };

    describe("isInvalidInput", () => {
        it("should return true when error is invalid_request with error code 901001", () => {
            const apiError = new CustomAuthApiError(
                "invalid_request",
                "Invalid input parameter",
                "correlation-id",
                [901001]
            );
            const mfaError = new MfaRequestChallengeError(apiError);

            expect(mfaError.isInvalidInput()).toBe(true);
        });

        it("should return false when error is InvalidArgumentError", () => {
            const invalidArgError = new InvalidArgumentError("authMethodId");
            const mfaError = new MfaRequestChallengeError(invalidArgError);

            expect(mfaError.isInvalidInput()).toBe(false);
        });

        it("should return false when error is invalid_request without error code 901001", () => {
            const apiError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request parameter",
                "correlation-id",
                []
            );
            const mfaError = new MfaRequestChallengeError(apiError);

            expect(mfaError.isInvalidInput()).toBe(false);
        });

        it("should return false when error is not an input validation error", () => {
            const customError = new CustomAuthApiError(
                "server_error",
                "Internal server error",
                "correlation-id",
                []
            );
            const mfaError = new MfaRequestChallengeError(customError);

            expect(mfaError.isInvalidInput()).toBe(false);
        });

        it("should return false when error is a RedirectError", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const mfaError = new MfaRequestChallengeError(redirectError);

            expect(mfaError.isInvalidInput()).toBe(false);
        });
    });

    describe("isVerificationContactBlocked", () => {
        it("returns true when error is ACCESS_DENIED with subError PROVIDER_BLOCKED_BY_REPUTATION", () => {
            const apiError = new CustomAuthApiError(
                "access_denied",
                "Verification contact blocked by reputation system",
                "correlation-id",
                [],
                CustomAuthApiSuberror.PROVIDER_BLOCKED_BY_REPUTATION
            );
            const mfaError = new MfaRequestChallengeError(apiError);
            expect(mfaError.isVerificationContactBlocked()).toBe(true);
        });

        it("returns false when error is ACCESS_DENIED but subError different", () => {
            const apiError = new CustomAuthApiError(
                "access_denied",
                "Some other access denied error",
                "correlation-id",
                [],
                CustomAuthApiSuberror.INVALID_OOB_VALUE
            );
            const mfaError = new MfaRequestChallengeError(apiError);
            expect(mfaError.isVerificationContactBlocked()).toBe(false);
        });

        it("returns false when subError matches but error code not ACCESS_DENIED", () => {
            const apiError = new CustomAuthApiError(
                "invalid_request",
                "Verification contact blocked by reputation system",
                "correlation-id",
                [],
                CustomAuthApiSuberror.PROVIDER_BLOCKED_BY_REPUTATION
            );
            const mfaError = new MfaRequestChallengeError(apiError);
            expect(mfaError.isVerificationContactBlocked()).toBe(false);
        });

        it("returns false for non-API errors (InvalidArgumentError)", () => {
            const invalidArg = new InvalidArgumentError("authMethodId");
            const mfaError = new MfaRequestChallengeError(invalidArg);
            expect(mfaError.isVerificationContactBlocked()).toBe(false);
        });
    });
});

describe("MfaSubmitChallengeError", () => {
    const mockErrorData = {
        error: "test_error",
        errorDescription: "Test error description",
    };

    describe("isIncorrectChallenge", () => {
        it("should return true when error is invalid_grant with INVALID_OOB_VALUE suberror", () => {
            const apiError = new CustomAuthApiError(
                "invalid_grant",
                "Invalid OOB value",
                "correlation-id",
                [],
                CustomAuthApiSuberror.INVALID_OOB_VALUE
            );
            const mfaError = new MfaSubmitChallengeError(apiError);

            expect(mfaError.isIncorrectChallenge()).toBe(true);
        });

        it("should return true when error is InvalidArgumentError containing 'code'", () => {
            const argumentError = new InvalidArgumentError("code");
            const mfaError = new MfaSubmitChallengeError(argumentError);

            expect(mfaError.isIncorrectChallenge()).toBe(true);
        });

        it("should return true when error is InvalidArgumentError with description containing 'code'", () => {
            const argumentError = new InvalidArgumentError(
                "The provided code is invalid"
            );
            const mfaError = new MfaSubmitChallengeError(argumentError);

            expect(mfaError.isIncorrectChallenge()).toBe(true);
        });

        it("should return false when error is invalid_grant without INVALID_OOB_VALUE suberror", () => {
            const apiError = new CustomAuthApiError(
                "invalid_grant",
                "Some other error",
                "correlation-id",
                []
            );
            const mfaError = new MfaSubmitChallengeError(apiError);

            expect(mfaError.isIncorrectChallenge()).toBe(false);
        });

        it("should return false when error is InvalidArgumentError not containing 'code'", () => {
            const argumentError = new InvalidArgumentError("password");
            const mfaError = new MfaSubmitChallengeError(argumentError);

            expect(mfaError.isIncorrectChallenge()).toBe(false);
        });

        it("should return false when error is a different type", () => {
            const customError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const mfaError = new MfaSubmitChallengeError(customError);

            expect(mfaError.isIncorrectChallenge()).toBe(false);
        });

        it("should return false when error is a RedirectError", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const mfaError = new MfaSubmitChallengeError(redirectError);

            expect(mfaError.isIncorrectChallenge()).toBe(false);
        });
    });
});
