/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "../crypto/CryptoOps.js";
import {
    InteractionRequiredAuthError,
    AccountInfo,
    Constants,
    INetworkModule,
    Logger,
    CommonSilentFlowRequest,
    ICrypto,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    AuthError,
    PerformanceEvents,
    PerformanceCallbackFunction,
    IPerformanceClient,
    BaseAuthRequest,
    PromptValue,
    InProgressPerformanceEvent,
    RequestThumbprint,
    AccountEntity,
    invokeAsync,
    createClientAuthError,
    ClientAuthErrorCodes,
    AccountFilter,
    buildStaticAuthorityOptions,
    InteractionRequiredAuthErrorCodes,
    PersistentCacheKeys,
    CacheManager,
} from "@azure/msal-common/browser";
import {
    BrowserCacheManager,
    DEFAULT_BROWSER_CACHE_MANAGER,
} from "../cache/BrowserCacheManager.js";
import * as AccountManager from "../cache/AccountManager.js";
import { BrowserConfiguration, CacheOptions } from "../config/Configuration.js";
import {
    InteractionType,
    ApiId,
    BrowserCacheLocation,
    WrapperSKU,
    TemporaryCacheKeys,
    CacheLookupPolicy,
    DEFAULT_REQUEST,
    BrowserConstants,
    iFrameRenewalPolicies,
} from "../utils/BrowserConstants.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { EventCallbackFunction, EventError } from "../event/EventMessage.js";
import { EventType } from "../event/EventType.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { EventHandler } from "../event/EventHandler.js";
import { PopupClient } from "../interaction_client/PopupClient.js";
import { RedirectClient } from "../interaction_client/RedirectClient.js";
import { SilentIframeClient } from "../interaction_client/SilentIframeClient.js";
import { SilentRefreshClient } from "../interaction_client/SilentRefreshClient.js";
import { TokenCache } from "../cache/TokenCache.js";
import { ITokenCache } from "../cache/ITokenCache.js";
import { NativeInteractionClient } from "../interaction_client/NativeInteractionClient.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { SilentRequest } from "../request/SilentRequest.js";
import {
    NativeAuthError,
    isFatalNativeAuthError,
} from "../error/NativeAuthError.js";
import { SilentCacheClient } from "../interaction_client/SilentCacheClient.js";
import { SilentAuthCodeClient } from "../interaction_client/SilentAuthCodeClient.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest.js";
import { NativeTokenRequest } from "../broker/nativeBroker/NativeRequest.js";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext.js";
import { BaseOperatingContext } from "../operatingcontext/BaseOperatingContext.js";
import { IController } from "./IController.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
import { initializeSilentRequest } from "../request/RequestHelpers.js";
import { InitializeApplicationRequest } from "../request/InitializeApplicationRequest.js";

function getAccountType(
    account?: AccountInfo
): "AAD" | "MSA" | "B2C" | undefined {
    const idTokenClaims = account?.idTokenClaims;
    if (idTokenClaims?.tfp || idTokenClaims?.acr) {
        return "B2C";
    }

    if (!idTokenClaims?.tid) {
        return undefined;
    } else if (idTokenClaims?.tid === "9188040d-6c67-4c5b-b112-36a304b66dad") {
        return "MSA";
    }
    return "AAD";
}

function preflightCheck(
    initialized: boolean,
    performanceEvent: InProgressPerformanceEvent
) {
    try {
        BrowserUtils.preflightCheck(initialized);
    } catch (e) {
        performanceEvent.end({ success: false }, e);
        throw e;
    }
}

export class StandardController implements IController {
    // OperatingContext
    protected readonly operatingContext: StandardOperatingContext;

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Storage interface implementation
    protected readonly browserStorage: BrowserCacheManager;

    // Native Cache in memory storage implementation
    protected readonly nativeInternalStorage: BrowserCacheManager;

    // Network interface implementation
    protected readonly networkClient: INetworkModule;

    // Navigation interface implementation
    protected navigationClient: INavigationClient;

    // Input configuration by developer/user
    protected readonly config: BrowserConfiguration;

    // Token cache implementation
    private tokenCache: TokenCache;

    // Logger
    protected logger: Logger;

    // Flag to indicate if in browser environment
    protected isBrowserEnvironment: boolean;

    protected readonly eventHandler: EventHandler;

    // Redirect Response Object
    protected readonly redirectResponse: Map<
        string,
        Promise<AuthenticationResult | null>
    >;

    // Native Extension Provider
    protected nativeExtensionProvider: NativeMessageHandler | undefined;

    // Hybrid auth code responses
    private hybridAuthCodeResponses: Map<string, Promise<AuthenticationResult>>;

    // Performance telemetry client
    protected readonly performanceClient: IPerformanceClient;

    // Flag representing whether or not the initialize API has been called and completed
    protected initialized: boolean;

    // Active requests
    private activeSilentTokenRequests: Map<
        string,
        Promise<AuthenticationResult>
    >;

    // Active Iframe request
    private activeIframeRequest: [Promise<boolean>, string] | undefined;

    private ssoSilentMeasurement?: InProgressPerformanceEvent;
    private acquireTokenByCodeAsyncMeasurement?: InProgressPerformanceEvent;

    // Flag which indicates if we're currently listening for account storage events
    private listeningToStorageEvents: boolean;
    /**
     * @constructor
     * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     * - redirect_uri: the uri of your application registered in the portal.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param configuration Object for the MSAL PublicClientApplication instance
     */
    constructor(operatingContext: StandardOperatingContext) {
        this.operatingContext = operatingContext;
        this.isBrowserEnvironment =
            this.operatingContext.isBrowserEnvironment();
        // Set the configuration.
        this.config = operatingContext.getConfig();
        this.initialized = false;

        // Initialize logger
        this.logger = this.operatingContext.getLogger();

        // Initialize the network module class.
        this.networkClient = this.config.system.networkClient;

        // Initialize the navigation client class.
        this.navigationClient = this.config.system.navigationClient;

        // Initialize redirectResponse Map
        this.redirectResponse = new Map();

        // Initial hybrid spa map
        this.hybridAuthCodeResponses = new Map();

        // Initialize performance client
        this.performanceClient = this.config.telemetry.client;

        // Initialize the crypto class.
        this.browserCrypto = this.isBrowserEnvironment
            ? new CryptoOps(this.logger, this.performanceClient)
            : DEFAULT_CRYPTO_IMPLEMENTATION;

        this.eventHandler = new EventHandler(this.logger);

        // Initialize the browser storage class.
        this.browserStorage = this.isBrowserEnvironment
            ? new BrowserCacheManager(
                  this.config.auth.clientId,
                  this.config.cache,
                  this.browserCrypto,
                  this.logger,
                  buildStaticAuthorityOptions(this.config.auth),
                  this.performanceClient
              )
            : DEFAULT_BROWSER_CACHE_MANAGER(
                  this.config.auth.clientId,
                  this.logger
              );

        // initialize in memory storage for native flows
        const nativeCacheOptions: Required<CacheOptions> = {
            cacheLocation: BrowserCacheLocation.MemoryStorage,
            temporaryCacheLocation: BrowserCacheLocation.MemoryStorage,
            storeAuthStateInCookie: false,
            secureCookies: false,
            cacheMigrationEnabled: false,
            claimsBasedCachingEnabled: false,
        };
        this.nativeInternalStorage = new BrowserCacheManager(
            this.config.auth.clientId,
            nativeCacheOptions,
            this.browserCrypto,
            this.logger,
            undefined,
            this.performanceClient
        );

        // Initialize the token cache
        this.tokenCache = new TokenCache(
            this.config,
            this.browserStorage,
            this.logger,
            this.browserCrypto
        );

        this.activeSilentTokenRequests = new Map();

        // Register listener functions
        this.trackPageVisibility = this.trackPageVisibility.bind(this);

        // Register listener functions
        this.trackPageVisibilityWithMeasurement =
            this.trackPageVisibilityWithMeasurement.bind(this);

        // account storage events
        this.listeningToStorageEvents = false;
        this.handleAccountCacheChange =
            this.handleAccountCacheChange.bind(this);
    }

