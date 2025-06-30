import { PromptValue } from "../../src/utils/Constants";
import { RequestValidator } from "../../src/request/RequestValidator";
import { TEST_CONFIG } from "../test_kit/StringConstants";
import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../../src/error/ClientConfigurationError";

describe("RequestValidator unit tests", () => {
    describe("ValidateRedirectUri tests", () => {
        it("Throws UrlEmptyError if redirect uri is empty", () => {
            expect(function () {
                RequestValidator.validateRedirectUri("");
            }).toThrowError(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.redirectUriEmpty,
                ),
            );
        });
    });

    describe("ValidatePrompt tests", () => {
        it("PromptValue login", () => {
            RequestValidator.validatePrompt(PromptValue.LOGIN);
        });
        it("PromptValue select_account", () => {
            RequestValidator.validatePrompt(PromptValue.SELECT_ACCOUNT);
        });
        it("PromptValue consent", () => {
            RequestValidator.validatePrompt(PromptValue.CONSENT);
        });
        it("PromptValue none", () => {
            RequestValidator.validatePrompt(PromptValue.NONE);
        });
        it("PromptValue create", () => {
            RequestValidator.validatePrompt(PromptValue.CREATE);
        });
        it("Throws InvalidPromptError if invalid prompt value passed in", () => {
            expect(function () {
                RequestValidator.validatePrompt("");
            }).toThrowError(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidPromptValue,
                ),
            );
        });
    });

    describe("ValidateClaims tests", () => {
        it("Valid Claims", () => {
            RequestValidator.validateClaims(
                '{"access_token":{"example_claim":{"values": ["example_value"]}}}',
            );
        });

        it("Throws InvalidClaimsError if invalid claims value passed in", () => {
            expect(function () {
                RequestValidator.validateClaims("invalid_claims_value");
            }).toThrowError(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidClaims,
                ),
            );
        });
    });

    describe("ValidateCodeChallengeParams tests", () => {
        it("Throws InvalidCodeChallengeParamsError if no code challenge method present", () => {
            expect(function () {
                RequestValidator.validateCodeChallengeParams(
                    "",
                    TEST_CONFIG.CODE_CHALLENGE_METHOD,
                );
            }).toThrowError(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.pkceParamsMissing,
                ),
            );
        });

        it("Throws InvalidCodeChallengeMethodError if no code challenge method present", () => {
            expect(function () {
                RequestValidator.validateCodeChallengeParams(
                    TEST_CONFIG.TEST_CHALLENGE,
                    "255",
                );
            }).toThrowError(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidCodeChallengeMethod,
                ),
            );
        });
    });
});
