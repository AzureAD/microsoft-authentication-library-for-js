import {
    CustomAuthApiError,
    CustomAuthApiErrorCode,
    RedirectError,
} from "../../../../src/core/error/CustomAuthApiError.js";
import { CustomAuthApiResponseHandler } from "../../../../src/core/network_client/custom_auth_api/CustomAuthApiResponseHandler.js";
import {
    SignInChallengeResponse,
    SignInInitiateResponse,
    SignInTokenResponse,
} from "../../../../src/core/network_client/custom_auth_api/response/ApiResponse.js";
import {
    HttpResponseMessage,
    HttpStatusCode,
} from "../../../../src/core/network_client/http_client/HttpMessage.js";
import { ChallengeType } from "../../../../src/CustomAuthConstants.js";

describe("CustomAuthApiResponseHandler", () => {
    const correlationId = "test-correlation-id";

    describe("handleSignInInitiateResponse", () => {
        it("should handle a valid sign-in initiate response", () => {
            const mockBody = JSON.stringify({
                continuation_token: "test-token",
            });
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            const result =
                CustomAuthApiResponseHandler.handleSignInInitiateResponse(
                    response,
                    correlationId,
                );

            expect(result).toBeInstanceOf(SignInInitiateResponse);
            expect(result.continuation_token).toBe("test-token");
            expect(result.correlation_id).toBe(correlationId);
        });

        it("should throw if continuation_token is missing", () => {
            const mockBody = JSON.stringify({});
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            expect(() =>
                CustomAuthApiResponseHandler.handleSignInInitiateResponse(
                    response,
                    correlationId,
                ),
            ).toThrow(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.CONTINUATION_TOKEN_MISSING,
                    "Continuation token is missing in the response body",
                    correlationId,
                ),
            );
        });

        it("should throw if response body is invalid JSON", () => {
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                "invalid_json",
                {},
            );

            expect(() =>
                CustomAuthApiResponseHandler.handleSignInInitiateResponse(
                    response,
                    correlationId,
                ),
            ).toThrow(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.INVALID_RESPONSE_BODY,
                    "Response body is empty or invalid: SyntaxError: Unexpected token 'i', \"invalid_json\" is not valid JSON",
                    correlationId,
                ),
            );
        });

        it("should throw if response is empty", () => {
            expect(() =>
                CustomAuthApiResponseHandler.handleSignInInitiateResponse(
                    null as any,
                    correlationId,
                ),
            ).toThrow(
                new CustomAuthApiError(
                    "empty_response",
                    "Response is empty",
                    correlationId,
                ),
            );
        });
    });

    describe("handleSignInChallengeResponse", () => {
        it("should handle a valid challenge response", () => {
            const mockBody = JSON.stringify({
                continuation_token: "test-token",
                challenge_type: ChallengeType.OOB,
            });
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            const result =
                CustomAuthApiResponseHandler.handleSignInChallengeResponse(
                    response,
                    correlationId,
                );

            expect(result).toBeInstanceOf(SignInChallengeResponse);
            expect(result.continuation_token).toBe("test-token");
            expect(result.challenge_type).toBe(ChallengeType.OOB);
        });

        it("should throw if challenge type is invalid", () => {
            const mockBody = JSON.stringify({
                continuation_token: "test-token",
                challenge_type: "invalid",
            });
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            expect(() =>
                CustomAuthApiResponseHandler.handleSignInChallengeResponse(
                    response,
                    correlationId,
                ),
            ).toThrow(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                    "Challenge type invalid is not supported",
                    correlationId,
                ),
            );
        });

        it("should throw a RedirectError for REDIRECT challenge type", () => {
            const mockBody = JSON.stringify({
                continuation_token: "test-token",
                challenge_type: ChallengeType.REDIRECT,
            });
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            expect(() =>
                CustomAuthApiResponseHandler.handleSignInChallengeResponse(
                    response,
                    correlationId,
                ),
            ).toThrow(new RedirectError(correlationId));
        });
    });

    describe("handleSignInTokenResponse", () => {
        it("should handle a valid token response", () => {
            const mockBody = JSON.stringify({
                access_token: "test-access-token",
                id_token: "test-id-token",
                refresh_token: "test-refresh-token",
                token_type: "Bearer",
                expires_in: 3600,
            });
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            const result =
                CustomAuthApiResponseHandler.handleSignInTokenResponse(
                    response,
                    correlationId,
                );

            expect(result).toBeInstanceOf(SignInTokenResponse);
            expect(result.access_token).toBe("test-access-token");
            expect(result.id_token).toBe("test-id-token");
        });

        it("should throw if access_token is missing", () => {
            const mockBody = JSON.stringify({});
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            expect(() =>
                CustomAuthApiResponseHandler.handleSignInTokenResponse(
                    response,
                    correlationId,
                ),
            ).toThrow(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.ACCESS_TOKEN_MISSING,
                    "Access token is missing in the response body",
                    correlationId,
                ),
            );
        });

        it("should throw if token_type is not Bearer", () => {
            const mockBody = JSON.stringify({
                access_token: "test-access-token",
                id_token: "test-id-token",
                refresh_token: "test-refresh-token",
                expires_in: 3600,
                token_type: "InvalidType",
            });
            const response = new HttpResponseMessage(
                HttpStatusCode.OK,
                mockBody,
                {},
            );

            expect(() =>
                CustomAuthApiResponseHandler.handleSignInTokenResponse(
                    response,
                    correlationId,
                ),
            ).toThrow(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.INVALID_TOKEN_TYPE,
                    "Token type 'InvalidType' is invalid in the response body",
                    correlationId,
                ),
            );
        });
    });

    describe("error reponse handling", () => {
        const correlationId = "test-correlation-id";

        // Test Case 3: Error Response
        it("should throw if the response indicates an error", () => {
            const errorResponse: HttpResponseMessage = new HttpResponseMessage(
                HttpStatusCode.BAD_REQUEST,
                JSON.stringify({
                    error: "invalid_request",
                    error_description: "Invalid request parameters",
                    correlation_id: correlationId,
                    error_codes: [1001],
                    suberror: "invalid_user",
                    invalid_attributes: [
                        {
                            name: "displayName",
                            type: "string",
                            required: true,
                            options: {
                                regex: ".*@.**$",
                            },
                        },
                        {
                            name: "extension_2588abcdwhtfeehjjeeqwertc_age",
                            type: "string",
                            required: true,
                        },
                        {
                            name: "postalCode",
                            type: "string",
                            required: true,
                            options: {
                                regex: "^[1-9][0-9]*$",
                            },
                        },
                    ],
                    continuation_token: "test-continuation-token",
                    trace_id: "test-trace-id",
                }),
                {},
            );

            try {
                CustomAuthApiResponseHandler.handleSignInInitiateResponse(
                    errorResponse,
                    correlationId,
                );
            } catch (error) {
                expect(error).toBeInstanceOf(CustomAuthApiError);
                const apiError = error as CustomAuthApiError;
                expect(apiError.error).toBe("invalid_request");
                expect(apiError.errorDescription).toBe(
                    "Invalid request parameters",
                );
                expect(apiError.correlationId).toBe(correlationId);
                expect(apiError.errorCodes).toStrictEqual([1001]);
                expect(apiError.subError).toBe("invalid_user");
                expect(apiError.continuationToken).toBe(
                    "test-continuation-token",
                );
                expect(apiError.traceId).toBe("test-trace-id");
                expect(apiError.attributes).toStrictEqual([
                    {
                        name: "displayName",
                        type: "string",
                        required: true,
                        options: {
                            regex: ".*@.**$",
                        },
                    },
                    {
                        name: "extension_2588abcdwhtfeehjjeeqwertc_age",
                        type: "string",
                        required: true,
                    },
                    {
                        name: "postalCode",
                        type: "string",
                        required: true,
                        options: {
                            regex: "^[1-9][0-9]*$",
                        },
                    },
                ]);
            }
        });
    });
});