    static async createController(
        operatingContext: BaseOperatingContext,
        request?: InitializeApplicationRequest
    ): Promise<IController> {
        const controller = new StandardController(operatingContext);
        await controller.initialize(request);
        return controller;
    }

    private trackPageVisibility(correlationId?: string): void {
        if (!correlationId) {
            return;
        }
        this.logger.info("Perf: Visibility change detected");
        this.performanceClient.incrementFields(
            { visibilityChangeCount: 1 },
            correlationId
        );
    }

    /**
     * Initializer function to perform async startup tasks such as connecting to WAM extension
     * @param request {?InitializeApplicationRequest} correlation id
     */
    async initialize(request?: InitializeApplicationRequest): Promise<void> {
        this.logger.trace("initialize called");
        if (this.initialized) {
            this.logger.info(
                "initialize has already been called, exiting early."
            );
            return;
        }

        if (!this.isBrowserEnvironment) {
            this.logger.info("in non-browser environment, exiting early.");
            this.initialized = true;
            this.eventHandler.emitEvent(EventType.INITIALIZE_END);
            return;
        }

        const initCorrelationId =
            request?.correlationId || this.getRequestCorrelationId();
        const allowNativeBroker = this.config.system.allowNativeBroker;
        const initMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.InitializeClientApplication,
            initCorrelationId
        );
        this.eventHandler.emitEvent(EventType.INITIALIZE_START);

        if (allowNativeBroker) {
            try {
                this.nativeExtensionProvider =
                    await NativeMessageHandler.createProvider(
                        this.logger,
                        this.config.system.nativeBrokerHandshakeTimeout,
                        this.performanceClient
                    );
            } catch (e) {
                this.logger.verbose(e as string);
            }
        }

        if (!this.config.cache.claimsBasedCachingEnabled) {
            this.logger.verbose(
                "Claims-based caching is disabled. Clearing the previous cache with claims"
            );

            await invokeAsync(
                this.browserStorage.clearTokensAndKeysWithClaims.bind(
                    this.browserStorage
                ),
                PerformanceEvents.ClearTokensAndKeysWithClaims,
                this.logger,
                this.performanceClient,
                initCorrelationId
            )(this.performanceClient, initCorrelationId);
        }

