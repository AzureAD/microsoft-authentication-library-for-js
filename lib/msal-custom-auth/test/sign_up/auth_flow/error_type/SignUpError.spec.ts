import { CustomAuthApiError, RedirectError } from "../../../../src/core/error/CustomAuthApiError.js";
import {
    CustomAuthApiErrorCode,
    CustomAuthApiSuberror,
} from "../../../../src/core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";
import { InvalidArgumentError } from "../../../../src/index.js";
import {
    SignUpError,
    SignUpResendCodeError,
    SignUpSubmitAttributesError,
    SignUpSubmitCodeError,
    SignUpSubmitPasswordError,
} from "../../../../src/sign_up/auth_flow/error_type/SignUpError.js";

describe("SignUpError", () => {
    it("should correctly identify user already exists error", () => {
        const error = new CustomAuthApiError(CustomAuthApiErrorCode.USER_ALREADY_EXISTS, "User already exists");
        const signUpError = new SignUpError(error);
        expect(signUpError.isUserAlreadyExists()).toBe(true);
    });

    it("should correctly identify invalid username error", () => {
        const error = new InvalidArgumentError("Invalid username");
        const signUpError = new SignUpError(error);
        expect(signUpError.isInvalidUsername()).toBe(true);

        const error2 = new CustomAuthApiError("Some Error", "username parameter is empty or not valid", undefined, [
            90100,
        ]);
        const signUpError2 = new SignUpError(error2);
        expect(signUpError2.isInvalidUsername()).toBe(true);
    });

    it("should correctly identify invalid password error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Invalid password",
            undefined,
            undefined,
            CustomAuthApiSuberror.PASSWORD_IS_INVALID,
        );
        const signUpError = new SignUpError(error);
        expect(signUpError.isInvalidPassword()).toBe(true);
    });

    it("should correctly identify missing required attributes error", () => {
        const error = new CustomAuthApiError(CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED, "Attributes required");
        const signUpError = new SignUpError(error);
        expect(signUpError.isMissingRequiredAttributes()).toBe(true);
    });

    it("should correctly identify attributes validation failed error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Attributes validation failed",
            undefined,
            undefined,
            CustomAuthApiSuberror.ATTRIBUTE_VALIATION_FAILED,
        );
        const signUpError = new SignUpError(error);
        expect(signUpError.isAttributesValidationFailed()).toBe(true);
    });

    it("should correctly identify unsupported challenge type error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_REQUEST,
            "The challenge_type list parameter contains an unsupported challenge type",
        );
        const signUpError = new SignUpError(error);
        expect(signUpError.isUnsupportedChallengeType()).toBe(true);

        const error2 = new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            "Unsupported challenge type",
        );
        const signUpError2 = new SignUpError(error2);
        expect(signUpError2.isUnsupportedChallengeType()).toBe(true);
    });

    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const signUpError = new SignUpError(error);
        expect(signUpError.isRedirect()).toBe(true);
    });
});

describe("SignUpSubmitPasswordError", () => {
    it("should correctly identify invalid password error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Invalid password",
            undefined,
            undefined,
            CustomAuthApiSuberror.PASSWORD_IS_INVALID,
        );
        const signUpError = new SignUpSubmitPasswordError(error);
        expect(signUpError.isInvalidPassword()).toBe(true);

        const error2 = new CustomAuthApiError(CustomAuthApiErrorCode.INVALID_GRANT, "Incorrect password", undefined, [
            50126,
        ]);
        const signUpError2 = new SignUpSubmitPasswordError(error2);
        expect(signUpError2.isInvalidPassword()).toBe(true);

        const error3 = new InvalidArgumentError("password is required");
        const signUpError3 = new SignUpSubmitPasswordError(error3);
        expect(signUpError3.isInvalidPassword()).toBe(true);
    });

    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const signUpError = new SignUpSubmitPasswordError(error);
        expect(signUpError.isRedirect()).toBe(true);
    });
});

describe("SignUpSubmitCodeError", () => {
    it("should correctly identify invalid code error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Invalid code",
            undefined,
            undefined,
            CustomAuthApiSuberror.INVALID_OOB_VALUE,
        );
        const signUpError = new SignUpSubmitCodeError(error);
        expect(signUpError.isInvalidCode()).toBe(true);

        const error2 = new InvalidArgumentError("Invalid code");
        const signUpError2 = new SignUpSubmitCodeError(error2);
        expect(signUpError2.isInvalidCode()).toBe(true);
    });

    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const signUpError = new SignUpSubmitCodeError(error);
        expect(signUpError.isRedirect()).toBe(true);
    });
});

describe("SignUpSubmitAttributesError", () => {
    it("should correctly identify missing required attributes error", () => {
        const error = new CustomAuthApiError(CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED, "Attributes required");
        const signUpError = new SignUpSubmitAttributesError(error);
        expect(signUpError.isMissingRequiredAttributes()).toBe(true);
    });

    it("should correctly identify attributes validation failed error", () => {
        const error = new CustomAuthApiError(
            CustomAuthApiErrorCode.INVALID_GRANT,
            "Attributes validation failed",
            undefined,
            undefined,
            CustomAuthApiSuberror.ATTRIBUTE_VALIATION_FAILED,
        );
        const signUpError = new SignUpSubmitAttributesError(error);
        expect(signUpError.isAttributesValidationFailed()).toBe(true);
    });

    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const signUpError = new SignUpSubmitAttributesError(error);
        expect(signUpError.isRedirect()).toBe(true);
    });
});

describe("SignUpResendCodeError", () => {
    it("should correctly identify redirect error", () => {
        const error = new RedirectError("Redirecting...");
        const signUpError = new SignUpResendCodeError(error);
        expect(signUpError.isRedirect()).toBe(true);
    });
});
