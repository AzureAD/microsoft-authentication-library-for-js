import {
    BrowserCacheManager,
    BrowserConfiguration,
    EventHandler,
    ICrypto,
    INavigationClient,
    INetworkModule,
    IPerformanceClient,
    Logger,
} from "@azure/msal-browser";
import { SignUpClient } from "../../../src/sign_up/interaction_client/SignUpClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../src/core/CustomAuthAuthority.js";
import { ChallengeType } from "../../../src/CustomAuthConstants.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "../../../src/sign_up/interaction_client/result/SignUpActionResult.js";
import { CustomAuthApiError } from "../../../src/index.js";
import { CustomAuthApiErrorCode } from "../../../src/core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

jest.mock("../../../src/core/network_client/custom_auth_api/CustomAuthApiClient.js", () => {
    let signInApiClient = {
        initiate: jest.fn(),
        requestChallenge: jest.fn(),
        requestTokensWithPassword: jest.fn(),
        requestTokensWithOob: jest.fn(),
        signInWithContinuationToken: jest.fn(),
    };
    let signUpApiClient = {
        start: jest.fn(),
        requestChallenge: jest.fn(),
        continueWithCode: jest.fn(),
        continueWithPassword: jest.fn(),
        continueWithAttributes: jest.fn(),
    };
    let resetPasswordApiClient = {
        start: jest.fn(),
        requestChallenge: jest.fn(),
        continueWithCode: jest.fn(),
        submitNewPassword: jest.fn(),
        pollCompletion: jest.fn(),
    };

    const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
        signInApi: signInApiClient,
        signUpApi: signUpApiClient,
        resetPasswordApi: resetPasswordApiClient,
    }));

    const mockedApiClient = new CustomAuthApiClient();
    return { mockedApiClient, signInApiClient, signUpApiClient, resetPasswordApiClient };
});

