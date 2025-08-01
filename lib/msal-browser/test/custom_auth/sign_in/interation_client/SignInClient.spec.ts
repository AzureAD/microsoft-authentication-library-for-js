import { SignInClient } from "../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { ChallengeType } from "../../../../src/custom_auth/CustomAuthConstants.js";
import {
    SIGN_IN_CODE_SEND_RESULT_TYPE,
    SIGN_IN_COMPLETED_RESULT_TYPE,
    SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE,
    SignInCodeSendResult,
} from "../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInScenario } from "../../../../src/custom_auth/sign_in/auth_flow/SignInScenario.js";
import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { buildConfiguration } from "../../../../src/config/Configuration.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../test_resources/TestModules.js";
import {
    TestServerTokenResponse,
    TestTenantId,
} from "../../test_resources/TestConstants.js";
import {
    SignInContinuationTokenParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
} from "../../../../src/custom_auth/sign_in/interaction_client/parameter/SignInParams.js";

jest.mock(
    "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        let signInApiClient = {
            initiate: jest.fn(),
            requestChallenge: jest.fn(),
            requestTokensWithPassword: jest.fn(),
            requestTokensWithOob: jest.fn(),
            requestTokenWithContinuationToken: jest.fn(),
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

        // Set up the prototype or instance methods/properties
        const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
            signInApi: signInApiClient,
            signUpApi: signUpApiClient,
            resetPasswordApi: resetPasswordApiClient,
        }));

        const mockedApiClient = new CustomAuthApiClient();
        return {
            mockedApiClient,
            signInApiClient,
            signUpApiClient,
            resetPasswordApiClient,
        };
    }
);

