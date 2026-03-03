import {
    AuthError,
    AuthErrorCodes,
    IPerformanceClient,
    Logger,
    PromptValue,
} from "@azure/msal-common/browser";
import { PlatformAuthConstants } from "../../src/utils/BrowserConstants.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { PlatformAuthDOMHandler } from "../../src/broker/nativeBroker/PlatformAuthDOMHandler.js";
import { PlatformAuthResponse } from "../../src/broker/nativeBroker/PlatformAuthResponse.js";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_URIS,
} from "../utils/StringConstants.js";
import { PlatformAuthRequest } from "../../src/broker/nativeBroker/PlatformAuthRequest.js";
import { NativeAuthError } from "../../src/error/NativeAuthError.js";

describe("PlatformAuthDOMHandler tests", () => {
    let performanceClient: IPerformanceClient;
    let logger: Logger;

    let getSupportedContractsMock: jest.Mock;
    let executeGetTokenMock: jest.Mock;
    beforeEach(() => {
        performanceClient = getDefaultPerformanceClient();
        logger = new Logger({}, "test", "1.0.0");

        getSupportedContractsMock = jest.fn();
        executeGetTokenMock = jest.fn();
        Object.defineProperty(window.navigator, "platformAuthentication", {
            value: {
                getSupportedContracts: getSupportedContractsMock,
                executeGetToken: executeGetTokenMock,
            },
            writable: true,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("createProvider tests", () => {
        it("should return PlatformAuthDOMHandler when DOM APIs are available for platform auth", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            expect(getSupportedContractsMock).toHaveBeenCalled();
            expect(platformAuthDOMHandler).toBeInstanceOf(
                PlatformAuthDOMHandler
            );
        });

        it("should return undefined when DOM APIs are not available for platform auth", async () => {
            getSupportedContractsMock.mockResolvedValue([]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            expect(getSupportedContractsMock).toHaveBeenCalled();
            expect(platformAuthDOMHandler).toBe(undefined);
        });
    });

    describe("getExtensionId tests", () => {
        it("should return the correct extension ID", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            expect(platformAuthDOMHandler).toBeInstanceOf(
                PlatformAuthDOMHandler
            );
            const brokerId = platformAuthDOMHandler?.getExtensionId();
            expect(brokerId).toBe(
                PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID
            );
        });
    });

    describe("getExtensionVersion tests", () => {
        it("should return empty string for extensionVersion", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            expect(platformAuthDOMHandler).toBeInstanceOf(
                PlatformAuthDOMHandler
            );
            const brokerId = platformAuthDOMHandler?.getExtensionVersion();
            expect(brokerId).toBe("");
        });
    });

    describe("getExtensionName tests", () => {
        it("should return corect extensionName", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            expect(platformAuthDOMHandler).toBeInstanceOf(
                PlatformAuthDOMHandler
            );
            const brokerId = platformAuthDOMHandler?.getExtensionName();
            expect(brokerId).toBe(PlatformAuthConstants.DOM_API_NAME);
        });
    });

    describe("sendMessage and validatePlatformBrokerResponse tests", () => {
        it("returns PlatformBrokerResponse success response for valid request to DOM API", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const testRequest: PlatformAuthRequest = {
                accountId: "test-id",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scope: "read openid",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                windowTitleSubstring: "",
                extraParameters: {
                    extendedExpiryToken: "true",
                },
            };
            const testDOMResponse: object = {
                isSuccess: true,
                state: "",
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                expiresIn: 6000,
                account: {
                    id: "test-id",
                    userName: "test-user",
                    properties: {},
                },
                clientInfo: "test-client-info",
                idToken: TEST_TOKENS.IDTOKEN_V1,
                scopes: "read openid",
                error: {},
                properties: {
                    MATS: '{"MATS":"{"x_ms_clitelem":"1,0,0,,I","ui_visible":true}"}',
                },
                extendedLifetimeToken: true,
            };
            const validatedResponse: PlatformAuthResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                account: {
                    id: "test-id",
                    userName: "test-user",
                    properties: {},
                },
                client_info: "test-client-info",
                expires_in: 6000,
                id_token: TEST_TOKENS.IDTOKEN_V1,
                properties: {
                    MATS: '{"MATS":"{"x_ms_clitelem":"1,0,0,,I","ui_visible":true}"}',
                },
                scope: "read openid",
                state: "",
                extendedLifetimeToken: true,
                shr: undefined,
            };
            executeGetTokenMock.mockResolvedValue(testDOMResponse);

            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            const platformBrokerResponse =
                await platformAuthDOMHandler?.sendMessage(testRequest);
            expect(platformBrokerResponse).toEqual(validatedResponse);
        });

        it("returns unexpected_error when token response is missing required properties with isSuccess = true", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const testRequest: PlatformAuthRequest = {
                accountId: "test-id",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scope: "read openid",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                windowTitleSubstring: "",
                extraParameters: {
                    extendedExpiryToken: "true",
                },
            };
            const testDOMResponse: object = {
                isSuccess: true,
                state: "",
                expiresIn: 6000,
                account: {
                    id: "test-id",
                    userName: "test-user",
                    properties: {},
                },
                clientInfo: "test-client-info",
                scopes: "read openid",
                error: {},
                properties: {
                    MATS: '{"MATS":"{"x_ms_clitelem":"1,0,0,,I","ui_visible":true}"}',
                },
                extendedLifetimeToken: true,
            };

            executeGetTokenMock.mockResolvedValue(testDOMResponse);

            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            try {
                const platformBrokerResponse =
                    await platformAuthDOMHandler?.sendMessage(testRequest);
                throw "sendMessage should have thrown an error";
            } catch (e) {
                expect(e).toBeInstanceOf(AuthError);
                expect((e as AuthError).errorCode).toEqual(
                    AuthErrorCodes.unexpectedError
                );
                expect((e as AuthError).errorMessage).toContain(
                    "Response missing expected properties."
                );
            }
        });

        it("returns unexpected_error when required error properties missing from response with isSuccess = false", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const testRequest: PlatformAuthRequest = {
                accountId: "test-id",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scope: "read openid",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                windowTitleSubstring: "",
                extraParameters: {
                    extendedExpiryToken: "true",
                },
            };
            const testDOMResponse: object = {
                isSuccess: false,
                expiresIn: 0,
                extendedLifetimeToken: false,
                error: {},
            };

            executeGetTokenMock.mockResolvedValue(testDOMResponse);

            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            try {
                const platformBrokerResponse =
                    await platformAuthDOMHandler?.sendMessage(testRequest);
                throw "sendMessage should have thrown an error";
            } catch (e) {
                expect(e).toBeInstanceOf(AuthError);
                expect((e as AuthError).errorCode).toEqual(
                    AuthErrorCodes.unexpectedError
                );
                expect((e as AuthError).errorMessage).toContain(
                    "Response missing expected properties."
                );
            }
        });

        it("returns nativeAuthError response for unsuccessful token request", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const testRequest: PlatformAuthRequest = {
                accountId: "test-id",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scope: "read openid",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                windowTitleSubstring: "",
                extraParameters: {
                    extendedExpiryToken: "true",
                },
            };
            const testDOMResponse: object = {
                isSuccess: false,
                expiresIn: 0,
                extendedLifetimeToken: false,
                error: {
                    code: "OSError",
                    description: "there is an OSError",
                    errorCode: "-6000",
                    protocolError: "-5000",
                    status: "PERSISTENT_ERROR",
                    properties: {},
                },
            };
            executeGetTokenMock.mockResolvedValue(testDOMResponse);

            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            try {
                const platformBrokerResponse =
                    await platformAuthDOMHandler?.sendMessage(testRequest);
                throw "sendMessage should have thrown an error";
            } catch (e) {
                expect(e).toBeInstanceOf(NativeAuthError);
                expect((e as NativeAuthError).errorCode).toEqual("OSError");
                expect((e as NativeAuthError).errorMessage).toEqual(
                    (testDOMResponse as any).error.description
                );
            }
        });
    });

    describe("initializePlatformDOMRequest tests", () => {
        it("should return a valid PlatformDOMTokenRequest object", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);

            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            const testRequest: PlatformAuthRequest = {
                accountId: "test-id",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scope: "read openid",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                windowTitleSubstring: "test-window-substring",
                prompt: "login",
                nonce: "test-nonce",
                claims: "test-claims",
                extendedExpiryToken: true,
            };
            const platformDOMRequest =
                //@ts-ignore
                platformAuthDOMHandler.initializePlatformDOMRequest(
                    testRequest
                );
            expect(platformDOMRequest).toEqual({
                accountId: testRequest.accountId,
                brokerId: PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID,
                authority: testRequest.authority,
                clientId: testRequest.clientId,
                correlationId: testRequest.correlationId,
                isSecurityTokenService: false,
                extraParameters: {
                    windowTitleSubstring: "test-window-substring",
                    extendedExpiryToken: "true",
                    prompt: "login",
                    nonce: "test-nonce",
                    claims: "test-claims",
                },
                redirectUri: testRequest.redirectUri,
                scope: testRequest.scope,
                state: undefined,
                storeInCache: undefined,
                embeddedClientId: undefined,
            });
        });

        it("returned DOM request object should include user input extra parameters", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            const testRequest: PlatformAuthRequest = {
                accountId: "test-id",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scope: "read openid",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                windowTitleSubstring: "test-window-substring",
                prompt: "login",
                nonce: "test-nonce",
                claims: "test-claims",
                extendedExpiryToken: true,
                extraParameters: {
                    customUserInput1: "test-user-input1",
                    customUserInput2: "test-user-input2",
                },
            };
            const platformDOMRequest =
                //@ts-ignore
                platformAuthDOMHandler.initializePlatformDOMRequest(
                    testRequest
                );
            expect(platformDOMRequest).toEqual({
                accountId: testRequest.accountId,
                brokerId: PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID,
                authority: testRequest.authority,
                clientId: testRequest.clientId,
                correlationId: testRequest.correlationId,
                isSecurityTokenService: false,
                extraParameters: {
                    windowTitleSubstring: "test-window-substring",
                    extendedExpiryToken: "true",
                    prompt: "login",
                    nonce: "test-nonce",
                    claims: "test-claims",
                    customUserInput1: "test-user-input1",
                    customUserInput2: "test-user-input2",
                },
                redirectUri: testRequest.redirectUri,
                scope: testRequest.scope,
                state: undefined,
                storeInCache: undefined,
                embeddedClientId: undefined,
            });
        });
    });

    describe("validatePlatformBrokerResponse tests", () => {
        it("should return a valid PlatformBrokerResponse object", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            const testResponse: object = {
                isSuccess: true,
                state: "",
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                expiresIn: 6000,
                account: {
                    id: "test-id",
                    userName: "test-user",
                    properties: {},
                },
                clientInfo: "test-client-info",
                idToken: TEST_TOKENS.IDTOKEN_V1,
                scopes: "read openid",
                error: {},
                properties: {
                    MATS: '{"MATS":"{"x_ms_clitelem":"1,0,0,,I","ui_visible":true}"}',
                },
                extendedLifetimeToken: true,
            };
            const validatedResponse =
                //@ts-ignore
                platformAuthDOMHandler.validatePlatformBrokerResponse(
                    testResponse
                );
            expect(validatedResponse).toEqual({
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                account: {
                    id: "test-id",
                    userName: "test-user",
                    properties: {},
                },
                client_info: "test-client-info",
                expires_in: 6000,
                id_token: TEST_TOKENS.IDTOKEN_V1,
                properties: {
                    MATS: '{"MATS":"{"x_ms_clitelem":"1,0,0,,I","ui_visible":true}"}',
                },
                scope: "read openid",
                state: "",
                extendedLifetimeToken: true,
            });
        });
    });

    describe("getDOMExtraParams tests", () => {
        it("should return a valid DOMExtraParameters object", async () => {
            getSupportedContractsMock.mockResolvedValue([
                PlatformAuthConstants.PLATFORM_DOM_APIS,
            ]);
            const platformAuthDOMHandler =
                await PlatformAuthDOMHandler.createProvider(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            const testExtraParameters = {
                prompt: PromptValue.NONE,
                nonce: "test-nonce",
                claims: "test-claims",
                instanceAware: true,
                windowTitleSubstring: null,
                extendedExpiryToken: true,
                signPopToken: true,
                account: {
                    nativeAccountId: "native-test-id",
                    userName: "test-user",
                    name: "Test User",
                    username: "testest@test.com",
                },
            };
            const domExtraParams =
                //@ts-ignore
                platformAuthDOMHandler.getDOMExtraParams(testExtraParameters);
            expect(domExtraParams).toEqual({
                prompt: "none",
                nonce: "test-nonce",
                claims: "test-claims",
                instanceAware: "true",
                windowTitleSubstring: "null",
                extendedExpiryToken: "true",
                signPopToken: "true",
                account: JSON.stringify(testExtraParameters.account),
            });
        });
    });
});
