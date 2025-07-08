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
import {
    ICrypto,
    INetworkModule,
    IPerformanceClient,
    Logger,
} from "@azure/msal-common/browser";
import { BrowserConfiguration } from "../../../../src/config/Configuration.js";
import { BrowserCacheManager } from "../../../../src/cache/BrowserCacheManager.js";
import { EventHandler } from "../../../../src/event/EventHandler.js";
import { INavigationClient } from "../../../../src/navigation/INavigationClient.js";

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
    const {
        mockedApiClient,
        signInApiClient,
        signUpApiClient,
        resetPasswordApiClient,
    } = jest.requireMock(
        "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
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
            generateAuthorityMetadataCacheKey: jest.fn(),
            setAuthorityMetadata: jest.fn(),
        } as unknown as jest.Mocked<BrowserCacheManager>;
        mockCacheManager.getWrapperMetadata.mockReturnValue(["", ""]);
        mockCacheManager.getServerTelemetry.mockReturnValue(null);
        const mockNetworkModule = {} as unknown as jest.Mocked<INetworkModule>;

        const mockCrypto = {
            createNewGuid: jest.fn(),
        } as unknown as jest.Mocked<ICrypto>;

        const mockEventHandler = {} as unknown as jest.Mocked<EventHandler>;
        const mockNavigationClient =
            {} as unknown as jest.Mocked<INavigationClient>;
        const mockPerformanceClient =
            {} as unknown as jest.Mocked<IPerformanceClient>;

        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
            errorPii: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        mockLogger.clone.mockReturnValue(mockLogger);

        const mockConfig = {
            auth: {
                OIDCOptions: {},
                knownAuthorities: [],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
            },
            system: {
                protocolMode: "",
            },
        } as unknown as jest.Mocked<BrowserConfiguration>;

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockConfig,
            mockNetworkModule,
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
            mockNavigationClient,
            mockPerformanceClient,
            mockedApiClient,
            authority
        );

        (client as any).tokenResponseHandler = {
            handleServerTokenResponse: jest.fn().mockResolvedValue({
                uniqueId: "test-unique-id",
                tenantId: "test-tenant-id",
                scopes: ["test-scope"],
                account: {
                    homeAccountId: "test-home-account-id",
                    environment: "test-environment",
                    tenantId: "test-tenant-id",
                    username: "abc@abc.com",
                },
                idToken: "test-id-token",
                idTokenClaims: {},
                accessToken: "test-access-token",
                refreshToken: "test-refresh-token",
                expiresOn: new Date(),
                extExpiresOn: new Date(),
                tokenType: "Bearer",
                authority:
                    "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/",
            }),
        } as any;
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
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result.type).toStrictEqual(SIGN_IN_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe(
                "test-access-token"
            );
            expect(result.authenticationResult.idToken).toBe("test-id-token");
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe("Bearer");
            expect(result.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(result.authenticationResult.tenantId).toBe("test-tenant-id");
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe(
                "abc@abc.com"
            );
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
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result.type).toStrictEqual(SIGN_IN_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe(
                "test-access-token"
            );
            expect(result.authenticationResult.idToken).toBe("test-id-token");
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe("Bearer");
            expect(result.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(result.authenticationResult.tenantId).toBe("test-tenant-id");
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe(
                "abc@abc.com"
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
        it("should return SignInCompleteResult", async () => {
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                {
                    correlation_id: "test-correlation-id",
                    access_token: "test-access-token",
                    refresh_token: "test-refresh-token",
                    id_token: "test-id-token",
                    expires_in: 3600,
                    token_type: "Bearer",
                }
            );

            const result = await client.signInWithContinuationToken({
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
                signInScenario: SignInScenario.SignInAfterSignUp,
            });

            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.authenticationResult).toBeDefined();
            expect(result.authenticationResult.accessToken).toBe(
                "test-access-token"
            );
            expect(result.authenticationResult.idToken).toBe("test-id-token");
            expect(result.authenticationResult.expiresOn).toBeDefined();
            expect(result.authenticationResult.tokenType).toBe("Bearer");
            expect(result.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(result.authenticationResult.tenantId).toBe("test-tenant-id");
            expect(result.authenticationResult.account).toBeDefined();
            expect(result.authenticationResult.account.username).toBe(
                "abc@abc.com"
            );
        });
    });
});
