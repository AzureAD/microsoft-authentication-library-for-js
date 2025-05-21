import {
    CustomAuthApiError,
    RedirectError,
} from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import {
    CustomAuthApiErrorCode,
    CustomAuthApiSuberror,
} from "../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/index.js";
import {
    ResetPasswordError,
    ResetPasswordResendCodeError,
    ResetPasswordSubmitCodeError,
    ResetPasswordSubmitPasswordError,
} from "../../../../../src/custom_auth/reset_password/auth_flow/error_type/ResetPasswordError.js";

describe("ResetPasswordError", () => {
    it("should correctly identify user not found error", () => {
        const error = new CustomAuthApiError(
            "user_not_found",
            "User not found"
        );
        const resetPasswordError = new ResetPasswordError(error);
        expect(resetPasswordError.isUserNotFound()).toBe(true);
    });

    it("should correctly identify invalid username error", () => {
        const error = new InvalidArgumentError("Invalid username");
        const resetPasswordError = new ResetPasswordError(error);
        expect(resetPasswordError.isInvalidUsername()).toBe(true);

        const error2 = new CustomAuthApiError(
            "Some Error",
            "username parameter is empty or not valid",
            undefined,
            [90100]
        );
        const resetPasswordError2 = new ResetPasswordError(error2);
        expect(resetPasswordError2.isInvalidUsername()).toBe(true);
    });

    it("should correctly identify unsupported challenge type error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_REQUEST,
            "The challenge_type list parameter contains an unsupported challenge type"
        );
        const resetPasswordError = new ResetPasswordError(error);
        expect(resetPasswordError.isUnsupportedChallengeType()).toBe(true);

        const error2 = new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            "Unsupported challenge type"
        );
        const resetPasswordError2 = new ResetPasswordError(error2);
        expect(resetPasswordError2.isUnsupportedChallengeType()).toBe(true);
    });

    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const resetPasswordError = new ResetPasswordError(error);
        expect(resetPasswordError.isRedirectRequired()).toBe(true);
    });
});

describe("ResetPasswordSubmitPasswordError", () => {
    it("should correctly identify invalid password error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Invalid password",
            undefined,
            undefined,
            CustomAuthApiSuberror.PASSWORD_IS_INVALID
        );
        const resetPasswordError = new ResetPasswordSubmitPasswordError(error);
        expect(resetPasswordError.isInvalidPassword()).toBe(true);

        const error2 = new InvalidArgumentError("password is required");
        const resetPasswordError2 = new ResetPasswordSubmitPasswordError(
            error2
        );
        expect(resetPasswordError2.isInvalidPassword()).toBe(true);
    });

    it("should correctly identify password reset failed error", () => {
        const error1 = new CustomAuthApiError(
            "password_reset_timeout",
            "Password reset timeout"
        );
        const resetPasswordError1 = new ResetPasswordSubmitPasswordError(
            error1
        );
        expect(resetPasswordError1.isPasswordResetFailed()).toBe(true);

        const error2 = new CustomAuthApiError(
            "password_change_failed",
            "Password reset is failed"
        );
        const resetPasswordError2 = new ResetPasswordSubmitPasswordError(
            error2
        );
        expect(resetPasswordError2.isPasswordResetFailed()).toBe(true);
    });
});

describe("ResetPasswordSubmitCodeError", () => {
    it("should correctly identify invalid code error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Invalid code",
            undefined,
            undefined,
            CustomAuthApiSuberror.INVALID_OOB_VALUE
        );
        const resetPasswordError = new ResetPasswordSubmitCodeError(error);
        expect(resetPasswordError.isInvalidCode()).toBe(true);

        const error2 = new InvalidArgumentError("Invalid code");
        const resetPasswordError2 = new ResetPasswordSubmitCodeError(error2);
        expect(resetPasswordError2.isInvalidCode()).toBe(true);
    });

    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const resetPasswordError = new ResetPasswordSubmitCodeError(error);
        expect(resetPasswordError.isRedirectRequired()).toBe(true);
    });
});

describe("ResetPasswordResendCodeError", () => {
    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const resetPasswordError = new ResetPasswordResendCodeError(error);
        expect(resetPasswordError.isRedirectRequired()).toBe(true);
    });
});
