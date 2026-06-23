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
    ProtocolMode,
    Constants,
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
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { PlatformAuthInteractionClient } from "../../src/interaction_client/PlatformAuthInteractionClient.js";

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
            responseMode: Constants.ResponseMode.FRAGMENT,
            earJwk: validEarJWK,
            codeChallenge: "code-challenge",
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
                    Constants.OAuthResponseType.IDTOKEN_TOKEN_REFRESHTOKEN
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
                    AADServerParamKeys.CODE_CHALLENGE,
                    validRequest.codeChallenge!
                );
                checkInputProperties(
                    AADServerParamKeys.CODE_CHALLENGE_METHOD,
                    "S256"
                );
                checkInputProperties(
                    AADServerParamKeys.X_CLIENT_SKU,
                    BrowserConstants.MSAL_SKU
                );
                checkInputProperties(AADServerParamKeys.X_CLIENT_VER, version);
                checkInputProperties(AADServerParamKeys.CLI_DATA, "1");

                // Verify correlationId is present in authorize URL query params
                const actionUrl = new URL(form.action);
                expect(
                    actionUrl.searchParams.get(
                        AADServerParamKeys.CLIENT_REQUEST_ID
                    )
                ).toEqual(validRequest.correlationId);
            });

            it("Adds dpop_jkt when present in request", async () => {
                const form = await Authorize.getEARForm(
                    document,
                    config,
                    authority,
                    {
                        ...validRequest,
                        dpopJkt: "test-dpop-jkt",
                    },
                    logger,
                    performanceClient
                );

                expect(
                    (form.elements.namedItem(
                        AADServerParamKeys.DPOP_JKT
                    ) as HTMLInputElement).value
                ).toEqual("test-dpop-jkt");
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

                const nativeMessageHandler = new PlatformAuthExtensionHandler(
                    logger,
                    2000,
                    performanceClient
                );
                const platformBrokerSpy = jest
                    .spyOn(
                        PlatformAuthInteractionClient.prototype,
                        "acquireToken"
                    )
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

    describe("getCodeForm tests", () => {
        const config = buildConfiguration(
            { auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID } },
            true
        );
        const logger = new Logger({});
        const performanceClient = new StubPerformanceClient();
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
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
            scopes: ["openid", "profile"],
            correlationId: TEST_CONFIG.CORRELATION_ID,
            redirectUri: window.location.href,
            state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
            nonce: ID_TOKEN_CLAIMS.nonce,
            responseMode: Constants.ResponseMode.FRAGMENT,
            codeChallenge: "code-challenge",
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

        it("Adds correlationId to both post body and query params", async () => {
            const form = await Authorize.getCodeForm(
                document,
                config,
                authority,
                validRequest,
                logger,
                performanceClient
            );

            // Post body check
            const clientRequestIdInput = form.elements.namedItem(
                AADServerParamKeys.CLIENT_REQUEST_ID
            ) as HTMLInputElement;
            expect(clientRequestIdInput).toBeTruthy();
            expect(clientRequestIdInput.value).toEqual(
                validRequest.correlationId
            );

            // Query param check
            const actionUrl = new URL(form.action);
            expect(
                actionUrl.searchParams.get(AADServerParamKeys.CLIENT_REQUEST_ID)
            ).toEqual(validRequest.correlationId);
        });

        it("Includes clidata=1 in form post body", async () => {
            const form = await Authorize.getCodeForm(
                document,
                config,
                authority,
                validRequest,
                logger,
                performanceClient
            );

            const cliDataInput = form.elements.namedItem(
                AADServerParamKeys.CLI_DATA
            ) as HTMLInputElement;
            expect(cliDataInput).toBeTruthy();
            expect(cliDataInput.value).toEqual("1");
        });
    });

    describe("instrumentClientData Tests", () => {
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
            scopes: ["openid", "profile"],
            correlationId: TEST_CONFIG.CORRELATION_ID,
            redirectUri: window.location.href,
            state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
            nonce: ID_TOKEN_CLAIMS.nonce,
            responseMode: Constants.ResponseMode.FRAGMENT,
            codeChallenge: "code-challenge",
            earJwk: validEarJWK,
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

        it("handleResponseEAR instruments clientdata telemetry when clientdata is present", async () => {
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");
            // clientdata: m|0x8004345C|0x80047857|none|login.microsoftonline.com
            const clientdata =
                "m%7C0x8004345C%7C0x80047857%7Cnone%7Clogin.microsoftonline.com";
            const response = {
                ear_jwe: validEarJWE,
                state: validRequest.state,
                clientdata,
            };

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

            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    accountType: "MSA",
                }),
                validRequest.correlationId
            );
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverErrorNo: "0x8004345C",
                }),
                validRequest.correlationId
            );
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverSubErrorNo: "0x80047857",
                }),
                validRequest.correlationId
            );
            addFieldsSpy.mockRestore();
        });

        it("handleResponseEAR does not instrument clientdata when clientdata is absent", async () => {
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");
            addFieldsSpy.mockClear();
            const response = {
                ear_jwe: validEarJWE,
                state: validRequest.state,
            };

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

            // addFields may be called for other reasons, but NOT with clientData fields
            const clientDataCalls = addFieldsSpy.mock.calls.filter(
                (call: unknown[]) => {
                    const fields = call[0] as
                        | Record<string, unknown>
                        | undefined;
                    return fields && "serverErrorNo" in fields;
                }
            );
            expect(clientDataCalls).toHaveLength(0);
            addFieldsSpy.mockRestore();
        });

        it("handleResponseEAR instruments Entra (AAD) account type from clientdata", async () => {
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");
            // clientdata: e|AADSTS50076|basic_action|login.microsoftonline.com|none
            const clientdata =
                "e%7CAADSTS50076%7Cbasic_action%7Clogin.microsoftonline.com%7Cnone";
            const response = {
                ear_jwe: validEarJWE,
                state: validRequest.state,
                clientdata,
            };

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

            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    accountType: "AAD",
                }),
                validRequest.correlationId
            );
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverErrorNo: "AADSTS50076",
                }),
                validRequest.correlationId
            );
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverSubErrorNo: "basic_action",
                }),
                validRequest.correlationId
            );
            addFieldsSpy.mockRestore();
        });

        it("handleResponseCode instruments clientdata telemetry before processing response", async () => {
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");
            // clientdata: e|AADSTS65001|consent_required|login.microsoftonline.com|none
            const clientdata =
                "e%7CAADSTS65001%7Cconsent_required%7Clogin.microsoftonline.com%7Cnone";
            const response = {
                // Use accountId so it hits the platformBroker path, which throws without a provider
                accountId: "test-account-id",
                state: validRequest.state,
                clientdata,
            };

            try {
                await Authorize.handleResponseCode(
                    validRequest,
                    response,
                    "code-verifier",
                    ApiId.acquireTokenPopup,
                    config,
                    {} as any, // authClient not needed — accountId path is taken
                    cacheManager,
                    cacheManager,
                    eventHandler,
                    logger,
                    performanceClient
                    // no platformAuthProvider → throws nativeConnectionNotEstablished
                );
            } catch {
                // Expected: nativeConnectionNotEstablished
            }

            // instrumentClientData ran before the throw
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    accountType: "AAD",
                }),
                validRequest.correlationId
            );
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverErrorNo: "AADSTS65001",
                }),
                validRequest.correlationId
            );
            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverSubErrorNo: "consent_required",
                }),
                validRequest.correlationId
            );
            addFieldsSpy.mockRestore();
        });
    });
});
