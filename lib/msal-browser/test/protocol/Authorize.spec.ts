import {
    AADServerParamKeys,
    Authority,
    AuthorityFactory,
    AuthorityOptions,
    ClientAuthError,
    ClientAuthErrorCodes,
    CommonAuthorizationUrlRequest,
    InteractionRequiredAuthError,
    Logger,
    OAuthResponseType,
    ProtocolMode,
    ResponseMode,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import * as Authorize from "../../src/protocol/Authorize.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import {
    generateValidEarJWE,
    ID_TOKEN_CLAIMS,
    getTestAuthenticationResult,
    TEST_CONFIG,
    TEST_STATE_VALUES,
    validEarJWE,
    validEarJWK,
} from "../utils/StringConstants.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { ApiId, BrowserConstants } from "../../src/utils/BrowserConstants.js";
import { version } from "../../src/packageMetadata.js";
import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler.js";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient.js";

describe("Authorize Protocol Tests", () => {
    describe("EAR Protocol Tests", () => {
        const config = buildConfiguration(
            { auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID } },
            true
        );
        const logger = new Logger({});
        const performanceClient = new StubPerformanceClient();
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.EAR,
            knownAuthorities: [],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        const eventHandler = new EventHandler();
        const cacheManager = new BrowserCacheManager(
            TEST_CONFIG.MSAL_CLIENT_ID,
            config.cache,
            new CryptoOps(logger, performanceClient),
            logger,
            performanceClient,
            eventHandler
        );
        let authority: Authority;
        const validRequest: CommonAuthorizationUrlRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: ["openid", "profile", "offline_access"],
            correlationId: TEST_CONFIG.CORRELATION_ID,
            redirectUri: window.location.href,
            state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
            nonce: ID_TOKEN_CLAIMS.nonce,
            responseMode: ResponseMode.FRAGMENT,
            earJwk: validEarJWK,
            extraQueryParameters: {
                extraKey1: "extraVal1",
                extraKey2: "extraVal2",
            },
        };

        beforeAll(async () => {
            jest.useFakeTimers();
            authority = await AuthorityFactory.createDiscoveredInstance(
                TEST_CONFIG.validAuthority,
                config.system.networkClient,
                cacheManager,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                performanceClient
            );
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        describe("getEARForm tests", () => {
            it("Throws if earJwk is empty", async () => {
                const { earJwk, ...request }: CommonAuthorizationUrlRequest =
                    validRequest;

                try {
                    await Authorize.getEARForm(
                        document,
                        config,
                        authority,
                        request,
                        logger,
                        performanceClient
                    );
                    throw "Unexpected! Should throw";
                } catch (e) {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect((e as BrowserAuthError).errorCode).toBe(
                        BrowserAuthErrorCodes.earJwkEmpty
                    );
                }
            });

            it("Returns HTMLFormElement", async () => {
                const form = await Authorize.getEARForm(
                    document,
                    config,
                    authority,
                    validRequest,
                    logger,
                    performanceClient
                );
                const checkInputProperties = (
                    key: string,
                    expectedValue: string
                ): void => {
                    expect(
                        (form.elements.namedItem(key) as HTMLInputElement).value
                    ).toEqual(expectedValue);
                    expect(
                        (form.elements.namedItem(key) as HTMLInputElement)
                            .hidden
                    ).toEqual(true);
                };
                checkInputProperties(
                    AADServerParamKeys.CLIENT_ID,
                    TEST_CONFIG.MSAL_CLIENT_ID
                );
                checkInputProperties(
                    AADServerParamKeys.REDIRECT_URI,
                    validRequest.redirectUri
                );
                checkInputProperties(
                    AADServerParamKeys.SCOPE,
                    validRequest.scopes.join(" ")
                );
                checkInputProperties(
                    AADServerParamKeys.CLIENT_REQUEST_ID,
                    validRequest.correlationId
                );
                checkInputProperties(
                    AADServerParamKeys.STATE,
                    validRequest.state
                );
                checkInputProperties(
                    AADServerParamKeys.NONCE,
                    validRequest.nonce
                );
                checkInputProperties(
                    AADServerParamKeys.RESPONSE_MODE,
                    validRequest.responseMode
                );
                checkInputProperties(
                    AADServerParamKeys.RESPONSE_TYPE,
                    OAuthResponseType.IDTOKEN_TOKEN_REFRESHTOKEN
                );
                checkInputProperties(
                    AADServerParamKeys.EAR_JWK,
                    validRequest.earJwk!
                );
                checkInputProperties(
                    AADServerParamKeys.EAR_JWE_CRYPTO,
                    "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0"
                );
                checkInputProperties(
                    AADServerParamKeys.X_CLIENT_SKU,
                    BrowserConstants.MSAL_SKU
                );
                checkInputProperties(AADServerParamKeys.X_CLIENT_VER, version);
            });
        });

        describe("handleResponseEAR Tests", () => {
            const validResponse = {
                ear_jwe: validEarJWE,
                state: validRequest.state,
            };

            it("Throws if earJWK in request is empty", (done) => {
                const { earJwk, ...request }: CommonAuthorizationUrlRequest =
                    validRequest;
                Authorize.handleResponseEAR(
                    request,
                    validResponse,
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient
                ).catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.earJwkEmpty
                    );
                    done();
                });
            });

            it("Throws if ear_jwe in server response is empty", (done) => {
                const { ear_jwe, ...response } = validResponse;
                Authorize.handleResponseEAR(
                    validRequest,
                    response,
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient
                ).catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.earJweEmpty
                    );
                    done();
                });
            });

            it("Throws if request state doesn't match response state", (done) => {
                const response = { ...validResponse, state: "different-state" };
                Authorize.handleResponseEAR(
                    validRequest,
                    response,
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient
                ).catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toEqual(
                        ClientAuthErrorCodes.stateMismatch
                    );
                    done();
                });
            });

            it("Throws if response contains an error", (done) => {
                const response = {
                    state: validRequest.state,
                    error: "interaction_required",
                    error_description: "Interaction is required",
                };
                Authorize.handleResponseEAR(
                    validRequest,
                    response,
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient
                ).catch((e) => {
                    expect(e).toBeInstanceOf(InteractionRequiredAuthError);
                    expect(e.errorCode).toEqual(response.error);
                    done();
                });
            });

            it("If decrypted data contains accountId invoke handleResponsePlatformBroker", async () => {
                const decryptedServerResponse = {
                    accountId: "testAccountId",
                };
                const jwe = await generateValidEarJWE(
                    JSON.stringify(decryptedServerResponse),
                    validEarJWK
                );
                const response = { ...validResponse, ear_jwe: jwe };

                const nativeMessageHandler = new NativeMessageHandler(
                    logger,
                    2000,
                    performanceClient
                );
                const platformBrokerSpy = jest
                    .spyOn(NativeInteractionClient.prototype, "acquireToken")
                    .mockResolvedValue(getTestAuthenticationResult());

                const authResult = await Authorize.handleResponseEAR(
                    validRequest,
                    response,
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient,
                    nativeMessageHandler
                );
                expect(platformBrokerSpy).toHaveBeenCalled();
                expect(authResult).toEqual(getTestAuthenticationResult());
            });

            it("If decrypted data contains error, throw it", async () => {
                const decryptedServerResponse = {
                    error: "interaction_required",
                    error_description: "Interaction is required",
                };
                const jwe = await generateValidEarJWE(
                    JSON.stringify(decryptedServerResponse),
                    validEarJWK
                );
                const response = { ...validResponse, ear_jwe: jwe };
                try {
                    await Authorize.handleResponseEAR(
                        validRequest,
                        response,
                        ApiId.acquireTokenPopup,
                        config,
                        authority,
                        cacheManager,
                        cacheManager,
                        eventHandler,
                        logger,
                        performanceClient
                    );
                    throw "This is unexpected! This should throw!";
                } catch (e) {
                    expect(e).toBeInstanceOf(InteractionRequiredAuthError);
                    expect(
                        (e as InteractionRequiredAuthError).errorCode
                    ).toEqual("interaction_required");
                }
            });

            it("If decrypted data contains successful response cache tokens & account & return AuthenticationResult", async () => {
                const response = await Authorize.handleResponseEAR(
                    validRequest,
                    validResponse,
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient
                );
                expect(response).toEqual(getTestAuthenticationResult());
            });
        });
    });
});