        this.initialized = true;
        this.eventHandler.emitEvent(EventType.INITIALIZE_END);
        initMeasurement.end({ allowNativeBroker, success: true });
    }

    // #region Redirect Flow

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns Token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(
        hash?: string
    ): Promise<AuthenticationResult | null> {
        this.logger.verbose("handleRedirectPromise called");
        // Block token acquisition before initialize has been called
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);

        if (this.isBrowserEnvironment) {
            /**
             * Store the promise on the PublicClientApplication instance if this is the first invocation of handleRedirectPromise,
             * otherwise return the promise from the first invocation. Prevents race conditions when handleRedirectPromise is called
             * several times concurrently.
             */
            const redirectResponseKey = hash || "";
            let response = this.redirectResponse.get(redirectResponseKey);
            if (typeof response === "undefined") {
                response = this.handleRedirectPromiseInternal(hash);
                this.redirectResponse.set(redirectResponseKey, response);
                this.logger.verbose(
                    "handleRedirectPromise has been called for the first time, storing the promise"
                );
            } else {
                this.logger.verbose(
                    "handleRedirectPromise has been called previously, returning the result from the first call"
                );
            }

            return response;
        }
        this.logger.verbose(
            "handleRedirectPromise returns null, not browser environment"
        );
        return null;
    }

    /**
     * The internal details of handleRedirectPromise. This is separated out to a helper to allow handleRedirectPromise to memoize requests
     * @param hash
     * @returns
     */
    private async handleRedirectPromiseInternal(
        hash?: string
    ): Promise<AuthenticationResult | null> {
        const loggedInAccounts = this.getAllAccounts();
        const request: NativeTokenRequest | null =
            this.browserStorage.getCachedNativeRequest();
        const useNative =
            request &&
            NativeMessageHandler.isNativeAvailable(
                this.config,
                this.logger,
                this.nativeExtensionProvider
            ) &&
            this.nativeExtensionProvider &&
            !hash;
        const correlationId = useNative
            ? request?.correlationId
            : this.browserStorage.getTemporaryCache(
                  TemporaryCacheKeys.CORRELATION_ID,
                  true
              ) || "";
        const rootMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenRedirect,
            correlationId
        );
        this.eventHandler.emitEvent(
            EventType.HANDLE_REDIRECT_START,
            InteractionType.Redirect
        );

        let redirectResponse: Promise<AuthenticationResult | null>;
        if (useNative && this.nativeExtensionProvider) {
            this.logger.trace(
                "handleRedirectPromise - acquiring token from native platform"
            );
            const nativeClient = new NativeInteractionClient(
                this.config,
                this.browserStorage,
                this.browserCrypto,
                this.logger,
                this.eventHandler,
                this.navigationClient,
                ApiId.handleRedirectPromise,
                this.performanceClient,
                this.nativeExtensionProvider,
                request.accountId,
                this.nativeInternalStorage,
                request.correlationId
            );

            redirectResponse = invokeAsync(
                nativeClient.handleRedirectPromise.bind(nativeClient),
                PerformanceEvents.HandleNativeRedirectPromiseMeasurement,
                this.logger,
                this.performanceClient,
                rootMeasurement.event.correlationId
            )(this.performanceClient, rootMeasurement.event.correlationId);
        } else {
            this.logger.trace(
                "handleRedirectPromise - acquiring token from web flow"
            );
            const redirectClient = this.createRedirectClient(correlationId);
            redirectResponse = invokeAsync(
                redirectClient.handleRedirectPromise.bind(redirectClient),
                PerformanceEvents.HandleRedirectPromiseMeasurement,
                this.logger,
                this.performanceClient,
                rootMeasurement.event.correlationId
            )(hash, rootMeasurement);
        }

        return redirectResponse
            .then((result: AuthenticationResult | null) => {
                if (result) {
                    // Emit login event if number of accounts change

                    const isLoggingIn =
                        loggedInAccounts.length < this.getAllAccounts().length;
                    if (isLoggingIn) {
                        this.eventHandler.emitEvent(
                            EventType.LOGIN_SUCCESS,
                            InteractionType.Redirect,
                            result
                        );
                        this.logger.verbose(
                            "handleRedirectResponse returned result, login success"
                        );
                    } else {
                        this.eventHandler.emitEvent(
                            EventType.ACQUIRE_TOKEN_SUCCESS,
                            InteractionType.Redirect,
                            result
                        );
                        this.logger.verbose(
                            "handleRedirectResponse returned result, acquire token success"
                        );
                    }
                    rootMeasurement.end({
                        success: true,
                        accountType: getAccountType(result.account),
                    });
                } else {
                    /*
                     * Instrument an event only if an error code is set. Otherwise, discard it when the redirect response
                     * is empty and the error code is missing.
                     */
                    if (rootMeasurement.event.errorCode) {
                        rootMeasurement.end({ success: false });
                    } else {
                        rootMeasurement.discard();
                    }
                }

                this.eventHandler.emitEvent(
                    EventType.HANDLE_REDIRECT_END,
                    InteractionType.Redirect
                );

                return result;
            })
            .catch((e) => {
                const eventError = e as EventError;
                // Emit login event if there is an account
                if (loggedInAccounts.length > 0) {
                    this.eventHandler.emitEvent(
                        EventType.ACQUIRE_TOKEN_FAILURE,
                        InteractionType.Redirect,
                        null,
                        eventError
                    );
                } else {
                    this.eventHandler.emitEvent(
                        EventType.LOGIN_FAILURE,
                        InteractionType.Redirect,
                        null,
                        eventError
                    );
                }
                this.eventHandler.emitEvent(
                    EventType.HANDLE_REDIRECT_END,
                    InteractionType.Redirect
                );

                rootMeasurement.end(
                    {
                        success: false,
                    },
                    eventError
                );

                throw e;
            });
    }

    /**
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
     * the page, so any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        // Preflight request
        const correlationId = this.getRequestCorrelationId(request);
        this.logger.verbose("acquireTokenRedirect called", correlationId);

        const atrMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenPreRedirect,
            correlationId
        );
        atrMeasurement.add({
            accountType: getAccountType(request.account),
            scenarioId: request.scenarioId,
        });

        // Override on request only if set, as onRedirectNavigate field is deprecated
        const onRedirectNavigateCb = request.onRedirectNavigate;
        if (onRedirectNavigateCb) {
            request.onRedirectNavigate = (url: string) => {
                const navigate =
                    typeof onRedirectNavigateCb === "function"
                        ? onRedirectNavigateCb(url)
                        : undefined;
                if (navigate !== false) {
                    atrMeasurement.end({ success: true });
                } else {
                    atrMeasurement.discard();
                }
                return navigate;
            };
        } else {
            const configOnRedirectNavigateCb =
                this.config.auth.onRedirectNavigate;
            this.config.auth.onRedirectNavigate = (url: string) => {
                const navigate =
                    typeof configOnRedirectNavigateCb === "function"
                        ? configOnRedirectNavigateCb(url)
                        : undefined;
                if (navigate !== false) {
                    atrMeasurement.end({ success: true });
                } else {
                    atrMeasurement.discard();
                }
                return navigate;
            };
        }

        // If logged in, emit acquire token events
        const isLoggedIn = this.getAllAccounts().length > 0;
        try {
            BrowserUtils.redirectPreflightCheck(this.initialized, this.config);
            this.browserStorage.setInteractionInProgress(true);

            if (isLoggedIn) {
                this.eventHandler.emitEvent(
                    EventType.ACQUIRE_TOKEN_START,
                    InteractionType.Redirect,
                    request
                );
            } else {
                this.eventHandler.emitEvent(
                    EventType.LOGIN_START,
                    InteractionType.Redirect,
                    request
                );
            }

            let result: Promise<void>;

            if (this.nativeExtensionProvider && this.canUseNative(request)) {
                const nativeClient = new NativeInteractionClient(
                    this.config,
                    this.browserStorage,
                    this.browserCrypto,
                    this.logger,
                    this.eventHandler,
                    this.navigationClient,
                    ApiId.acquireTokenRedirect,
                    this.performanceClient,
                    this.nativeExtensionProvider,
                    this.getNativeAccountId(request),
                    this.nativeInternalStorage,
                    correlationId
                );
                result = nativeClient
                    .acquireTokenRedirect(request, atrMeasurement)
                    .catch((e: AuthError) => {
                        if (
                            e instanceof NativeAuthError &&
                            isFatalNativeAuthError(e)
                        ) {
                            this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                            const redirectClient =
                                this.createRedirectClient(correlationId);
                            return redirectClient.acquireToken(request);
                        } else if (e instanceof InteractionRequiredAuthError) {
                            this.logger.verbose(
                                "acquireTokenRedirect - Resolving interaction required error thrown by native broker by falling back to web flow"
                            );
                            const redirectClient =
                                this.createRedirectClient(correlationId);
                            return redirectClient.acquireToken(request);
                        }
                        this.browserStorage.setInteractionInProgress(false);
                        throw e;
                    });
            } else {
                const redirectClient = this.createRedirectClient(correlationId);
                result = redirectClient.acquireToken(request);
            }

            return await result;
        } catch (e) {
            atrMeasurement.end({ success: false }, e);
            if (isLoggedIn) {
                this.eventHandler.emitEvent(
                    EventType.ACQUIRE_TOKEN_FAILURE,
                    InteractionType.Redirect,
                    null,
                    e as EventError
                );
            } else {
                this.eventHandler.emitEvent(
                    EventType.LOGIN_FAILURE,
                    InteractionType.Redirect,
                    null,
                    e as EventError
                );
            }
            throw e;
        }
    }

    // #endregion

    // #region Popup Flow

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        const correlationId = this.getRequestCorrelationId(request);
        const atPopupMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenPopup,
            correlationId
        );

        atPopupMeasurement.add({
            scenarioId: request.scenarioId,
            accountType: getAccountType(request.account),
        });

        try {
            this.logger.verbose("acquireTokenPopup called", correlationId);
            preflightCheck(this.initialized, atPopupMeasurement);
            this.browserStorage.setInteractionInProgress(true);
        } catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }

        // If logged in, emit acquire token events
        const loggedInAccounts = this.getAllAccounts();
        if (loggedInAccounts.length > 0) {
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_START,
                InteractionType.Popup,
                request
            );
        } else {
            this.eventHandler.emitEvent(
                EventType.LOGIN_START,
                InteractionType.Popup,
                request
            );
        }

        let result: Promise<AuthenticationResult>;

        if (this.canUseNative(request)) {
            result = this.acquireTokenNative(
                {
                    ...request,
                    correlationId,
                },
                ApiId.acquireTokenPopup
            )
                .then((response) => {
                    this.browserStorage.setInteractionInProgress(false);
                    atPopupMeasurement.end({
                        success: true,
                        isNativeBroker: true,
                        requestId: response.requestId,
                        accountType: getAccountType(response.account),
                    });
                    return response;
                })
                .catch((e: AuthError) => {
                    if (
                        e instanceof NativeAuthError &&
                        isFatalNativeAuthError(e)
                    ) {
                        this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                        const popupClient =
                            this.createPopupClient(correlationId);
                        return popupClient.acquireToken(request);
                    } else if (e instanceof InteractionRequiredAuthError) {
                        this.logger.verbose(
                            "acquireTokenPopup - Resolving interaction required error thrown by native broker by falling back to web flow"
                        );
                        const popupClient =
                            this.createPopupClient(correlationId);
                        return popupClient.acquireToken(request);
                    }
                    this.browserStorage.setInteractionInProgress(false);
                    throw e;
                });
        } else {
            const popupClient = this.createPopupClient(correlationId);
            result = popupClient.acquireToken(request);
        }

        return result
            .then((result) => {
                /*
                 *  If logged in, emit acquire token events
                 */
                const isLoggingIn =
                    loggedInAccounts.length < this.getAllAccounts().length;
                if (isLoggingIn) {
                    this.eventHandler.emitEvent(
                        EventType.LOGIN_SUCCESS,
                        InteractionType.Popup,
                        result
                    );
                } else {
                    this.eventHandler.emitEvent(
                        EventType.ACQUIRE_TOKEN_SUCCESS,
                        InteractionType.Popup,
                        result
                    );
                }

                atPopupMeasurement.end({
                    success: true,
                    requestId: result.requestId,
                    accessTokenSize: result.accessToken.length,
                    idTokenSize: result.idToken.length,
                    accountType: getAccountType(result.account),
                });
                return result;
            })
            .catch((e: Error) => {
                if (loggedInAccounts.length > 0) {
                    this.eventHandler.emitEvent(
                        EventType.ACQUIRE_TOKEN_FAILURE,
                        InteractionType.Popup,
                        null,
                        e
                    );
                } else {
                    this.eventHandler.emitEvent(
                        EventType.LOGIN_FAILURE,
                        InteractionType.Popup,
                        null,
                        e
                    );
                }

                atPopupMeasurement.end(
                    {
                        success: false,
                    },
                    e
                );

                // Since this function is syncronous we need to reject
                return Promise.reject(e);
            });
    }

    private trackPageVisibilityWithMeasurement(): void {
        const measurement =
            this.ssoSilentMeasurement ||
            this.acquireTokenByCodeAsyncMeasurement;
        if (!measurement) {
            return;
        }

        this.logger.info(
            "Perf: Visibility change detected in ",
            measurement.event.name
        );
        measurement.increment({
            visibilityChangeCount: 1,
        });
    }
    // #endregion

    // #region Silent Flow

    /**
     * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
     * - Any browser using a form of Intelligent Tracking Prevention
     * - If there is not an established session with the service
     *
     * In these cases, the request must be done inside a popup or full frame redirect.
     *
     * For the cases where interaction is required, you cannot send a request with prompt=none.
     *
     * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
     * you session on the server still exists.
     * @param request {@link SsoSilentRequest}
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    async ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        const correlationId = this.getRequestCorrelationId(request);
        const validRequest = {
            ...request,
            // will be PromptValue.NONE or PromptValue.NO_SESSION
            prompt: request.prompt,
            correlationId: correlationId,
        };
        this.ssoSilentMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.SsoSilent,
            correlationId
        );
        this.ssoSilentMeasurement?.add({
            scenarioId: request.scenarioId,
            accountType: getAccountType(request.account),
        });
        preflightCheck(this.initialized, this.ssoSilentMeasurement);
        this.ssoSilentMeasurement?.increment({
            visibilityChangeCount: 0,
        });

        document.addEventListener(
            "visibilitychange",
            this.trackPageVisibilityWithMeasurement
        );
        this.logger.verbose("ssoSilent called", correlationId);
        this.eventHandler.emitEvent(
            EventType.SSO_SILENT_START,
            InteractionType.Silent,
            validRequest
        );

        let result: Promise<AuthenticationResult>;

        if (this.canUseNative(validRequest)) {
            result = this.acquireTokenNative(
                validRequest,
                ApiId.ssoSilent
            ).catch((e: AuthError) => {
                // If native token acquisition fails for availability reasons fallback to standard flow
                if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
                    this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                    const silentIframeClient = this.createSilentIframeClient(
                        validRequest.correlationId
                    );
                    return silentIframeClient.acquireToken(validRequest);
                }
                throw e;
            });
        } else {
            const silentIframeClient = this.createSilentIframeClient(
                validRequest.correlationId
            );
            result = silentIframeClient.acquireToken(validRequest);
        }

        return result
            .then((response) => {
                this.eventHandler.emitEvent(
                    EventType.SSO_SILENT_SUCCESS,
                    InteractionType.Silent,
                    response
                );
                this.ssoSilentMeasurement?.end({
                    success: true,
                    isNativeBroker: response.fromNativeBroker,
                    requestId: response.requestId,
                    accessTokenSize: response.accessToken.length,
                    idTokenSize: response.idToken.length,
                    accountType: getAccountType(response.account),
                });
                return response;
            })
            .catch((e: Error) => {
                this.eventHandler.emitEvent(
                    EventType.SSO_SILENT_FAILURE,
                    InteractionType.Silent,
                    null,
                    e
                );
                this.ssoSilentMeasurement?.end(
                    {
                        success: false,
                    },
                    e
                );
                throw e;
            })
            .finally(() => {
                document.removeEventListener(
                    "visibilitychange",
                    this.trackPageVisibilityWithMeasurement
                );
            });
    }

    /**
     * This function redeems an authorization code (passed as code) from the eSTS token endpoint.
     * This authorization code should be acquired server-side using a confidential client to acquire a spa_code.
     * This API is not indended for normal authorization code acquisition and redemption.
     *
     * Redemption of this authorization code will not require PKCE, as it was acquired by a confidential client.
     *
     * @param request {@link AuthorizationCodeRequest}
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    async acquireTokenByCode(
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        const correlationId = this.getRequestCorrelationId(request);
        this.logger.trace("acquireTokenByCode called", correlationId);
        const atbcMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenByCode,
            correlationId
        );
        preflightCheck(this.initialized, atbcMeasurement);
        this.eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_BY_CODE_START,
            InteractionType.Silent,
            request
        );
        atbcMeasurement.add({ scenarioId: request.scenarioId });

        try {
            if (request.code && request.nativeAccountId) {
                // Throw error in case server returns both spa_code and spa_accountid in exchange for auth code.
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.spaCodeAndNativeAccountIdPresent
                );
            } else if (request.code) {
                const hybridAuthCode = request.code;
                let response = this.hybridAuthCodeResponses.get(hybridAuthCode);
                if (!response) {
                    this.logger.verbose(
                        "Initiating new acquireTokenByCode request",
                        correlationId
                    );
                    response = this.acquireTokenByCodeAsync({
                        ...request,
                        correlationId,
                    })
                        .then((result: AuthenticationResult) => {
                            this.eventHandler.emitEvent(
                                EventType.ACQUIRE_TOKEN_BY_CODE_SUCCESS,
                                InteractionType.Silent,
                                result
                            );
                            this.hybridAuthCodeResponses.delete(hybridAuthCode);
                            atbcMeasurement.end({
                                success: true,
                                isNativeBroker: result.fromNativeBroker,
                                requestId: result.requestId,
                                accessTokenSize: result.accessToken.length,
                                idTokenSize: result.idToken.length,
                                accountType: getAccountType(result.account),
                            });
                            return result;
                        })
                        .catch((error: Error) => {
                            this.hybridAuthCodeResponses.delete(hybridAuthCode);
                            this.eventHandler.emitEvent(
                                EventType.ACQUIRE_TOKEN_BY_CODE_FAILURE,
                                InteractionType.Silent,
                                null,
                                error
                            );
                            atbcMeasurement.end(
                                {
                                    success: false,
                                },
                                error
                            );
                            throw error;
                        });
                    this.hybridAuthCodeResponses.set(hybridAuthCode, response);
                } else {
                    this.logger.verbose(
                        "Existing acquireTokenByCode request found",
                        correlationId
                    );
                    atbcMeasurement.discard();
                }
                return await response;
            } else if (request.nativeAccountId) {
                if (this.canUseNative(request, request.nativeAccountId)) {
                    const result = await this.acquireTokenNative(
                        {
                            ...request,
                            correlationId,
                        },
                        ApiId.acquireTokenByCode,
                        request.nativeAccountId
                    ).catch((e: AuthError) => {
                        // If native token acquisition fails for availability reasons fallback to standard flow
                        if (
                            e instanceof NativeAuthError &&
                            isFatalNativeAuthError(e)
                        ) {
                            this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                        }
                        throw e;
                    });
                    atbcMeasurement.end({
                        accountType: getAccountType(result.account),
                        success: true,
                    });
                    return result;
                } else {
                    throw createBrowserAuthError(
                        BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform
                    );
                }
            } else {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired
                );
            }
        } catch (e) {
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_BY_CODE_FAILURE,
                InteractionType.Silent,
                null,
                e as EventError
            );
            atbcMeasurement.end(
                {
                    success: false,
                },
                e
            );
            throw e;
        }
    }

    /**
     * Creates a SilentAuthCodeClient to redeem an authorization code.
     * @param request
     * @returns Result of the operation to redeem the authorization code
     */
    private async acquireTokenByCodeAsync(
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        this.logger.trace(
            "acquireTokenByCodeAsync called",
            request.correlationId
        );
        this.acquireTokenByCodeAsyncMeasurement =
            this.performanceClient.startMeasurement(
                PerformanceEvents.AcquireTokenByCodeAsync,
                request.correlationId
            );
        this.acquireTokenByCodeAsyncMeasurement?.increment({
            visibilityChangeCount: 0,
        });
        document.addEventListener(
            "visibilitychange",
            this.trackPageVisibilityWithMeasurement
        );
        const silentAuthCodeClient = this.createSilentAuthCodeClient(
            request.correlationId
        );
        const silentTokenResult = await silentAuthCodeClient
            .acquireToken(request)
            .then((response) => {
                this.acquireTokenByCodeAsyncMeasurement?.end({
                    success: true,
                    fromCache: response.fromCache,
                    isNativeBroker: response.fromNativeBroker,
                    requestId: response.requestId,
                });
                return response;
            })
            .catch((tokenRenewalError: Error) => {
                this.acquireTokenByCodeAsyncMeasurement?.end(
                    {
                        success: false,
                    },
                    tokenRenewalError
                );
                throw tokenRenewalError;
            })
            .finally(() => {
                document.removeEventListener(
                    "visibilitychange",
                    this.trackPageVisibilityWithMeasurement
                );
            });
        return silentTokenResult;
    }

    /**
     * Attempt to acquire an access token from the cache
     * @param silentCacheClient SilentCacheClient
     * @param commonRequest CommonSilentFlowRequest
     * @param silentRequest SilentRequest
     * @returns A promise that, when resolved, returns the access token
     */
    protected async acquireTokenFromCache(
        commonRequest: CommonSilentFlowRequest,
        cacheLookupPolicy: CacheLookupPolicy
    ): Promise<AuthenticationResult> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenFromCache,
            commonRequest.correlationId
        );
        switch (cacheLookupPolicy) {
            case CacheLookupPolicy.Default:
            case CacheLookupPolicy.AccessToken:
            case CacheLookupPolicy.AccessTokenAndRefreshToken:
                const silentCacheClient = this.createSilentCacheClient(
                    commonRequest.correlationId
                );
                return invokeAsync(
                    silentCacheClient.acquireToken.bind(silentCacheClient),
                    PerformanceEvents.SilentCacheClientAcquireToken,
                    this.logger,
                    this.performanceClient,
                    commonRequest.correlationId
                )(commonRequest);
            default:
                throw createClientAuthError(
                    ClientAuthErrorCodes.tokenRefreshRequired
                );
        }
    }

    /**
     * Attempt to acquire an access token via a refresh token
     * @param commonRequest CommonSilentFlowRequest
     * @param cacheLookupPolicy CacheLookupPolicy
     * @returns A promise that, when resolved, returns the access token
     */
    public async acquireTokenByRefreshToken(
        commonRequest: CommonSilentFlowRequest,
        cacheLookupPolicy: CacheLookupPolicy
    ): Promise<AuthenticationResult> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenByRefreshToken,
            commonRequest.correlationId
        );
        switch (cacheLookupPolicy) {
            case CacheLookupPolicy.Default:
            case CacheLookupPolicy.AccessTokenAndRefreshToken:
            case CacheLookupPolicy.RefreshToken:
            case CacheLookupPolicy.RefreshTokenAndNetwork:
                const silentRefreshClient = this.createSilentRefreshClient(
                    commonRequest.correlationId
                );

                return invokeAsync(
                    silentRefreshClient.acquireToken.bind(silentRefreshClient),
                    PerformanceEvents.SilentRefreshClientAcquireToken,
                    this.logger,
                    this.performanceClient,
                    commonRequest.correlationId
                )(commonRequest);
            default:
                throw createClientAuthError(
                    ClientAuthErrorCodes.tokenRefreshRequired
                );
        }
    }

    /**
     * Attempt to acquire an access token via an iframe
     * @param request CommonSilentFlowRequest
     * @returns A promise that, when resolved, returns the access token
     */
    protected async acquireTokenBySilentIframe(
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenBySilentIframe,
            request.correlationId
        );

        const silentIframeClient = this.createSilentIframeClient(
            request.correlationId
        );

        return invokeAsync(
            silentIframeClient.acquireToken.bind(silentIframeClient),
            PerformanceEvents.SilentIframeClientAcquireToken,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request);
    }

    // #endregion

    // #region Logout

    /**
     * Deprecated logout function. Use logoutRedirect or logoutPopup instead
     * @param logoutRequest
     * @deprecated
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        const correlationId = this.getRequestCorrelationId(logoutRequest);
        this.logger.warning(
            "logout API is deprecated and will be removed in msal-browser v3.0.0. Use logoutRedirect instead.",
            correlationId
        );
        return this.logoutRedirect({
            correlationId,
            ...logoutRequest,
        });
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void> {
        const correlationId = this.getRequestCorrelationId(logoutRequest);
        BrowserUtils.redirectPreflightCheck(this.initialized, this.config);
        this.browserStorage.setInteractionInProgress(true);

        const redirectClient = this.createRedirectClient(correlationId);
        return redirectClient.logout(logoutRequest);
    }

    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest
     */
    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void> {
        try {
            const correlationId = this.getRequestCorrelationId(logoutRequest);
            BrowserUtils.preflightCheck(this.initialized);
            this.browserStorage.setInteractionInProgress(true);

            const popupClient = this.createPopupClient(correlationId);
            return popupClient.logout(logoutRequest);
        } catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }
    }

    /**
     * Creates a cache interaction client to clear broswer cache.
     * @param logoutRequest
     */
    async clearCache(logoutRequest?: ClearCacheRequest): Promise<void> {
        if (!this.isBrowserEnvironment) {
            this.logger.info("in non-browser environment, returning early.");
            return;
        }
        const correlationId = this.getRequestCorrelationId(logoutRequest);
        const cacheClient = this.createSilentCacheClient(correlationId);
        return cacheClient.logout(logoutRequest);
    }

    // #endregion

    // #region Account APIs

    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    getAllAccounts(accountFilter?: AccountFilter): AccountInfo[] {
        return AccountManager.getAllAccounts(
            this.logger,
            this.browserStorage,
            this.isBrowserEnvironment,
            accountFilter
        );
    }

    /**
     * Returns the first account found in the cache that matches the account filter passed in.
     * @param accountFilter
     * @returns The first account found in the cache matching the provided filter or null if no account could be found.
     */
    getAccount(accountFilter: AccountFilter): AccountInfo | null {
        return AccountManager.getAccount(
            accountFilter,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found.
     * This API is provided for convenience but getAccountById should be used for best reliability
     * @param username
     * @returns The account object stored in MSAL
     */
    getAccountByUsername(username: string): AccountInfo | null {
        return AccountManager.getAccountByUsername(
            username,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param homeAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        return AccountManager.getAccountByHomeId(
            homeAccountId,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Returns the signed in account matching localAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param localAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByLocalId(localAccountId: string): AccountInfo | null {
        return AccountManager.getAccountByLocalId(
            localAccountId,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        AccountManager.setActiveAccount(account, this.browserStorage);
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        return AccountManager.getActiveAccount(this.browserStorage);
    }

    // #endregion

    /**
     * Hydrates the cache with the tokens from an AuthenticationResult
     * @param result
     * @param request
     * @returns
     */
    async hydrateCache(
        result: AuthenticationResult,
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void> {
        this.logger.verbose("hydrateCache called");

        // Account gets saved to browser storage regardless of native or not
        const accountEntity = AccountEntity.createFromAccountInfo(
            result.account,
            result.cloudGraphHostName,
            result.msGraphHost
        );
        this.browserStorage.setAccount(accountEntity);

        if (result.fromNativeBroker) {
            this.logger.verbose(
                "Response was from native broker, storing in-memory"
            );
            // Tokens from native broker are stored in-memory
            return this.nativeInternalStorage.hydrateCache(result, request);
        } else {
            return this.browserStorage.hydrateCache(result, request);
        }
    }

    // #region Helpers

    /**
     * Acquire a token from native device (e.g. WAM)
     * @param request
     */
    public async acquireTokenNative(
        request: PopupRequest | SilentRequest | SsoSilentRequest,
        apiId: ApiId,
        accountId?: string
    ): Promise<AuthenticationResult> {
        this.logger.trace("acquireTokenNative called");
        if (!this.nativeExtensionProvider) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.nativeConnectionNotEstablished
            );
        }

        const nativeClient = new NativeInteractionClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            apiId,
            this.performanceClient,
            this.nativeExtensionProvider,
            accountId || this.getNativeAccountId(request),
            this.nativeInternalStorage,
            request.correlationId
        );

        return nativeClient.acquireToken(request);
    }

    /**
     * Returns boolean indicating if this request can use the native broker
     * @param request
     */
    public canUseNative(
        request: RedirectRequest | PopupRequest | SsoSilentRequest,
        accountId?: string
    ): boolean {
        this.logger.trace("canUseNative called");
        if (
            !NativeMessageHandler.isNativeAvailable(
                this.config,
                this.logger,
                this.nativeExtensionProvider,
                request.authenticationScheme
            )
        ) {
            this.logger.trace(
                "canUseNative: isNativeAvailable returned false, returning false"
            );
            return false;
        }

        if (request.prompt) {
            switch (request.prompt) {
                case PromptValue.NONE:
                case PromptValue.CONSENT:
                case PromptValue.LOGIN:
                    this.logger.trace(
                        "canUseNative: prompt is compatible with native flow"
                    );
                    break;
                default:
                    this.logger.trace(
                        `canUseNative: prompt = ${request.prompt} is not compatible with native flow, returning false`
                    );
                    return false;
            }
        }

        if (!accountId && !this.getNativeAccountId(request)) {
            this.logger.trace(
                "canUseNative: nativeAccountId is not available, returning false"
            );
            return false;
        }

        return true;
    }

    /**
     * Get the native accountId from the account
     * @param request
     * @returns
     */
    public getNativeAccountId(
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): string {
        const account =
            request.account ||
            this.getAccount({
                loginHint: request.loginHint,
                sid: request.sid,
            }) ||
            this.getActiveAccount();

        return (account && account.nativeAccountId) || "";
    }

    /**
     * Returns new instance of the Popup Interaction Client
     * @param correlationId
     */
    public createPopupClient(correlationId?: string): PopupClient {
        return new PopupClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            this.performanceClient,
            this.nativeInternalStorage,
            this.nativeExtensionProvider,
            correlationId
        );
    }

    /**
     * Returns new instance of the Redirect Interaction Client
     * @param correlationId
     */
    protected createRedirectClient(correlationId?: string): RedirectClient {
        return new RedirectClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            this.performanceClient,
            this.nativeInternalStorage,
            this.nativeExtensionProvider,
            correlationId
        );
    }

    /**
     * Returns new instance of the Silent Iframe Interaction Client
     * @param correlationId
     */
    public createSilentIframeClient(
        correlationId?: string
    ): SilentIframeClient {
        return new SilentIframeClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            ApiId.ssoSilent,
            this.performanceClient,
            this.nativeInternalStorage,
            this.nativeExtensionProvider,
            correlationId
        );
    }

    /**
     * Returns new instance of the Silent Cache Interaction Client
     */
    protected createSilentCacheClient(
        correlationId?: string
    ): SilentCacheClient {
        return new SilentCacheClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            this.performanceClient,
            this.nativeExtensionProvider,
            correlationId
        );
    }

    /**
     * Returns new instance of the Silent Refresh Interaction Client
     */
    protected createSilentRefreshClient(
        correlationId?: string
    ): SilentRefreshClient {
        return new SilentRefreshClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            this.performanceClient,
            this.nativeExtensionProvider,
            correlationId
        );
    }

    /**
     * Returns new instance of the Silent AuthCode Interaction Client
     */
    protected createSilentAuthCodeClient(
        correlationId?: string
    ): SilentAuthCodeClient {
        return new SilentAuthCodeClient(
            this.config,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            ApiId.acquireTokenByCode,
            this.performanceClient,
            this.nativeExtensionProvider,
            correlationId
        );
    }

    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(
        callback: EventCallbackFunction,
        eventTypes?: Array<EventType>
    ): string | null {
        return this.eventHandler.addEventCallback(callback, eventTypes);
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        this.eventHandler.removeEventCallback(callbackId);
    }

    /**
     * Registers a callback to receive performance events.
     *
     * @param {PerformanceCallbackFunction} callback
     * @returns {string}
     */
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        BrowserUtils.blockNonBrowserEnvironment();
        return this.performanceClient.addPerformanceCallback(callback);
    }

    /**
     * Removes a callback registered with addPerformanceCallback.
     *
     * @param {string} callbackId
     * @returns {boolean}
     */
    removePerformanceCallback(callbackId: string): boolean {
        return this.performanceClient.removePerformanceCallback(callbackId);
    }

    /**
     * Adds event listener that emits an event when a user account is added or removed from localstorage in a different browser tab or window
     */
    enableAccountStorageEvents(): void {
        if (typeof window === "undefined") {
            return;
        }

        if (!this.listeningToStorageEvents) {
            this.logger.verbose("Adding account storage listener.");
            this.listeningToStorageEvents = true;
            window.addEventListener("storage", this.handleAccountCacheChange);
        } else {
            this.logger.verbose("Account storage listener already registered.");
        }
    }

    /**
     * Removes event listener that emits an event when a user account is added or removed from localstorage in a different browser tab or window
     */
    disableAccountStorageEvents(): void {
        if (typeof window === "undefined") {
            return;
        }

        if (this.listeningToStorageEvents) {
            this.logger.verbose("Removing account storage listener.");
            window.removeEventListener(
                "storage",
                this.handleAccountCacheChange
            );
            this.listeningToStorageEvents = false;
        } else {
            this.logger.verbose("No account storage listener registered.");
        }
    }

    /**
     * Emit account added/removed events when cached accounts are changed in a different tab or frame
     */
    protected handleAccountCacheChange(e: StorageEvent): void {
        try {
            // Handle active account filter change
            if (e.key?.includes(PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS)) {
                // This event has no payload, it only signals cross-tab app instances that the results of calling getActiveAccount() will have changed
                this.eventHandler.emitEvent(EventType.ACTIVE_ACCOUNT_CHANGED);
            }

            // Handle account object change
            const cacheValue = e.newValue || e.oldValue;
            if (!cacheValue) {
                return;
            }
            const parsedValue = JSON.parse(cacheValue);
            if (
                typeof parsedValue !== "object" ||
                !AccountEntity.isAccountEntity(parsedValue)
            ) {
                return;
            }
            const accountEntity = CacheManager.toObject<AccountEntity>(
                new AccountEntity(),
                parsedValue
            );
            const accountInfo = accountEntity.getAccountInfo();
            if (!e.oldValue && e.newValue) {
                this.logger.info(
                    "Account was added to cache in a different window"
                );
                this.eventHandler.emitEvent(
                    EventType.ACCOUNT_ADDED,
                    undefined,
                    accountInfo
                );
            } else if (!e.newValue && e.oldValue) {
                this.logger.info(
                    "Account was removed from cache in a different window"
                );
                this.eventHandler.emitEvent(
                    EventType.ACCOUNT_REMOVED,
                    undefined,
                    accountInfo
                );
            }
        } catch (e) {
            return;
        }
    }

    /**
     * Gets the token cache for the application.
     */
    getTokenCache(): ITokenCache {
        return this.tokenCache;
    }

    /**
     * Returns the logger instance
     */
    public getLogger(): Logger {
        return this.logger;
    }

    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger Logger instance
     */
    setLogger(logger: Logger): void {
        this.logger = logger;
    }

    /**
     * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
     * @param sku
     * @param version
     */
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        // Validate the SKU passed in is one we expect
        this.browserStorage.setWrapperMetadata(sku, version);
    }

    /**
     * Sets navigation client
     * @param navigationClient
     */
    setNavigationClient(navigationClient: INavigationClient): void {
        this.navigationClient = navigationClient;
    }

    /**
     * Returns the configuration object
     */
    public getConfiguration(): BrowserConfiguration {
        return this.config;
    }

    /**
     * Returns the performance client
     */
    public getPerformanceClient(): IPerformanceClient {
        return this.performanceClient;
    }

    /**
     * Returns the browser env indicator
     */
    public isBrowserEnv(): boolean {
        return this.isBrowserEnvironment;
    }

    /**
     * Generates a correlation id for a request if none is provided.
     *
     * @protected
     * @param {?Partial<BaseAuthRequest>} [request]
     * @returns {string}
     */
    protected getRequestCorrelationId(
        request?: Partial<BaseAuthRequest>
    ): string {
        if (request?.correlationId) {
            return request.correlationId;
        }

        if (this.isBrowserEnvironment) {
            return createNewGuid();
        }

        /*
         * Included for fallback for non-browser environments,
         * and to ensure this method always returns a string.
         */
        return Constants.EMPTY_STRING;
    }

    // #endregion

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    async loginRedirect(request?: RedirectRequest): Promise<void> {
        const correlationId: string = this.getRequestCorrelationId(request);
        this.logger.verbose("loginRedirect called", correlationId);
        return this.acquireTokenRedirect({
            correlationId,
            ...(request || DEFAULT_REQUEST),
        });
    }

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
        const correlationId: string = this.getRequestCorrelationId(request);
        this.logger.verbose("loginPopup called", correlationId);
        return this.acquireTokenPopup({
            correlationId,
            ...(request || DEFAULT_REQUEST),
        });
    }

    /**
     * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
     *
     * @param {@link (SilentRequest:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async acquireTokenSilent(
        request: SilentRequest
    ): Promise<AuthenticationResult> {
        const correlationId = this.getRequestCorrelationId(request);
        const atsMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        atsMeasurement.add({
            cacheLookupPolicy: request.cacheLookupPolicy,
            scenarioId: request.scenarioId,
        });

        preflightCheck(this.initialized, atsMeasurement);
        this.logger.verbose("acquireTokenSilent called", correlationId);

        const account = request.account || this.getActiveAccount();
        if (!account) {
            throw createBrowserAuthError(BrowserAuthErrorCodes.noAccountError);
        }
        atsMeasurement.add({ accountType: getAccountType(account) });

        const thumbprint: RequestThumbprint = {
            clientId: this.config.auth.clientId,
            authority: request.authority || Constants.EMPTY_STRING,
            scopes: request.scopes,
            homeAccountIdentifier: account.homeAccountId,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
            shrOptions: request.shrOptions,
        };
        const silentRequestKey = JSON.stringify(thumbprint);

        const cachedResponse =
            this.activeSilentTokenRequests.get(silentRequestKey);
        if (typeof cachedResponse === "undefined") {
            this.logger.verbose(
                "acquireTokenSilent called for the first time, storing active request",
                correlationId
            );

            const response = invokeAsync(
                this.acquireTokenSilentAsync.bind(this),
                PerformanceEvents.AcquireTokenSilentAsync,
                this.logger,
                this.performanceClient,
                correlationId
            )(
                {
                    ...request,
                    correlationId,
                },
                account
            )
                .then((result) => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                    atsMeasurement.end({
                        success: true,
                        fromCache: result.fromCache,
                        isNativeBroker: result.fromNativeBroker,
                        cacheLookupPolicy: request.cacheLookupPolicy,
                        requestId: result.requestId,
                        accessTokenSize: result.accessToken.length,
                        idTokenSize: result.idToken.length,
                    });
                    return result;
                })
                .catch((error: Error) => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                    atsMeasurement.end(
                        {
                            success: false,
                        },
                        error
                    );
                    throw error;
                });
            this.activeSilentTokenRequests.set(silentRequestKey, response);
            return {
                ...(await response),
                state: request.state,
            };
        } else {
            this.logger.verbose(
                "acquireTokenSilent has been called previously, returning the result from the first call",
                correlationId
            );
            // Discard measurements for memoized calls, as they are usually only a couple of ms and will artificially deflate metrics
            atsMeasurement.discard();
            return {
                ...(await cachedResponse),
                state: request.state,
            };
        }
    }

    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * @param {@link (SilentRequest:type)}
     * @param {@link (AccountInfo:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse}
     */
    protected async acquireTokenSilentAsync(
        request: SilentRequest & { correlationId: string },
        account: AccountInfo
    ): Promise<AuthenticationResult> {
        const trackPageVisibility = () =>
            this.trackPageVisibility(request.correlationId);
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            request.correlationId
        );

        this.eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            InteractionType.Silent,
            request
        );

        if (request.correlationId) {
            this.performanceClient.incrementFields(
                { visibilityChangeCount: 0 },
                request.correlationId
            );
        }

        document.addEventListener("visibilitychange", trackPageVisibility);

        const silentRequest = await invokeAsync(
            initializeSilentRequest,
            PerformanceEvents.InitializeSilentRequest,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request, account, this.config, this.performanceClient, this.logger);
        const cacheLookupPolicy =
            request.cacheLookupPolicy || CacheLookupPolicy.Default;

        const result = this.acquireTokenSilentNoIframe(
            silentRequest,
            cacheLookupPolicy
        ).catch(async (refreshTokenError: AuthError) => {
            const shouldTryToResolveSilently =
                checkIfRefreshTokenErrorCanBeResolvedSilently(
                    refreshTokenError,
                    cacheLookupPolicy
                );

            if (shouldTryToResolveSilently) {
                if (!this.activeIframeRequest) {
                    let _resolve: (result: boolean) => void;
                    // Always set the active request tracker immediately after checking it to prevent races
                    this.activeIframeRequest = [
                        new Promise((resolve) => {
                            _resolve = resolve;
                        }),
                        silentRequest.correlationId,
                    ];
                    this.logger.verbose(
                        "Refresh token expired/invalid or CacheLookupPolicy is set to Skip, attempting acquire token by iframe.",
                        silentRequest.correlationId
                    );
                    return invokeAsync(
                        this.acquireTokenBySilentIframe.bind(this),
                        PerformanceEvents.AcquireTokenBySilentIframe,
                        this.logger,
                        this.performanceClient,
                        silentRequest.correlationId
                    )(silentRequest)
                        .then((iframeResult) => {
                            _resolve(true);
                            return iframeResult;
                        })
                        .catch((e) => {
                            _resolve(false);
                            throw e;
                        })
                        .finally(() => {
                            this.activeIframeRequest = undefined;
                        });
                } else if (cacheLookupPolicy !== CacheLookupPolicy.Skip) {
                    const [activePromise, activeCorrelationId] =
                        this.activeIframeRequest;
                    this.logger.verbose(
                        `Iframe request is already in progress, awaiting resolution for request with correlationId: ${activeCorrelationId}`,
                        silentRequest.correlationId
                    );
                    const awaitConcurrentIframeMeasure =
                        this.performanceClient.startMeasurement(
                            PerformanceEvents.AwaitConcurrentIframe,
                            silentRequest.correlationId
                        );
                    awaitConcurrentIframeMeasure.add({
                        awaitIframeCorrelationId: activeCorrelationId,
                    });

                    const activePromiseResult = await activePromise;
                    awaitConcurrentIframeMeasure.end({
                        success: activePromiseResult,
                    });
                    if (activePromiseResult) {
                        this.logger.verbose(
                            `Parallel iframe request with correlationId: ${activeCorrelationId} succeeded. Retrying cache and/or RT redemption`,
                            silentRequest.correlationId
                        );
                        // Retry cache lookup and/or RT exchange after iframe completes
                        return this.acquireTokenSilentNoIframe(
                            silentRequest,
                            cacheLookupPolicy
                        );
                    } else {
                        this.logger.info(
                            `Iframe request with correlationId: ${activeCorrelationId} failed. Interaction is required.`
                        );
                        // If previous iframe request failed, it's unlikely to succeed this time. Throw original error.
                        throw refreshTokenError;
                    }
                } else {
                    // Cache policy set to skip and another iframe request is already in progress
                    this.logger.warning(
                        "Another iframe request is currently in progress and CacheLookupPolicy is set to Skip. This may result in degraded performance and/or reliability for both calls. Please consider changing the CacheLookupPolicy to take advantage of request queuing and token cache.",
                        silentRequest.correlationId
                    );
                    return invokeAsync(
                        this.acquireTokenBySilentIframe.bind(this),
                        PerformanceEvents.AcquireTokenBySilentIframe,
                        this.logger,
                        this.performanceClient,
                        silentRequest.correlationId
                    )(silentRequest);
                }
            } else {
                // Error cannot be silently resolved or iframe renewal is not allowed, interaction required
                throw refreshTokenError;
            }
        });

        return result
            .then((response) => {
                this.eventHandler.emitEvent(
                    EventType.ACQUIRE_TOKEN_SUCCESS,
                    InteractionType.Silent,
                    response
                );
                if (request.correlationId) {
                    this.performanceClient.addFields(
                        {
                            fromCache: response.fromCache,
                            isNativeBroker: response.fromNativeBroker,
                            requestId: response.requestId,
                        },
                        request.correlationId
                    );
                }

                return response;
            })
            .catch((tokenRenewalError: Error) => {
                this.eventHandler.emitEvent(
                    EventType.ACQUIRE_TOKEN_FAILURE,
                    InteractionType.Silent,
                    null,
                    tokenRenewalError
                );
                throw tokenRenewalError;
            })
            .finally(() => {
                document.removeEventListener(
                    "visibilitychange",
                    trackPageVisibility
                );
            });
    }

    /**
     * AcquireTokenSilent without the iframe fallback. This is used to enable the correct fallbacks in cases where there's a potential for multiple silent requests to be made in parallel and prevent those requests from making concurrent iframe requests.
     * @param silentRequest
     * @param cacheLookupPolicy
     * @returns
     */
    private async acquireTokenSilentNoIframe(
        silentRequest: CommonSilentFlowRequest,
        cacheLookupPolicy: CacheLookupPolicy
    ): Promise<AuthenticationResult> {
        if (
            NativeMessageHandler.isNativeAvailable(
                this.config,
                this.logger,
                this.nativeExtensionProvider,
                silentRequest.authenticationScheme
            ) &&
            silentRequest.account.nativeAccountId
        ) {
            this.logger.verbose(
                "acquireTokenSilent - attempting to acquire token from native platform"
            );
            return this.acquireTokenNative(
                silentRequest,
                ApiId.acquireTokenSilent_silentFlow
            ).catch(async (e: AuthError) => {
                // If native token acquisition fails for availability reasons fallback to web flow
                if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
                    this.logger.verbose(
                        "acquireTokenSilent - native platform unavailable, falling back to web flow"
                    );
                    this.nativeExtensionProvider = undefined; // Prevent future requests from continuing to attempt

                    // Cache will not contain tokens, given that previous WAM requests succeeded. Skip cache and RT renewal and go straight to iframe renewal
                    throw createClientAuthError(
                        ClientAuthErrorCodes.tokenRefreshRequired
                    );
                }
                throw e;
            });
        } else {
            this.logger.verbose(
                "acquireTokenSilent - attempting to acquire token from web flow"
            );
            return invokeAsync(
                this.acquireTokenFromCache.bind(this),
                PerformanceEvents.AcquireTokenFromCache,
                this.logger,
                this.performanceClient,
                silentRequest.correlationId
            )(silentRequest, cacheLookupPolicy).catch(
                (cacheError: AuthError) => {
                    if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                        throw cacheError;
                    }

                    this.eventHandler.emitEvent(
                        EventType.ACQUIRE_TOKEN_NETWORK_START,
                        InteractionType.Silent,
                        silentRequest
                    );

                    return invokeAsync(
                        this.acquireTokenByRefreshToken.bind(this),
                        PerformanceEvents.AcquireTokenByRefreshToken,
                        this.logger,
                        this.performanceClient,
                        silentRequest.correlationId
                    )(silentRequest, cacheLookupPolicy);
                }
            );
        }
    }
}