describe("SignUpClient", () => {
    let client: SignUpClient;
    let authority: CustomAuthAuthority;
    const { mockedApiClient, signInApiClient, signUpApiClient, resetPasswordApiClient } = jest.requireMock(
        "../../../src/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    );
    beforeEach(() => {
        jest.resetAllMocks();
        const mockBrowserConfiguration = {
            system: {
                networkClient: {
                    sendGetRequestAsync: jest.fn(),
                    sendPostRequestAsync: jest.fn(),
                } as unknown as jest.Mocked<INetworkModule>,
            },
            auth: {
                clientId: customAuthConfig.auth.clientId,
            },
        } as unknown as jest.Mocked<BrowserConfiguration>;

        const mockCacheManager = {
            getWrapperMetadata: jest.fn(),
            getServerTelemetry: jest.fn(),
        } as unknown as jest.Mocked<BrowserCacheManager>;
        mockCacheManager.getWrapperMetadata.mockReturnValue(["", ""]);
        mockCacheManager.getServerTelemetry.mockReturnValue(null);

        const mockCrypto = {
            createNewGuid: jest.fn(),
        } as unknown as jest.Mocked<ICrypto>;

        const mockEventHandler = {} as unknown as jest.Mocked<EventHandler>;
        const mockNavigationClient = {} as unknown as jest.Mocked<INavigationClient>;
        const mockPerformanceClient = {} as unknown as jest.Mocked<IPerformanceClient>;

        authority = new CustomAuthAuthority(customAuthConfig.auth.authority ?? "", customAuthConfig.customAuth.authApiProxyUrl);

        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        mockLogger.clone.mockReturnValue(mockLogger);

        client = new SignUpClient(
            mockBrowserConfiguration,
            mockCacheManager,
            mockCrypto,
            mockLogger,
            mockEventHandler,
            mockNavigationClient,
            mockPerformanceClient,
            mockedApiClient,
            authority,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("start", () => {
        it("should return SignUpCodeRequiredResult when challenge type is OOB", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
            });

            const result = await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCodeRequiredResult);
            const codeSendResult = result as SignUpCodeRequiredResult;
            expect(codeSendResult.correlationId).toBe("corr123");
            expect(codeSendResult.continuationToken).toBe("continuation_token_2");
            expect(codeSendResult.codeLength).toBe(6);
            expect(codeSendResult.challengeChannel).toBe("email");
            expect(codeSendResult.challengeTargetLabel).toBe("email");
        });

        it("should return SignUpPasswordRequiredResult when challenge type is PASSWORD", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const result = await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpPasswordRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });
    });

    describe("submitCode", () => {
        it("should return SignUpCompletedResult for valid code", async () => {
            signUpApiClient.continueWithCode.mockResolvedValue({
                continuation_token: "continuation_token_2",
            });

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCompletedResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });

        it("should return SignUpPasswordRequiredResult if password is required", async () => {
            signUpApiClient.continueWithCode.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                    "Password required",
                    "corr123",
                    [55103],
                    undefined,
                    undefined,
                    "continuation_token_1",
                ),
            );

            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpPasswordRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");

            expect(signUpApiClient.requestChallenge).toHaveBeenCalledWith(
                expect.objectContaining({
                    correlationId: "corr123",
                    continuation_token: "continuation_token_1",
                }),
            );
        });

        it("should throw error if credential is required but challenge type password isn't supported", async () => {
            signUpApiClient.continueWithCode.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                    "Password required",
                    "corr123",
                    [55103],
                    undefined,
                    undefined,
                    "continuation_token_1",
                ),
            );

            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: "passkey",
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            await expect(
                client.submitCode({
                    code: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                    correlationId: "corr123",
                }),
            ).rejects.toMatchObject({
                error: CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                errorDescription: "Unsupported challenge type 'passkey'.",
                correlationId: "corr123",
            });

            expect(signUpApiClient.requestChallenge).toHaveBeenCalledWith(
                expect.objectContaining({
                    correlationId: "corr123",
                    continuation_token: "continuation_token_1",
                }),
            );
        });

        it("should return SignUpAttributesRequiredResult if attributes are required", async () => {
            signUpApiClient.continueWithCode.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED,
                    "User attributes required",
                    "corr123",
                    [55106],
                    undefined,
                    [
                        {
                            name: "name",
                            type: "string",
                        },
                    ],
                    "continuation_token_1",
                ),
            );

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpAttributesRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_1");
        });
    });

    describe("submitPassword", () => {
        it("should return SignUpCompletedResult for valid password", async () => {
            signUpApiClient.continueWithPassword.mockResolvedValue({
                continuation_token: "continuation_token_2",
            });

            const result = await client.submitPassword({
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCompletedResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });

        it("should return SignUpCodeRequiredResult if oob is required", async () => {
            signUpApiClient.continueWithPassword.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                    "credential required",
                    "corr123",
                    [55103],
                    undefined,
                    undefined,
                    "continuation_token_1",
                ),
            );

            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
            });

            const result = await client.submitPassword({
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCodeRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");

            expect(signUpApiClient.requestChallenge).toHaveBeenCalledWith(
                expect.objectContaining({
                    correlationId: "corr123",
                    continuation_token: "continuation_token_1",
                }),
            );
        });

        it("should return SignUpAttributesRequiredResult if attributes are required", async () => {
            signUpApiClient.continueWithPassword.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED,
                    "User attributes required",
                    "corr123",
                    [55106],
                    undefined,
                    [
                        {
                            name: "name",
                            type: "string",
                        },
                    ],
                    "continuation_token_1",
                ),
            );

            const result = await client.submitPassword({
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpAttributesRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_1");
        });
    });

    describe("submitAttributes", () => {
        it("should return SignUpCompletedResult for valid password", async () => {
            signUpApiClient.continueWithAttributes.mockResolvedValue({
                continuation_token: "continuation_token_2",
            });

            const result = await client.submitAttributes({
                attributes: { name: "John Doe" },
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCompletedResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });

        it("should return SignUpCodeRequiredResult if oob is required", async () => {
            signUpApiClient.continueWithAttributes.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                    "credential required",
                    "corr123",
                    [55103],
                    undefined,
                    undefined,
                    "continuation_token_1",
                ),
            );

            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                target_challenge_label: "email",
            });

            const result = await client.submitAttributes({
                attributes: { name: "John Doe" },
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCodeRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");

            expect(signUpApiClient.requestChallenge).toHaveBeenCalledWith(
                expect.objectContaining({
                    correlationId: "corr123",
                    continuation_token: "continuation_token_1",
                }),
            );
        });

        it("should return SignUpPasswordRequiredResult if password is required", async () => {
            signUpApiClient.continueWithAttributes.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                    "Password required",
                    "corr123",
                    [55103],
                    undefined,
                    undefined,
                    "continuation_token_1",
                ),
            );

            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const result = await client.submitAttributes({
                attributes: { name: "John Doe" },
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpPasswordRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");

            expect(signUpApiClient.requestChallenge).toHaveBeenCalledWith(
                expect.objectContaining({
                    correlationId: "corr123",
                    continuation_token: "continuation_token_1",
                }),
            );
        });

        it("should throw error if some required attributes are missing", async () => {
            signUpApiClient.continueWithAttributes.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED,
                    "User attributes required",
                    "corr123",
                    [55106],
                    undefined,
                    [
                        {
                            name: "name",
                            type: "string",
                        },
                    ],
                    "continuation_token_1",
                ),
            );

            await expect(
                client.submitAttributes({
                    attributes: { name: "John Doe" },
                    continuationToken: "continuation_token_1",
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                    correlationId: "corr123",
                }),
            ).rejects.toMatchObject({
                error: CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED,
                errorDescription: "User attributes required",
                correlationId: "corr123",
                errorCodes: [],
                subError: "",
                attributes: [
                    {
                        name: "name",
                        type: "string",
                    },
                ],
                continuationToken: "continuation_token_1",
            });
        });
    });

    describe("resendCode", () => {
        it("should return SignUpCodeRequiredResult", async () => {
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
            });

            const result = await client.resendCode({
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
            });

            expect(result).toBeInstanceOf(SignUpCodeRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
            expect(result.codeLength).toBe(6);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("email");
        });
    });
});
