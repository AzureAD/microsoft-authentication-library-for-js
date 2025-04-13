/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, IPerformanceClient, ICrypto, DEFAULT_CRYPTO_IMPLEMENTATION, AccountFilter, AccountInfo, CommonAuthorizationUrlRequest, CommonSilentFlowRequest, PerformanceCallbackFunction, Constants, BaseAuthRequest, PerformanceEvents, PkceCodes, InProgressPerformanceEvent, RequestThumbprint, AuthError, InteractionRequiredAuthError, InteractionRequiredAuthErrorCodes, ClientAuthErrorCodes, createClientAuthError, PromptValue } from "@azure/msal-common/browser";
import { BrowserCacheManager, DEFAULT_BROWSER_CACHE_MANAGER } from "../cache/BrowserCacheManager.js";
import { ITokenCache } from "../cache/ITokenCache.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { CryptoOps } from "../crypto/CryptoOps.js";
import { EventHandler } from "../event/EventHandler.js";
import { EventCallbackFunction } from "../event/EventMessage.js";
import { EventType } from "../event/EventType.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { UnknownOperatingContext } from "../operatingcontext/UnknownOperatingContext.js";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { ApiId, CacheLookupPolicy, DEFAULT_REQUEST, InteractionType, WrapperSKU } from "../utils/BrowserConstants.js";
import { blockAPICallsBeforeInitialize, blockNonBrowserEnvironment, invokeAsync } from "../utils/BrowserUtils.js";
import { IController } from "./IController.js";
import { BaseOperatingContext } from "../operatingcontext/BaseOperatingContext.js";
import { InitializeApplicationRequest } from "../request/InitializeApplicationRequest.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { BrowserUtils } from "../index.js";
import { BrowserAuthErrorCodes, createBrowserAuthError } from "../error/BrowserAuthError.js";
import { initializeSilentRequest } from "../request/RequestHelpers.js";
import { isFatalNativeAuthError, NativeAuthError } from "../error/NativeAuthError.js";
import { SilentCacheClient } from "../interaction_client/SilentCacheClient.js";
import { SilentRefreshClient } from "../interaction_client/SilentRefreshClient.js";
import * as AccountManager from "../cache/AccountManager.js";
import { PopupClient } from "../interaction_client/PopupClient.js";
import { BrowserExtensionClient } from "../interaction_client/BrowserExtensionClient.js";

// TODO: Dedupe with StandardController
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

// TODO: Dedupe with StandardController
function preflightCheck(
    initialized: boolean,
    performanceEvent: InProgressPerformanceEvent
) {
    try {
        BrowserUtils.preflightCheckExtension(initialized);
    } catch (e) {
        performanceEvent.end({ success: false }, e);
        throw e;
    }
}

export class BrowserExtensionController implements IController {
// OperatingContext
    protected readonly operatingContext: UnknownOperatingContext;

    // Logger
    protected logger: Logger;

    // Storage interface implementation
    protected readonly browserStorage: BrowserCacheManager;

    // Input configuration by developer/user
    protected readonly config: BrowserConfiguration;

    // Performance telemetry client
    protected readonly performanceClient: IPerformanceClient;

    // Event handler
    private readonly eventHandler: EventHandler;

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Navigation interface implementation
    protected navigationClient: INavigationClient;

    // Flag to indicate if in browser environment
    protected isBrowserEnvironment: boolean;

    // Flag representing whether or not the initialize API has been called and completed
    protected initialized: boolean = false;

    // Active requests
    private activeSilentTokenRequests: Map<
    string,
    Promise<AuthenticationResult>
    >;

    private ssoSilentMeasurement?: InProgressPerformanceEvent;
    private acquireTokenByCodeAsyncMeasurement?: InProgressPerformanceEvent;

    // Native Extension Provider
    protected nativeExtensionProvider: NativeMessageHandler | undefined;

    private pkceCode: PkceCodes | undefined;
    nativeInternalStorage: BrowserCacheManager;

    constructor(operatingContext: UnknownOperatingContext) {
        this.operatingContext = operatingContext;

        this.isBrowserEnvironment =
            this.operatingContext.isBrowserEnvironment();

        this.config = operatingContext.getConfig();

        this.logger = operatingContext.getLogger();

        this.navigationClient = this.config.system.navigationClient;

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
                    this.performanceClient,
                    this.eventHandler,
                    undefined
                )
            : DEFAULT_BROWSER_CACHE_MANAGER(
                    this.config.auth.clientId,
                    this.logger,
                    this.performanceClient,
                    this.eventHandler
                );
                
        this.activeSilentTokenRequests = new Map();

        // Register listener functions
        this.trackPageVisibility = this.trackPageVisibility.bind(this);