describe("SignInClient", () => {
    let client: SignInClient;
    let authority: CustomAuthAuthority;
    const { mockedApiClient, signInApiClient } = jest.requireMock(
        "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
    );

    beforeEach(() => {
        const clientId = customAuthConfig.auth.clientId;
        const mockBrowserConfiguration = buildConfiguration(
            { auth: { clientId: clientId } },
            false
        );
        const mockLogger = getDefaultLogger();
        const mockPerformanceClient = getDefaultPerformanceClient(clientId);
        const mockEventHandler = getDefaultEventHandler();
        const mockCrypto = getDefaultCrypto(
            clientId,
            mockLogger,
            mockPerformanceClient
        );
        const mockCacheManager = getDefaultBrowserCacheManager(
            clientId,
            mockLogger,
            mockPerformanceClient,
            mockEventHandler,
            undefined,
            mockBrowserConfiguration.cache
        );

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfiguration,
            StubbedNetworkModule,
            mockCacheManager,
            mockLogger,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        client = new SignInClient(
            mockBrowserConfiguration,
            mockCacheManager,
            mockCrypto,
            mockLogger,
            mockEventHandler,
            getDefaultNavigationClient(),
            mockPerformanceClient,
            mockedApiClient,
            authority
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("start", () => {
        it("should return SignInCodeSendResult when challenge type is OOB", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
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
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.type === SIGN_IN_CODE_SEND_RESULT_TYPE).toBeTruthy();

            const codeSendResult = result as SignInCodeSendResult;
            expect(codeSendResult.correlationId).toBe("corr123");
            expect(codeSendResult.continuationToken).toBe(
                "continuation_token_2"
            );
            expect(codeSendResult.codeLength).toBe(6);
            expect(codeSendResult.challengeChannel).toBe("email");
            expect(codeSendResult.challengeTargetLabel).toBe("email");
        });

        it("should return SignInContinuationTokenResult when challenge type is PASSWORD", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const result = await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.type).toStrictEqual(
                SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE
            );
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });
    });

    describe("submitCode", () => {
        let signInSubmitCodeParams: SignInSubmitCodeParams;

        beforeEach(() => {
            signInApiClient.requestTokensWithOob.mockResolvedValue(
                TestServerTokenResponse
            );

            signInSubmitCodeParams = {
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            };
        });

        it("should return SignInCompleteResult for valid code", async () => {
            const result = await client.submitCode(signInSubmitCodeParams);

            expect(result.type).toStrictEqual(SIGN_IN_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe(
                TestServerTokenResponse.access_token
            );
            expect(result.authenticationResult.idToken).toBe(
                TestServerTokenResponse.id_token
            );
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe(
                TestServerTokenResponse.token_type
            );
            expect(result.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(result.authenticationResult.tenantId).toBe(TestTenantId);
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe(
                "abc@test.com"
            );
        });

        it("should include claims in password token request", async () => {
            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            signInSubmitCodeParams.claims = claims;
            await client.submitCode(signInSubmitCodeParams);

            // Verify that the API was called with claims
            expect(signInApiClient.requestTokensWithOob).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });
    });

    describe("submitPassword", () => {
        let signInSubmitPasswordParams: SignInSubmitPasswordParams;

        beforeEach(() => {
            signInApiClient.requestTokensWithPassword.mockResolvedValue(
                TestServerTokenResponse
            );

            signInSubmitPasswordParams = {
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            };
        });

        it("should return SignInCompleteResult for valid password", async () => {
            const result = await client.submitPassword(
                signInSubmitPasswordParams
            );

            expect(result.type).toStrictEqual(SIGN_IN_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe(
                TestServerTokenResponse.access_token
            );
            expect(result.authenticationResult.idToken).toBe(
                TestServerTokenResponse.id_token
            );
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe(
                TestServerTokenResponse.token_type
            );
            expect(result.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(result.authenticationResult.tenantId).toBe(TestTenantId);
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe(
                "abc@test.com"
            );
        });

        it("should include claims in password token request", async () => {
            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            signInSubmitPasswordParams.claims = claims;
            await client.submitPassword(signInSubmitPasswordParams);

            // Verify that the API was called with claims
            expect(
                signInApiClient.requestTokensWithPassword
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });
    });

    describe("resendCode", () => {
        it("should return SignInCodeSendResult", async () => {
            signInApiClient.requestChallenge.mockResolvedValue({
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
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
            expect(result.codeLength).toBe(6);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("email");
        });
    });

    describe("signInWithContinuationToken", () => {
        let signInContinuationTokenParams: SignInContinuationTokenParams;

        beforeEach(() => {
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                TestServerTokenResponse
            );

            signInContinuationTokenParams = {
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
                signInScenario: SignInScenario.SignInAfterSignUp,
            };
        });

        it("should return SignInCompleteResult", async () => {
            const result = await client.signInWithContinuationToken(
                signInContinuationTokenParams
            );

            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe(
                TestServerTokenResponse.access_token
            );
            expect(result.authenticationResult.idToken).toBe(
                TestServerTokenResponse.id_token
            );
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe(
                TestServerTokenResponse.token_type
            );
            expect(result.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(result.authenticationResult.tenantId).toBe(TestTenantId);
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe(
                "abc@test.com"
            );
        });

        it("should include claims in password token request", async () => {
            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            signInContinuationTokenParams.claims = claims;
            await client.signInWithContinuationToken(
                signInContinuationTokenParams
            );

            // Verify that the API was called with claims
            expect(
                signInApiClient.requestTokenWithContinuationToken
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });
    });

    describe("capabilities handling", () => {
        it("should include capabilities in start request when provided in parameters", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });

            await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.PASSWORD],
                correlationId: "corr123",
                capabilities: ["mfa_required", "registration_required"],
            });

            // Verify that the API was called with capabilities
            expect(signInApiClient.initiate).toHaveBeenCalledWith(
                expect.objectContaining({
                    capabilities: "mfa_required registration_required",
                })
            );
        });

        it("should not include capabilities in start request when not provided", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });

            await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.PASSWORD],
                correlationId: "corr123",
            });

            // Verify that the API was called without capabilities
            expect(signInApiClient.initiate).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    capabilities: expect.anything(),
                })
            );
        });

        it("should not include capabilities when empty array is provided", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });

            await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.PASSWORD],
                correlationId: "corr123",
                capabilities: [],
            });

            // Verify that the API was called without capabilities
            expect(signInApiClient.initiate).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    capabilities: expect.anything(),
                })
            );
        });

        it("should format single capability correctly", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });

            await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.PASSWORD],
                correlationId: "corr123",
                capabilities: ["mfa_required"],
            });

            // Verify that the API was called with single capability
            expect(signInApiClient.initiate).toHaveBeenCalledWith(
                expect.objectContaining({
                    capabilities: "mfa_required",
                })
            );
        });
    });
});
