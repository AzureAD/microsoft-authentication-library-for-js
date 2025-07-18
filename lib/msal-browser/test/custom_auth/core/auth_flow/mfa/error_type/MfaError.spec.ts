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
    MfaGetAuthMethodsError,
} from "../../../../../../src/custom_auth/core/auth_flow/mfa/error_type/MfaError.js";
import * as CustomAuthApiSuberror from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.js";

describe("MfaRequestChallengeError", () => {
    const mockErrorData = {
        error: "test_error",
        errorDescription: "Test error description",
    };

    describe("isRedirectRequired", () => {
        it("should return true when error is a RedirectError", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const mfaError = new MfaRequestChallengeError(redirectError);

            expect(mfaError.isRedirectRequired()).toBe(true);
        });

        it("should return false when error is not a RedirectError", () => {
            const customError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const mfaError = new MfaRequestChallengeError(customError);

            expect(mfaError.isRedirectRequired()).toBe(false);
        });

        it("should return false when error is a generic error", () => {
            const genericError = new InvalidArgumentError("test");
            const mfaError = new MfaRequestChallengeError(genericError);

            expect(mfaError.isRedirectRequired()).toBe(false);
        });
    });
});

describe("MfaSubmitChallengeError", () => {
    const mockErrorData = {
        error: "test_error",
        errorDescription: "Test error description",
    };

    describe("isInvalidCode", () => {
        it("should return true when error is invalid_grant with INVALID_OOB_VALUE suberror", () => {
            const apiError = new CustomAuthApiError(
                "invalid_grant",
                "Invalid OOB value",
                "correlation-id",
                [],
                CustomAuthApiSuberror.INVALID_OOB_VALUE
            );
            const mfaError = new MfaSubmitChallengeError(apiError);

            expect(mfaError.isInvalidCode()).toBe(true);
        });

        it("should return true when error is InvalidArgumentError containing 'code'", () => {
            const argumentError = new InvalidArgumentError("code");
            const mfaError = new MfaSubmitChallengeError(argumentError);

            expect(mfaError.isInvalidCode()).toBe(true);
        });

        it("should return true when error is InvalidArgumentError with description containing 'code'", () => {
            const argumentError = new InvalidArgumentError(
                "The provided code is invalid"
            );
            const mfaError = new MfaSubmitChallengeError(argumentError);

            expect(mfaError.isInvalidCode()).toBe(true);
        });

        it("should return false when error is invalid_grant without INVALID_OOB_VALUE suberror", () => {
            const apiError = new CustomAuthApiError(
                "invalid_grant",
                "Some other error",
                "correlation-id",
                []
            );
            const mfaError = new MfaSubmitChallengeError(apiError);

            expect(mfaError.isInvalidCode()).toBe(false);
        });

        it("should return false when error is InvalidArgumentError not containing 'code'", () => {
            const argumentError = new InvalidArgumentError("password");
            const mfaError = new MfaSubmitChallengeError(argumentError);

            expect(mfaError.isInvalidCode()).toBe(false);
        });

        it("should return false when error is a different type", () => {
            const customError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const mfaError = new MfaSubmitChallengeError(customError);

            expect(mfaError.isInvalidCode()).toBe(false);
        });
    });

    describe("isRedirectRequired", () => {
        it("should return true when error is a RedirectError", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const mfaError = new MfaSubmitChallengeError(redirectError);

            expect(mfaError.isRedirectRequired()).toBe(true);
        });

        it("should return false when error is not a RedirectError", () => {
            const customError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const mfaError = new MfaSubmitChallengeError(customError);

            expect(mfaError.isRedirectRequired()).toBe(false);
        });
    });
});

describe("MfaGetAuthMethodsError", () => {
    const mockErrorData = {
        error: "test_error",
        errorDescription: "Test error description",
    };

    describe("isRedirectRequired", () => {
        it("should return true when error is a RedirectError", () => {
            const redirectError = new RedirectError(mockErrorData as any);
            const mfaError = new MfaGetAuthMethodsError(redirectError);

            expect(mfaError.isRedirectRequired()).toBe(true);
        });

        it("should return false when error is not a RedirectError", () => {
            const customError = new CustomAuthApiError(
                "invalid_request",
                "Invalid request",
                "correlation-id",
                []
            );
            const mfaError = new MfaGetAuthMethodsError(customError);

            expect(mfaError.isRedirectRequired()).toBe(false);
        });

        it("should return false when error is a generic error", () => {
            const genericError = new InvalidArgumentError("test");
            const mfaError = new MfaGetAuthMethodsError(genericError);

            expect(mfaError.isRedirectRequired()).toBe(false);
        });
    });
});