        // Register listener functions
        this.trackPageVisibilityWithMeasurement =
            this.trackPageVisibilityWithMeasurement.bind(this);
    }

    static async createController(
            operatingContext: BaseOperatingContext,
            request?: InitializeApplicationRequest
        ): Promise<IController> {
            const controller = new BrowserExtensionController(operatingContext);
            await controller.initialize(request);
            return controller;
    };

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
    
    getBrowserStorage(): BrowserCacheManager {
        return this.browserStorage;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAccount(accountFilter: AccountFilter): AccountInfo | null {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAccountByLocalId(localAccountId: string): AccountInfo | null {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAccountByUsername(username: string): AccountInfo | null {
        return null;
    }

    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    getAllAccounts(accountFilter?: AccountFilter): AccountInfo[] {
        return AccountManager.getAllAccounts(
            this.logger,
            this.browserStorage,
            true,
            accountFilter
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

        const initCorrelationId =
            request?.correlationId || this.getRequestCorrelationId();
        const allowPlatformBroker = this.config.system.allowPlatformBroker;
        const initMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.InitializeClientApplication,
            initCorrelationId
        );
        this.eventHandler.emitEvent(EventType.INITIALIZE_START);

        await invokeAsync(
            this.browserStorage.initialize.bind(this.browserStorage),
            PerformanceEvents.InitializeCache,
            this.logger,
            this.performanceClient,
            initCorrelationId
        )(initCorrelationId);

        if (allowPlatformBroker) {
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

        this.config.system.asyncPopups &&
            (await this.preGeneratePkceCodes(initCorrelationId));
        this.initialized = true;
        this.eventHandler.emitEvent(EventType.INITIALIZE_END);
        initMeasurement.end({
            allowPlatformBroker: allowPlatformBroker,
            success: true,
        });
    }

    /**
     * Pre-generates PKCE codes and stores it in local variable
     * @param correlationId
     */
    private async preGeneratePkceCodes(correlationId: string): Promise<void> {
        this.logger.verbose("Generating new PKCE codes");
        this.pkceCode = await invokeAsync(
            generatePkceCodes,
            PerformanceEvents.GeneratePkceCodes,
            this.logger,
            this.performanceClient,
            correlationId
        )(this.performanceClient, this.logger, correlationId);
        return Promise.resolve();
    }

    /**
     * Provides pre-generated PKCE codes, if any
     * @param correlationId
     */
    private getPreGeneratedPkceCodes(
        correlationId: string
    ): PkceCodes | undefined {
        this.logger.verbose("Attempting to pick up pre-generated PKCE codes");
        const res = this.pkceCode ? { ...this.pkceCode } : undefined;
        this.pkceCode = undefined;
        this.logger.verbose(
            `${res ? "Found" : "Did not find"} pre-generated PKCE codes`
        );
        this.performanceClient.addFields(
            { usePreGeneratedPkce: !!res },
            correlationId
        );
        return res;
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
         * Returns new instance of the Popup Interaction Client
         * @param correlationId
         */
        public createExtensionClient(correlationId?: string): BrowserExtensionClient {
            return new BrowserExtensionClient(
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
     * Returns boolean indicating if this request can use the platform broker
     * @param request
     */
    public canUsePlatformBroker(
        request: RedirectRequest | PopupRequest | SsoSilentRequest,
        accountId?: string
    ): boolean {
        this.logger.trace("canUsePlatformBroker called");
        if (
            !NativeMessageHandler.isPlatformBrokerAvailable(
                this.config,
                this.logger,
                this.nativeExtensionProvider,
                request.authenticationScheme
            )
        ) {
            this.logger.trace(
                "canUsePlatformBroker: isPlatformBrokerAvailable returned false, returning false"
            );
            return false;
        }

        if (request.prompt) {
            switch (request.prompt) {
                case PromptValue.NONE:
                case PromptValue.CONSENT:
                case PromptValue.LOGIN:
                    this.logger.trace(
                        "canUsePlatformBroker: prompt is compatible with platform broker flow"
                    );
                    break;
                default:
                    this.logger.trace(
                        `canUsePlatformBroker: prompt = ${request.prompt} is not compatible with platform broker flow, returning false`
                    );
                    return false;
            }
        }

        if (!accountId && !this.getNativeAccountId(request)) {
            this.logger.trace(
                "canUsePlatformBroker: nativeAccountId is not available, returning false"
            );
            return false;
        }

        return true;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        const correlationId = this.getRequestCorrelationId(request);
        const atExtensionMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenExtension,
            correlationId
        );
        atExtensionMeasurement.add({
            scenarioId: request.scenarioId,
            accountType: getAccountType(request.account),
        });
        try {
            this.logger.verbose("acquireTokenExtension called");
            preflightCheck(this.initialized, atExtensionMeasurement);
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
        const pkce = this.getPreGeneratedPkceCodes(correlationId);

        if (this.canUsePlatformBroker(request)) {
            result = this.acquireTokenNative(
                {
                    ...request,
                    correlationId,
                },
                ApiId.acquireTokenPopup
            )
                .then((response) => {
                    this.browserStorage.setInteractionInProgress(false);
                    atExtensionMeasurement.end({
                        success: true,
                        isNativeBroker: true,
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
                        return popupClient.acquireToken(request, pkce);
                    } else if (e instanceof InteractionRequiredAuthError) {
                        this.logger.verbose(
                            "acquireTokenPopup - Resolving interaction required error thrown by native broker by falling back to web flow"
                        );
                        const popupClient =
                            this.createPopupClient(correlationId);
                        return popupClient.acquireToken(request, pkce);
                    }
                    this.browserStorage.setInteractionInProgress(false);
                    throw e;
                });
        } else {
            const extensionClient = this.createExtensionClient(correlationId);
            result = extensionClient.acquireToken(request, pkce);
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

                atExtensionMeasurement.end({
                    success: true,
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

                atExtensionMeasurement.end(
                    {
                        success: false,
                    },
                    e
                );

                // Since this function is syncronous we need to reject
                return Promise.reject(e);
            })
            .finally(
                () =>
                    this.config.system.asyncPopups &&
                    this.preGeneratePkceCodes(correlationId)
            );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return Promise.resolve();
    }
    
    async acquireTokenSilent(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    
            // document.addEventListener("visibilitychange", trackPageVisibility);
    
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
                // Error cannot be silently resolved or iframe renewal is not allowed, interaction required
                throw refreshTokenError;
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
                NativeMessageHandler.isPlatformBrokerAvailable(
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

    acquireTokenByCode(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<AuthenticationResult>;
    }
    acquireTokenNative(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request:
            | PopupRequest
            | SilentRequest
            | Partial<
                    Omit<
                        CommonAuthorizationUrlRequest,
                        | "responseMode"
                        | "codeChallenge"
                        | "codeChallengeMethod"
                        | "requestedClaimsHash"
                        | "platformBroker"
                    >
                >,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        apiId: ApiId,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        accountId?: string | undefined
    ): Promise<AuthenticationResult> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<AuthenticationResult>;
    }

    addEventCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        callback: EventCallbackFunction,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        eventTypes?: Array<EventType>
    ): string | null {
        return null;
    }
    removeEventCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        callbackId: string
    ): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return "";
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removePerformanceCallback(callbackId: string): boolean {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return true;
    }
    enableAccountStorageEvents(): void {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }
    disableAccountStorageEvents(): void {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }

    handleRedirectPromise(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hash?: string | undefined
    ): Promise<AuthenticationResult | null> {
        blockAPICallsBeforeInitialize(this.initialized);
        return Promise.resolve(null);
    }
    loginPopup(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request?: PopupRequest | undefined
    ): Promise<AuthenticationResult> {
       // TODO: Add preflight checks and initialization
        const correlationId: string = this.getRequestCorrelationId(request);
        this.logger.verbose("loginPopup called", correlationId);
        return this.acquireTokenPopup({
            correlationId,
            ...(request || DEFAULT_REQUEST),
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<void>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loginExtension(request?: RedirectRequest | undefined): Promise<AuthenticationResult> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<AuthenticationResult>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout(logoutRequest?: EndSessionRequest | undefined): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<void>;
    }
    logoutRedirect(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        logoutRequest?: EndSessionRequest | undefined
    ): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<void>;
    }
    logoutPopup(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        logoutRequest?: EndSessionPopupRequest | undefined
    ): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<void>;
    }
    ssoSilent(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: Partial<
            Omit<
                CommonAuthorizationUrlRequest,
                | "responseMode"
                | "codeChallenge"
                | "codeChallengeMethod"
                | "requestedClaimsHash"
                | "platformBroker"
            >
        >
    ): Promise<AuthenticationResult> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<AuthenticationResult>;
    }
    getTokenCache(): ITokenCache {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as ITokenCache;
    }
    getLogger(): Logger {
        return this.logger;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLogger(logger: Logger): void {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setActiveAccount(account: AccountInfo | null): void {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }
    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        return AccountManager.getActiveAccount(this.browserStorage);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        this.browserStorage.setWrapperMetadata(sku, version);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNavigationClient(navigationClient: INavigationClient): void {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }
    getConfiguration(): BrowserConfiguration {
        return this.config;
    }
    isBrowserEnv(): boolean {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return true;
    }
    getBrowserCrypto(): ICrypto {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as ICrypto;
    }
    getPerformanceClient(): IPerformanceClient {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as IPerformanceClient;
    }
    getRedirectResponse(): Map<string, Promise<AuthenticationResult | null>> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Map<string, Promise<AuthenticationResult | null>>;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async clearCache(logoutRequest?: ClearCacheRequest): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async hydrateCache(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        result: AuthenticationResult,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
    }
}
