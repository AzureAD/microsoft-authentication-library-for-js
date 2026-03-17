/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthMethodRegistrationChallengeMethodError,
    AuthMethodRegistrationSubmitChallengeError,
} from "../../../../../../src/custom_auth/core/auth_flow/jit/error_type/AuthMethodRegistrationError.js";
import { CustomAuthError } from "../../../../../../src/custom_auth/core/error/CustomAuthError.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import {
    CustomAuthApiError,
    RedirectError,
} from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import * as CustomAuthApiErrorCode from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";
import * as CustomAuthApiSuberror from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.js";

describe("JitError", () => {
    const mockErrorData = {
        error: "test_error",
        errorDescription: "Test error description",
    };

    describe("AuthMethodRegistrationChallengeMethodError", () => {
        it("should be instance of base error class", () => {
            const customAuthError = new CustomAuthError("test", "test");
            const error = new AuthMethodRegistrationChallengeMethodError(
                customAuthError
            );

            expect(error).toBeInstanceOf(
                AuthMethodRegistrationChallengeMethodError
            );
            expect(error.errorData).toBe(customAuthError);
        });

        it("should return true for isRedirectRequired when redirect error", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const error = new AuthMethodRegistrationChallengeMethodError(
                redirectError
            );

            expect(error.isRedirectRequired()).toBe(true);
        });

        it("should return false for isRedirectRequired when not redirect error", () => {
            const customAuthError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const error = new AuthMethodRegistrationChallengeMethodError(
                customAuthError
            );

            expect(error.isRedirectRequired()).toBe(false);
        });

        it("should return false for isInvalidInput when not invalid input error", () => {
            const customAuthError = new CustomAuthError("test", "test");
            const error = new AuthMethodRegistrationChallengeMethodError(
                customAuthError
            );

            expect(error.isInvalidInput()).toBe(false);
        });

        it("should return true for isInvalidInput when API error with error code 901001", () => {
            const apiError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid input provided",
                "correlation-id",
                [901001]
            );
            const error = new AuthMethodRegistrationChallengeMethodError(
                apiError
            );

            expect(error.isInvalidInput()).toBe(true);
        });

        it("should return false for isInvalidInput when different error code", () => {
            const apiError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_GRANT,
                "Other error",
                "correlation-id",
                [50126]
            );
            const error = new AuthMethodRegistrationChallengeMethodError(
                apiError
            );

            expect(error.isInvalidInput()).toBe(false);
        });

        it("should return true for isVerificationContactBlocked when ACCESS_DENIED with PROVIDER_BLOCKED_BY_REPUTATION subError", () => {
            const apiError = new CustomAuthApiError(
                CustomAuthApiErrorCode.ACCESS_DENIED,
                "Verification contact blocked by reputation system",
                "correlation-id",
                [],
                CustomAuthApiSuberror.PROVIDER_BLOCKED_BY_REPUTATION
            );
            const error = new AuthMethodRegistrationChallengeMethodError(
                apiError
            );

            expect(error.isVerificationContactBlocked()).toBe(true);
        });

        it("should return false for isVerificationContactBlocked when ACCESS_DENIED but different subError", () => {
            const apiError = new CustomAuthApiError(
                CustomAuthApiErrorCode.ACCESS_DENIED,
                "Other access denied scenario",
                "correlation-id",
                [],
                CustomAuthApiSuberror.INVALID_OOB_VALUE
            );
            const error = new AuthMethodRegistrationChallengeMethodError(
                apiError
            );

            expect(error.isVerificationContactBlocked()).toBe(false);
        });

        it("should return false for isVerificationContactBlocked when subError matches but error != ACCESS_DENIED", () => {
            const apiError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Verification contact blocked by reputation system",
                "correlation-id",
                [],
                CustomAuthApiSuberror.PROVIDER_BLOCKED_BY_REPUTATION
            );
            const error = new AuthMethodRegistrationChallengeMethodError(
                apiError
            );

            expect(error.isVerificationContactBlocked()).toBe(false);
        });

        it("should return false for isVerificationContactBlocked when not CustomAuthApiError", () => {
            const customAuthError = new CustomAuthError("test", "test");
            const error = new AuthMethodRegistrationChallengeMethodError(
                customAuthError
            );

            expect(error.isVerificationContactBlocked()).toBe(false);
        });
    });

    describe("AuthMethodRegistrationSubmitChallengeError", () => {
        it("should be instance of base error class", () => {
            const customAuthError = new CustomAuthError("test", "test");
            const error = new AuthMethodRegistrationSubmitChallengeError(
                customAuthError
            );

            expect(error).toBeInstanceOf(
                AuthMethodRegistrationSubmitChallengeError
            );
            expect(error.errorData).toBe(customAuthError);
        });

        it("should return true for isRedirectRequired when redirect error", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const error = new AuthMethodRegistrationSubmitChallengeError(
                redirectError
            );

            expect(error.isRedirectRequired()).toBe(true);
        });

        it("should return false for isRedirectRequired when not redirect error", () => {
            const customAuthError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const error = new AuthMethodRegistrationSubmitChallengeError(
                customAuthError
            );

            expect(error.isRedirectRequired()).toBe(false);
        });

        it("should return true for isIncorrectChallenge when invalid code error with API error", () => {
            const apiError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_GRANT,
                "test description",
                "correlationId",
                [],
                CustomAuthApiSuberror.INVALID_OOB_VALUE
            );
            const error = new AuthMethodRegistrationSubmitChallengeError(
                apiError
            );

            expect(error.isIncorrectChallenge()).toBe(true);
        });

        it("should return true for isIncorrectChallenge when invalid argument error with code", () => {
            const argumentError = new InvalidArgumentError("code");
            const error = new AuthMethodRegistrationSubmitChallengeError(
                argumentError
            );

            expect(error.isIncorrectChallenge()).toBe(true);
        });

        it("should return false for isIncorrectChallenge when other error", () => {
            const customAuthError = new CustomAuthError("other_error", "test");
            const error = new AuthMethodRegistrationSubmitChallengeError(
                customAuthError
            );

            expect(error.isIncorrectChallenge()).toBe(false);
        });
    });
});
