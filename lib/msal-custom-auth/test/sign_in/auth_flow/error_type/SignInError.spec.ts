import {
    CustomAuthApiError,
    RedirectError,
} from "../../../../src/core/error/CustomAuthApiError.js";
import { InvalidArgumentError } from "../../../../src/index.js";
import {
    SignInError,
    SignInSubmitCodeError,
    SignInSubmitPasswordError,
} from "../../../../src/sign_in/auth_flow/error_type/SignInError.js";

describe("SignInError", () => {
    const mockErrorData = {
        error: "",
        errorDescription: "",
    };

    it("should return true for isUserNotFound when error is USER_NOT_FOUND", () => {
        const errorData = { ...mockErrorData, error: "user_not_found" };
        const signInError = new SignInError(errorData as any);
        expect(signInError.isUserNotFound()).toBe(true);
    });

    it("should return true for isInvalidUsername when errorDescription mentions username", () => {
        const errorData = {
            ...mockErrorData,
            errorDescription: "username parameter is empty or not valid",
        };
        const signInError = new SignInError(errorData as any);
        expect(signInError.isInvalidUsername()).toBe(true);
    });

    it("should return true for isInvalidPassword when error matches INVALID_GRANT with 50126", () => {
        const errorData = new CustomAuthApiError(
            "invalid_grant",
            "Invalid grant",
            "correlation-id",
            [50126],
        );
        const signInError = new SignInError(errorData);
        expect(signInError.isInvalidPassword()).toBe(true);
    });

    it("should return true for isInvalidPassword when error is InvalidArgumentError and message includes 'password'", () => {
        const errorData = new InvalidArgumentError("password");
        const signInError = new SignInError(errorData);
        expect(signInError.isInvalidPassword()).toBe(true);
    });

    it("should return true for isUnsupportedChallengeType when error matches unsupported types", () => {
        const errorData = {
            ...mockErrorData,
            error: "unsupported_challenge_type",
        };
        const signInError = new SignInError(errorData as any);
        expect(signInError.isUnsupportedChallengeType()).toBe(true);
    });

    it("should return true for isRedirect when error is an instance of RedirectError", () => {
        const redirectError = new RedirectError(mockErrorData as any);
        const signInError = new SignInError(redirectError as any);
        expect(signInError.isRedirect()).toBe(true);
    });

    it("should return false for all methods when error data does not match any condition", () => {
        const errorData = { ...mockErrorData, error: "some_other_error" };
        const signInError = new SignInError(errorData as any);

        expect(signInError.isUserNotFound()).toBe(false);
        expect(signInError.isInvalidUsername()).toBe(false);
        expect(signInError.isInvalidPassword()).toBe(false);
        expect(signInError.isUnsupportedChallengeType()).toBe(false);
        expect(signInError.isRedirect()).toBe(false);
    });
});

describe("SignInSubmitPasswordError", () => {
    it("should return true for isInvalidPassword when error matches INVALID_GRANT with 50126", () => {
        const errorData = new CustomAuthApiError(
            "invalid_grant",
            "Invalid grant",
            "correlation-id",
            [50126],
        );
        const submitPasswordError = new SignInSubmitPasswordError(errorData);
        expect(submitPasswordError.isInvalidPassword()).toBe(true);
    });

    it("should return true for isInvalidPassword when error is InvalidArgumentError and message includes 'password'", () => {
        const errorData = new InvalidArgumentError("password");
        const submitPasswordError = new SignInSubmitPasswordError(errorData);
        expect(submitPasswordError.isInvalidPassword()).toBe(true);
    });
});

describe("SignInSubmitCodeError", () => {
    it("should return true for isInvalidCode when error matches INVALID_GRANT and INVALID_OOB_VALUE", () => {
        const errorData = new CustomAuthApiError(
            "invalid_grant",
            "Invalid grant",
            "correlation-id",
            [],
            "invalid_oob_value",
        );
        const submitCodeError = new SignInSubmitCodeError(errorData);
        expect(submitCodeError.isInvalidCode()).toBe(true);
    });

    it("should return true for isInvalidCode when error is InvalidArgumentError and message includes 'code'", () => {
        const errorData = new InvalidArgumentError("code");
        const submitCodeError = new SignInSubmitCodeError(errorData);
        expect(submitCodeError.isInvalidCode()).toBe(true);
    });
});
