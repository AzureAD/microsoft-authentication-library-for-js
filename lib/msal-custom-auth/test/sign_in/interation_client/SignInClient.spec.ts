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
import { SignInClient } from "../../../src/sign_in/interaction_client/SignInClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../src/core/CustomAuthAuthority.js";
import { ChallengeType } from "../../../src/CustomAuthConstants.js";
import {
    SignInCodeSendResult,
    SignInCompletedResult,
    SignInPasswordRequiredResult,
} from "../../../src/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInScenario } from "../../../src/sign_in/auth_flow/SignInScenario.js";

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

    // Set up the prototype or instance methods/properties
    const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
        signInApi: signInApiClient,
        signUpApi: signUpApiClient,
        resetPasswordApi: resetPasswordApiClient,
    }));

    const mockedApiClient = new CustomAuthApiClient();
    return { mockedApiClient, signInApiClient, signUpApiClient, resetPasswordApiClient };
});

describe("SignInClient", () => {
    let client: SignInClient;
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

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            customAuthConfig.customAuth.authApiProxyUrl,
        );

        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        mockLogger.clone.mockReturnValue(mockLogger);

        client = new SignInClient(
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
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result).toBeInstanceOf(SignInCodeSendResult);

            const codeSendResult = result as SignInCodeSendResult;
            expect(codeSendResult.correlationId).toBe("corr123");
            expect(codeSendResult.continuationToken).toBe("continuation_token_2");
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
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result).toBeInstanceOf(SignInPasswordRequiredResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });
    });

    describe("submitCode", () => {
        it("should return SignInCompleteResult for valid code", async () => {
            signInApiClient.requestTokensWithOob.mockResolvedValue({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            });

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result).toBeInstanceOf(SignInCompletedResult);
            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe("test-access-token");
            expect(result.authenticationResult.refreshToken).toBe("test-refresh-token");
            expect(result.authenticationResult.idToken).toBe("test-id-token");
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe("Bearer");
            expect(result.authenticationResult.authority).toBe(authority.authorityUrl.href);
            expect(result.authenticationResult.tenantId).toBe(authority.getTenant());
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe("abc@abc.com");
        });
    });

    describe("submitPassword", () => {
        it("should return SignInCompleteResult for valid password", async () => {
            signInApiClient.requestTokensWithPassword.mockResolvedValue({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            });

            const result = await client.submitPassword({
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result).toBeInstanceOf(SignInCompletedResult);
            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe("test-access-token");
            expect(result.authenticationResult.refreshToken).toBe("test-refresh-token");
            expect(result.authenticationResult.idToken).toBe("test-id-token");
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe("Bearer");
            expect(result.authenticationResult.authority).toBe(authority.authorityUrl.href);
            expect(result.authenticationResult.tenantId).toBe(authority.getTenant());
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe("abc@abc.com");
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
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result).toBeInstanceOf(SignInCodeSendResult);
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
            expect(result.codeLength).toBe(6);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("email");
        });
    });

    describe("signInWithContinuationToken", () => {
        it("should return SignInCompleteResult", async () => {
            signInApiClient.signInWithContinuationToken.mockResolvedValue({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            });

            const result = await client.signInWithContinuationToken({
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD, ChallengeType.REDIRECT],
                correlationId: "corr123",
                scopes: [],
                signInScenario: SignInScenario.SignInAfterSignUp,
            });

            expect(result).toBeInstanceOf(SignInCompletedResult);
            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe("test-access-token");
            expect(result.authenticationResult.refreshToken).toBe("test-refresh-token");
            expect(result.authenticationResult.idToken).toBe("test-id-token");
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe("Bearer");
            expect(result.authenticationResult.authority).toBe(authority.authorityUrl.href);
            expect(result.authenticationResult.tenantId).toBe(authority.getTenant());
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe("abc@abc.com");
        });
    });
});
