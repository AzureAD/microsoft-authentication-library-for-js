/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationUrlRequest,
    CommonSilentFlowRequest,
    PerformanceCallbackFunction,
    AccountInfo,
    Logger,
    ICrypto,
    IPerformanceClient,
    AccountFilter,
    BaseAuthRequest,
    PerformanceEvents,
    invokeAsync,
    Constants,
    AccountEntity,
    InProgressPerformanceEvent,
    AuthError,
    getRequestThumbprint,
    ClientAuthErrorCodes,
    createClientAuthError,
    INetworkModule,
} from "@azure/msal-common/browser";
import { ITokenCache } from "../cache/ITokenCache.js";
import { BrowserConfiguration, CacheOptions } from "../config/Configuration.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest.js";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { ApiId, BrowserCacheLocation, CacheLookupPolicy, InteractionType, WrapperSKU } from "../utils/BrowserConstants.js";
import { IController } from "./IController.js";
import { CryptoOps } from "../crypto/CryptoOps.js";
import {
    blockAPICallsBeforeInitialize,
    blockNonBrowserEnvironment,
} from "../utils/BrowserUtils.js";
import { EventCallbackFunction } from "../event/EventMessage.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import { EventType } from "../event/EventType.js";
import { EventHandler } from "../event/EventHandler.js";
import { BaseOperatingContext } from "../operatingcontext/BaseOperatingContext.js";
import { InitializeApplicationRequest } from "../request/InitializeApplicationRequest.js";
import { createNewGuid } from "../crypto/WorkerCrypto.js";
import { WorkerOperatingContext } from "../operatingcontext/WorkerOperatingContext.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { DEFAULT_WORKER_CACHE_MANAGER, WorkerCacheManager } from "../cache/WorkerCacheManager.js";
import * as AsyncAccountManager from "../cache/AsyncAccountManager.js";
import { BrowserAuthErrorCodes, createBrowserAuthError } from "../error/BrowserAuthError.js";
import { initializeSilentRequest } from "../request/RequestHelpers.js";
// import { NativeAuthError, isFatalNativeAuthError } from "../error/NativeAuthError.js";
import { SilentCacheClient } from "../interaction_client/SilentCacheClient.js";
import { SilentRefreshClient } from "../interaction_client/SilentRefreshClient.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { NativeInteractionClient } from "../interaction_client/NativeInteractionClient.js";
import { isFatalNativeAuthError, NativeAuthError } from "../error/NativeAuthError.js";

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
        // Block token acquisition before initialize has been called
        blockAPICallsBeforeInitialize(initialized);
    } catch (e) {
        performanceEvent.end({ success: false }, e);
        throw e;
    }
}

/**
 * WorkerController class
 */
export class WorkerController implements IController {
    // OperatingContext
    protected readonly operatingContext: WorkerOperatingContext;

    // Logger
    protected logger: Logger;

    // Storage interface implementation
    protected readonly workerStorage: WorkerCacheManager;

    // Native Cache in memory storage implementation
    protected readonly nativeInternalStorage: BrowserCacheManager;

    // Network interface implementation
    protected readonly networkClient: INetworkModule;

    // Input configuration by developer/user
    protected readonly config: BrowserConfiguration;

    // Performance telemetry client
    protected readonly performanceClient: IPerformanceClient;

    // Event handler
    private readonly eventHandler: EventHandler;

    // Native Extension Provider
    protected nativeExtensionProvider: NativeMessageHandler | undefined;

    // Crypto interface implementation
    protected readonly workerCrypto: ICrypto;

    // Flag to indicate if in browser environment
    protected isBrowserEnvironment: boolean;

    protected isWorkerEnvironment: boolean;

    // Navigation interface implementation
    protected navigationClient: INavigationClient;

    // Flag representing whether or not the initialize API has been called and completed
    protected initialized: boolean = false;
        // Active requests
    private activeSilentTokenRequests: Map<
        string,
        Promise<AuthenticationResult>
    >;

