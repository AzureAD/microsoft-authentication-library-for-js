import {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorMessage,
    InteractionRequiredAuthSubErrorMessage,
    InteractionRequiredServerErrorMessage,
} from "../../src/error/InteractionRequiredAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("InteractionRequiredAuthError.ts Class Unit Tests", () => {
    it("InteractionRequiredAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const TEST_ERROR_TIMESTAMP = "2017-05-01 22:43:20Z";
        const TEST_ERROR_TRACE_ID = "b72a68c3-0926-4b8e-bc35-3150069c2800";
        const TEST_ERROR_CORRELATION_ID =
            "73d656cf-54b1-4eb2-b429-26d8165a52d7";
        const TEST_ERROR_CLAIMS =
            '{"access_token":{"polids":{"essential":true,"values":["9ab03e19-ed42-4168-b6b7-7001fb3e933a"]}}}';
        const err: InteractionRequiredAuthError =
            new InteractionRequiredAuthError(
                TEST_ERROR_CODE,
                TEST_ERROR_MSG,
                "N/A",
                TEST_ERROR_TIMESTAMP,
                TEST_ERROR_TRACE_ID,
                TEST_ERROR_CORRELATION_ID,
                TEST_ERROR_CLAIMS
            );

        expect(err instanceof InteractionRequiredAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("InteractionRequiredAuthError");
        expect(err.timestamp).toBe(TEST_ERROR_TIMESTAMP);
        expect(err.traceId).toBe(TEST_ERROR_TRACE_ID);
        expect(err.correlationId).toBe(TEST_ERROR_CORRELATION_ID);
        expect(err.claims).toBe(TEST_ERROR_CLAIMS);
        expect(
            err.stack?.includes("InteractionRequiredAuthError.spec.ts")
        ).toBe(true);
    });

    describe("isInteractionRequiredError()", () => {
        it("Returns false if given values are empty", () => {
            expect(
                InteractionRequiredAuthError.isInteractionRequiredError("", "")
            ).toBe(false);
        });

        it("Returns expected value for given error code", () => {
            InteractionRequiredServerErrorMessage.forEach(function (errorCode) {
                expect(
                    InteractionRequiredAuthError.isInteractionRequiredError(
                        errorCode,
                        ""
                    )
                ).toBe(true);
            });
            expect(
                InteractionRequiredAuthError.isInteractionRequiredError(
                    "bad_token",
                    ""
                )
            ).toBe(false);
        });

        it("Returns expected value for given error string", () => {
            InteractionRequiredServerErrorMessage.forEach(function (errorCode) {
                expect(
                    InteractionRequiredAuthError.isInteractionRequiredError(
                        "",
                        `This is a ${errorCode} error!`
                    )
                ).toBe(true);
            });
            expect(
                InteractionRequiredAuthError.isInteractionRequiredError(
                    "",
                    "This is not an interaction required error"
                )
            ).toBe(false);
        });

        it("Returns expected value for given error code and error string", () => {
            InteractionRequiredServerErrorMessage.forEach(function (errorCode) {
                expect(
                    InteractionRequiredAuthError.isInteractionRequiredError(
                        errorCode,
                        `This is a ${errorCode} error!`
                    )
                ).toBe(true);
            });
            expect(
                InteractionRequiredAuthError.isInteractionRequiredError(
                    "bad_token",
                    "This is not an interaction required error"
                )
            ).toBe(false);
        });

        it("Returns expected value for given sub-error", () => {
            InteractionRequiredAuthSubErrorMessage.forEach(function (
                subErrorCode
            ) {
                expect(
                    InteractionRequiredAuthError.isInteractionRequiredError(
                        "",
                        "",
                        subErrorCode
                    )
                ).toBe(true);
            });
            expect(
                InteractionRequiredAuthError.isInteractionRequiredError(
                    "",
                    "",
                    "bad_token"
                )
            ).toBe(false);
        });
    });

    it("createNoTokensFoundError creates a ClientAuthError object", () => {
        const err: InteractionRequiredAuthError =
            InteractionRequiredAuthError.createNoTokensFoundError();

        expect(err instanceof InteractionRequiredAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(
            InteractionRequiredAuthErrorMessage.noTokensFoundError.code
        );
        expect(
            err.errorMessage.includes(
                InteractionRequiredAuthErrorMessage.noTokensFoundError.desc
            )
        ).toBe(true);
        expect(
            err.message.includes(
                InteractionRequiredAuthErrorMessage.noTokensFoundError.desc
            )
        ).toBe(true);
        expect(err.name).toBe("InteractionRequiredAuthError");
        expect(
            err.stack?.includes("InteractionRequiredAuthError.spec.ts")
        ).toBe(true);
    });

    it("createNativeAccountUnavailableError creates an InteractionRequiredAuthError object", () => {
        const err: InteractionRequiredAuthError =
            InteractionRequiredAuthError.createNativeAccountUnavailableError();

        expect(err instanceof InteractionRequiredAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(
            InteractionRequiredAuthErrorMessage.native_account_unavailable.code
        );
        expect(
            err.errorMessage.includes(
                InteractionRequiredAuthErrorMessage.native_account_unavailable
                    .desc
            )
        ).toBe(true);
        expect(
            err.message.includes(
                InteractionRequiredAuthErrorMessage.native_account_unavailable
                    .desc
            )
        ).toBe(true);
        expect(err.name).toBe("InteractionRequiredAuthError");
        expect(
            err.stack?.includes("InteractionRequiredAuthError.spec.ts")
        ).toBe(true);
    });
});