/**
 * Determines whether an error thrown by the refresh token endpoint can be resolved without interaction
 * @param refreshTokenError
 * @param silentRequest
 * @param cacheLookupPolicy
 * @returns
 */
function checkIfRefreshTokenErrorCanBeResolvedSilently(
    refreshTokenError: AuthError,
    cacheLookupPolicy: CacheLookupPolicy
): boolean {
    const noInteractionRequired = !(
        refreshTokenError instanceof InteractionRequiredAuthError &&
        // For refresh token errors, bad_token does not always require interaction (silently resolvable)
        refreshTokenError.subError !==
            InteractionRequiredAuthErrorCodes.badToken
    );

    // Errors that result when the refresh token needs to be replaced
    const refreshTokenRefreshRequired =
        refreshTokenError.errorCode === BrowserConstants.INVALID_GRANT_ERROR ||
        refreshTokenError.errorCode ===
            ClientAuthErrorCodes.tokenRefreshRequired;

    // Errors that may be resolved before falling back to interaction (through iframe renewal)
    const isSilentlyResolvable =
        (noInteractionRequired && refreshTokenRefreshRequired) ||
        refreshTokenError.errorCode ===
            InteractionRequiredAuthErrorCodes.noTokensFound ||
        refreshTokenError.errorCode ===
            InteractionRequiredAuthErrorCodes.refreshTokenExpired;

    // Only these policies allow for an iframe renewal attempt
    const tryIframeRenewal = iFrameRenewalPolicies.includes(cacheLookupPolicy);

    return isSilentlyResolvable && tryIframeRenewal;
}