    constructor(operatingContext: WorkerOperatingContext) {
        this.operatingContext = operatingContext;

        this.isBrowserEnvironment =
            this.operatingContext.isBrowserEnvironment();
        
        this.isWorkerEnvironment = this.operatingContext.isWorkerEnvironment();

        this.config = operatingContext.getConfig();

        this.logger = operatingContext.getLogger();

        this.networkClient = this.config.system.networkClient;

        // Initialize performance client
        this.performanceClient = this.config.telemetry.client;

        // Initialize the crypto class.
        this.workerCrypto = new CryptoOps(this.logger, this.performanceClient);

        this.eventHandler = new EventHandler(this.logger);

        this.navigationClient = this.config.system.navigationClient;

        // Initialize the browser storage class.
        this.workerStorage = this.isWorkerEnvironment
            ? new WorkerCacheManager(
                  this.config.auth.clientId,
                  this.config.cache,
                  this.workerCrypto,
                  this.logger,
                  this.performanceClient,
                  this.eventHandler,
                  undefined
              )
            : DEFAULT_WORKER_CACHE_MANAGER(
                  this.config.auth.clientId,
                  this.logger,
                  this.performanceClient,
                  this.eventHandler
              );

              this.activeSilentTokenRequests = new Map();

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
            this.workerCrypto,
            this.logger,
            this.performanceClient,
            this.eventHandler,
        )
    }
    
    // TODO: Dedupe with StandardController
    static async createController(
        operatingContext: BaseOperatingContext,
        request?: InitializeApplicationRequest
    ): Promise<IController> {
        const controller = new WorkerController(operatingContext);
        await controller.initialize(request);
        return controller;
    }

    // TODO: Dedupe with StandardController
    /**
     * Initializer function to perform async startup tasks such as connecting to WAM extension
     * @param request {?InitializeApplicationRequest} correlation id
     */
    async initialize(request?: InitializeApplicationRequest): Promise<void> {
        this.logger.trace("initialize WorkerOperatingContext called");
        if (this.initialized) {
            this.logger.info(
                "initialize has already been called, exiting early."
            );
            return;
        }

        if (this.isBrowserEnvironment) {
            this.logger.info("in browser environment, exiting early.");
            this.initialized = true;
            this.eventHandler.emitEvent(EventType.INITIALIZE_END);
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
            this.workerStorage.initialize.bind(this.workerStorage),
            PerformanceEvents.InitializeCache,
            this.logger,
            this.performanceClient,
            initCorrelationId
        )();

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
                this.workerStorage.clearTokensAndKeysWithClaims.bind(
                    this.workerStorage
                ),
                PerformanceEvents.ClearTokensAndKeysWithClaims,
                this.logger,
                this.performanceClient,
                initCorrelationId
            )(this.performanceClient, initCorrelationId);
        }

        /*
         * this.config.system.asyncPopups &&
         *     (await this.preGeneratePkceCodes(initCorrelationId));
         */
        this.initialized = true;
        this.eventHandler.emitEvent(EventType.INITIALIZE_END);
        initMeasurement.end({
            allowPlatformBroker: allowPlatformBroker,
            success: true,
        });
    }

    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    async getAllAccountsAsync(accountFilter?: AccountFilter): Promise<AccountInfo[]> {
        return AsyncAccountManager.getAllAccounts(
            this.logger,
            this.workerStorage,
            accountFilter
        );
    }

    /**
     * Returns the first account found in the cache that matches the account filter passed in.
     * @param accountFilter
     * @returns The first account found in the cache matching the provided filter or null if no account could be found.
     */
    async getAccountAsync(accountFilter: AccountFilter): Promise<AccountInfo | null> {
        return AsyncAccountManager.getAccount(
            accountFilter,
            this.logger,
            this.workerStorage,
        );
    }

    /**
     * Gets the currently active account
     */
    async getActiveAccountAsync(): Promise<AccountInfo | null> {
        return AsyncAccountManager.getActiveAccount(this.workerStorage);
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

        const account = request.account || await this.getActiveAccountAsync();
        if (!account) {
            throw createBrowserAuthError(BrowserAuthErrorCodes.noAccountError);
        }
        atsMeasurement.add({ accountType: getAccountType(account) });

        return this.acquireTokenSilentDeduped(request, account, correlationId)
            .then((result) => {
                atsMeasurement.end({
                    success: true,
                    fromCache: result.fromCache,
                    isNativeBroker: result.fromNativeBroker,
                    accessTokenSize: result.accessToken.length,
                    idTokenSize: result.idToken.length,
                });
                return {
                    ...result,
                    state: request.state,
                    correlationId: correlationId, // Ensures PWB scenarios can correctly match request to response
                };
            })
            .catch((error: Error) => {
                if (error instanceof AuthError) {
                    // Ensures PWB scenarios can correctly match request to response
                    error.setCorrelationId(correlationId);
                }

                atsMeasurement.end(
                    {
                        success: false,
                    },
                    error
                );
                throw error;
            });
    }

    /**
     * Checks if identical request is already in flight and returns reference to the existing promise or fires off a new one if this is the first
     * @param request
     * @param account
     * @param correlationId
     * @returns
     */
    private async acquireTokenSilentDeduped(
        request: SilentRequest,
        account: AccountInfo,
        correlationId: string
    ): Promise<AuthenticationResult> {
        const thumbprint = getRequestThumbprint(
            this.config.auth.clientId,
            {
                ...request,
                authority: request.authority || this.config.auth.authority,
                correlationId: correlationId,
            },
            account.homeAccountId
        );
        const silentRequestKey = JSON.stringify(thumbprint);

        const inProgressRequest =
            this.activeSilentTokenRequests.get(silentRequestKey);

        if (typeof inProgressRequest === "undefined") {
            this.logger.verbose(
                "acquireTokenSilent called for the first time, storing active request",
                correlationId
            );
            this.performanceClient.addFields({ deduped: false }, correlationId);

            const activeRequest = invokeAsync(
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
            );
            this.activeSilentTokenRequests.set(silentRequestKey, activeRequest);

            return activeRequest.finally(() => {
                this.activeSilentTokenRequests.delete(silentRequestKey);
            });
        } else {
            this.logger.verbose(
                "acquireTokenSilent has been called previously, returning the result from the first call",
                correlationId
            );
            this.performanceClient.addFields({ deduped: true }, correlationId);
            return inProgressRequest;
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
            // Error cannot be silently resolved since iframes are not allowed
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
        // if the cache policy is set to access_token only, we should not be hitting the native layer yet
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
                ApiId.acquireTokenSilent_silentFlow,
                silentRequest.account.nativeAccountId,
                cacheLookupPolicy
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
            // add logs to identify embedded cache retrieval
            if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                this.logger.verbose(
                    "acquireTokenSilent - cache lookup policy set to AccessToken, attempting to acquire token from local cache"
                );
            }
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
     * Acquire a token from native device (e.g. WAM)
     * @param request
     */
    public async acquireTokenNative(
        request: PopupRequest | SilentRequest | SsoSilentRequest,
        apiId: ApiId,
        accountId?: string,
        cacheLookupPolicy?: CacheLookupPolicy
    ): Promise<AuthenticationResult> {
        this.logger.trace("acquireTokenNative called");
        if (!this.nativeExtensionProvider) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.nativeConnectionNotEstablished
            );
        }

        const nativeClient = new NativeInteractionClient(
            this.config,
            this.workerStorage,
            this.workerCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            apiId,
            this.performanceClient,
            this.nativeExtensionProvider,
            accountId || await this.getNativeAccountId(request),
            this.nativeInternalStorage,
            request.correlationId
        );

        return nativeClient.acquireToken(request, cacheLookupPolicy);
    }

        /**
         * Get the native accountId from the account
         * @param request
         * @returns
         */
    public async getNativeAccountId(
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<string> {
        const account =
            request.account ||
            await this.getAccountAsync({
                loginHint: request.loginHint,
                sid: request.sid,
            }) ||
            await this.getActiveAccountAsync();

        return (account && account.nativeAccountId) || "";
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
                )(commonRequest)
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
            this.workerStorage,
            this.workerCrypto,
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
                this.workerStorage,
                this.workerCrypto,
                this.logger,
                this.eventHandler,
                this.navigationClient,
                this.performanceClient,
                this.nativeExtensionProvider,
                correlationId
            );
        }

    // TODO: Dedupe with StandardController
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

        if (this.isWorkerEnvironment){
            return createNewGuid();
        }

        /*
         * Included for fallback for non-browser environments,
         * and to ensure this method always returns a string.
         */
        return Constants.EMPTY_STRING;
    }

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
        await this.workerStorage.setAccount(
            accountEntity
        );

        /*
         * if (result.fromNativeBroker) {
         *     this.logger.verbose(
         *         "Response was from native broker, storing in-memory"
         *     );
         *     // Tokens from native broker are stored in-memory
         *     return this.nativeInternalStorage.hydrateCache(result, request);
         * } else {
         */
            return this.workerStorage.hydrateCache(result, request);
        // }
    }
    
    getBrowserStorage(): WorkerCacheManager {
        return this.workerStorage;
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
    getAllAccounts(): AccountInfo[] {
        return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<AuthenticationResult>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return Promise.resolve();
    }
    acquireTokenByCode(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: AuthorizationCodeRequest
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
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<AuthenticationResult>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return {} as Promise<void>;
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
                | "earJwk"
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
    getActiveAccount(): AccountInfo | null {
        blockAPICallsBeforeInitialize(this.initialized);
        blockNonBrowserEnvironment();
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        this.workerStorage.setWrapperMetadata(sku, version);
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
}
