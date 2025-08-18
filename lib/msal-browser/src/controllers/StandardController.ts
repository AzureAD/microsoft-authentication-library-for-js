/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "../crypto/CryptoOps.js";
import {
    InteractionRequiredAuthError,
    AccountInfo,
    INetworkModule,
    Logger,
    CommonSilentFlowRequest,
    ICrypto,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    AuthError,
    PerformanceCallbackFunction,
    IPerformanceClient,
    BaseAuthRequest,
    InProgressPerformanceEvent,
    getRequestThumbprint,
    invokeAsync,
    createClientAuthError,
    ClientAuthErrorCodes,
    AccountFilter,
    buildStaticAuthorityOptions,
    InteractionRequiredAuthErrorCodes,
    PkceCodes,
    AccountEntityUtils,
    Constants,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import * as BrowserRootPerformanceEvents from "../telemetry/BrowserRootPerformanceEvents.js";
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
    CacheLookupPolicy,
    DEFAULT_REQUEST,
    BrowserConstants,
    iFrameRenewalPolicies,
    INTERACTION_TYPE,
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
import { PlatformAuthInteractionClient } from "../interaction_client/PlatformAuthInteractionClient.js";
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
import { PlatformAuthRequest } from "../broker/nativeBroker/PlatformAuthRequest.js";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext.js";
import { BaseOperatingContext } from "../operatingcontext/BaseOperatingContext.js";
import { HandleRedirectPromiseOptions, IController } from "./IController.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
import { initializeSilentRequest } from "../request/RequestHelpers.js";
import { InitializeApplicationRequest } from "../request/InitializeApplicationRequest.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
import {
    getPlatformAuthProvider,
    isPlatformAuthAllowed,
} from "../broker/nativeBroker/PlatformAuthProvider.js";
import { IPlatformAuthHandler } from "../broker/nativeBroker/IPlatformAuthHandler.js";
import { collectInstanceStats } from "../utils/MsalFrameStatsUtils.js";

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
    protected readonly oc: StandardOperatingContext;

    // Crypto interface implementation
    protected readonly bc: ICrypto;

    // Storage interface implementation
    protected readonly bs: BrowserCacheManager;

    // Native Cache in memory storage implementation
    protected readonly nis: BrowserCacheManager;

    // Network interface implementation
    protected readonly nc: INetworkModule;

    // Navigation interface implementation
    protected navClient: INavigationClient;

    // Input configuration by developer/user
    protected readonly cfg: BrowserConfiguration;

    // Logger
    protected l: Logger;

    // Flag to indicate if in browser environment
    protected isBrw: boolean;

    protected readonly eh: EventHandler;

    // Redirect Response Object
    protected readonly rr: Map<
        string,
        Promise<AuthenticationResult | null>
    >;

    // Native Extension Provider
    protected pap: IPlatformAuthHandler | undefined;

    // Hybrid auth code responses
    private hacr: Map<string, Promise<AuthenticationResult>>;

    // Performance telemetry client
    protected readonly pc: IPerformanceClient;

    // Flag representing whether or not the initialize API has been called and completed
    protected init: boolean;

    // Active requests
    private astr: Map<
        string,
        Promise<AuthenticationResult>
    >;

    // Active Iframe request
    private air: [Promise<boolean>, string] | undefined;

    private ssm?: InProgressPerformanceEvent;
    private atbcam?: InProgressPerformanceEvent;

    private pkce: PkceCodes | undefined;

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
        this.oc = operatingContext;
        this.isBrw =
            this.oc.isBrowserEnvironment();
        // Set the configuration.
        this.cfg = operatingContext.getConfig();
        this.init = false;

        // Initialize logger
        this.l = this.oc.getLogger();

        // Initialize the network module class.
        this.nc = this.cfg.system.networkClient;

        // Initialize the navigation client class.
        this.navClient = this.cfg.system.navigationClient;

        // Initialize redirectResponse Map
        this.rr = new Map();

        // Initial hybrid spa map
        this.hacr = new Map();

        // Initialize performance client
        this.pc = this.cfg.telemetry.client;

        // Initialize the crypto class.
        this.bc = this.isBrw
            ? new CryptoOps(this.l, this.pc)
            : DEFAULT_CRYPTO_IMPLEMENTATION;

        this.eh = new EventHandler(this.l);

        // Initialize the browser storage class.
        this.bs = this.isBrw
            ? new BrowserCacheManager(
                  this.cfg.auth.clientId,
                  this.cfg.cache,
                  this.bc,
                  this.l,
                  this.pc,
                  this.eh,
                  buildStaticAuthorityOptions(this.cfg.auth)
              )
            : DEFAULT_BROWSER_CACHE_MANAGER(
                  this.cfg.auth.clientId,
                  this.l,
                  this.pc,
                  this.eh
              );

        // initialize in memory storage for native flows
        const nativeCacheOptions: Required<CacheOptions> = {
            cacheLocation: BrowserCacheLocation.MemoryStorage,
            cacheRetentionDays: 5,
        };
        this.nis = new BrowserCacheManager(
            this.cfg.auth.clientId,
            nativeCacheOptions,
            this.bc,
            this.l,
            this.pc,
            this.eh
        );

        this.astr = new Map();

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
        const controller = new StandardController(operatingContext);
        await controller.initialize(request);
        return controller;
    }

    private trackPageVisibility(correlationId?: string): void {
        if (!correlationId) {
            return;
        }
        this.l.info("Perf: Visibility change detected");
        this.pc.incrementFields(
            { visibilityChangeCount: 1 },
            correlationId
        );
    }

    /**
     * Initializer function to perform async startup tasks such as connecting to WAM extension
     * @param request {?InitializeApplicationRequest} correlation id
     */
    async initialize(
        request?: InitializeApplicationRequest,
        isBroker?: boolean
    ): Promise<void> {
        this.l.trace("initialize called");
        if (this.init) {
            this.l.info(
                "initialize has already been called, exiting early."
            );
            return;
        }

        if (!this.isBrw) {
            this.l.info("in non-browser environment, exiting early.");
            this.init = true;
            this.eh.emitEvent(EventType.INITIALIZE_END);
            return;
        }

        const initCorrelationId =
            request?.correlationId || this.getRequestCorrelationId();
        const allowPlatformBroker = this.cfg.system.allowPlatformBroker;
        const initMeasurement = this.pc.startMeasurement(
            BrowserRootPerformanceEvents.InitializeClientApplication,
            initCorrelationId
        );
        this.eh.emitEvent(EventType.INITIALIZE_START);

        // Broker applications are initialized twice, so we avoid double-counting it
        if (!isBroker) {
            try {
                this.logMultipleInstances(initMeasurement);
            } catch {}
        }

        await invokeAsync(
            this.bs.initialize.bind(this.bs),
            BrowserPerformanceEvents.InitializeCache,
            this.l,
            this.pc,
            initCorrelationId
        )(initCorrelationId);

        if (allowPlatformBroker) {
            try {
                // check if platform authentication is available via DOM or browser extension and create relevant handlers
                this.pap = await getPlatformAuthProvider(
                    this.l,
                    this.pc,
                    initCorrelationId,
                    this.cfg.system.nativeBrokerHandshakeTimeout
                );
            } catch (e) {
                this.l.verbose(e as string);
            }
        }

        if (
            this.cfg.cache.cacheLocation ===
            BrowserCacheLocation.LocalStorage
        ) {
            this.eh.subscribeCrossTab();
        }

        !this.cfg.system.navigatePopups &&
            (await this.preGeneratePkceCodes(initCorrelationId));
        this.init = true;
        this.eh.emitEvent(EventType.INITIALIZE_END);
        initMeasurement.end({
            allowPlatformBroker: allowPlatformBroker,
            success: true,
        });
    }

    // #region Redirect Flow

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @param options Object containing optional configuration for redirect promise handling.
     * @returns Token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(
        options?: HandleRedirectPromiseOptions
    ): Promise<AuthenticationResult | null> {
        this.l.verbose("handleRedirectPromise called");
        // Block token acquisition before initialize has been called
        BrowserUtils.blockAPICallsBeforeInitialize(this.init);
        if (this.isBrw) {
            /**
             * Store the promise on the PublicClientApplication instance if this is the first invocation of handleRedirectPromise,
             * otherwise return the promise from the first invocation. Prevents race conditions when handleRedirectPromise is called
             * several times concurrently.
             */
            const redirectResponseKey = options?.hash || "";
            let response = this.rr.get(redirectResponseKey);
            if (typeof response === "undefined") {
                response = this.handleRedirectPromiseInternal(options);
                this.rr.set(redirectResponseKey, response);
                this.l.verbose(
                    "handleRedirectPromise has been called for the first time, storing the promise"
                );
            } else {
                this.l.verbose(
                    "handleRedirectPromise has been called previously, returning the result from the first call"
                );
            }

            return response;
        }
        this.l.verbose(
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
        options?: HandleRedirectPromiseOptions
    ): Promise<AuthenticationResult | null> {
        if (!this.bs.isInteractionInProgress(true)) {
            this.l.info(
                "handleRedirectPromise called but there is no interaction in progress, returning null."
            );
            return null;
        }

        const interactionType =
            this.bs.getInteractionInProgress()?.type;
        if (interactionType === INTERACTION_TYPE.SIGNOUT) {
            this.l.verbose(
                "handleRedirectPromise removing interaction_in_progress flag and returning null after sign-out"
            );
            this.bs.setInteractionInProgress(false);
            return Promise.resolve(null);
        }

        const loggedInAccounts = this.getAllAccounts();
        const platformBrokerRequest: PlatformAuthRequest | null =
            this.bs.getCachedNativeRequest();
        const useNative =
            platformBrokerRequest &&
            this.pap &&
            !options?.hash;

        let rootMeasurement: InProgressPerformanceEvent;

        this.eh.emitEvent(
            EventType.HANDLE_REDIRECT_START,
            InteractionType.Redirect
        );

        let redirectResponse: Promise<AuthenticationResult | null>;
        try {
            if (useNative && this.pap) {
                rootMeasurement = this.pc.startMeasurement(
                    BrowserRootPerformanceEvents.AcquireTokenRedirect,
                    platformBrokerRequest?.correlationId || ""
                );
                this.l.trace(
                    "handleRedirectPromise - acquiring token from native platform"
                );
                const nativeClient = new PlatformAuthInteractionClient(
                    this.cfg,
                    this.bs,
                    this.bc,
                    this.l,
                    this.eh,
                    this.navClient,
                    ApiId.handleRedirectPromise,
                    this.pc,
                    this.pap,
                    platformBrokerRequest.accountId,
                    this.nis,
                    platformBrokerRequest.correlationId
                );

                redirectResponse = invokeAsync(
                    nativeClient.handleRedirectPromise.bind(nativeClient),
                    BrowserPerformanceEvents.HandleNativeRedirectPromiseMeasurement,
                    this.l,
                    this.pc,
                    rootMeasurement.event.correlationId
                )(this.pc, rootMeasurement.event.correlationId);
            } else {
                const [standardRequest, codeVerifier] =
                    this.bs.getCachedRequest();
                const correlationId = standardRequest.correlationId;
                // Reset rootMeasurement now that we have correlationId
                rootMeasurement = this.pc.startMeasurement(
                    BrowserRootPerformanceEvents.AcquireTokenRedirect,
                    correlationId
                );
                this.l.trace(
                    "handleRedirectPromise - acquiring token from web flow"
                );
                const redirectClient = this.createRedirectClient(correlationId);
                redirectResponse = invokeAsync(
                    redirectClient.handleRedirectPromise.bind(redirectClient),
                    BrowserPerformanceEvents.HandleRedirectPromiseMeasurement,
                    this.l,
                    this.pc,
                    rootMeasurement.event.correlationId
                )(standardRequest, codeVerifier, rootMeasurement, options);
            }
        } catch (e) {
            this.bs.resetRequestCache();
            throw e;
        }

        return redirectResponse
            .then((result: AuthenticationResult | null) => {
                if (result) {
                    this.bs.resetRequestCache();
                    // Emit login event if number of accounts change
                    const isLoggingIn =
                        loggedInAccounts.length < this.getAllAccounts().length;
                    if (isLoggingIn) {
                        this.eh.emitEvent(
                            EventType.LOGIN_SUCCESS,
                            InteractionType.Redirect,
                            result
                        );
                        this.l.verbose(
                            "handleRedirectResponse returned result, login success"
                        );
                    } else {
                        this.eh.emitEvent(
                            EventType.ACQUIRE_TOKEN_SUCCESS,
                            InteractionType.Redirect,
                            result
                        );
                        this.l.verbose(
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

                this.eh.emitEvent(
                    EventType.HANDLE_REDIRECT_END,
                    InteractionType.Redirect
                );

                return result;
            })
            .catch((e) => {
                this.bs.resetRequestCache();
                const eventError = e as EventError;
                // Emit login event if there is an account
                if (loggedInAccounts.length > 0) {
                    this.eh.emitEvent(
                        EventType.ACQUIRE_TOKEN_FAILURE,
                        InteractionType.Redirect,
                        null,
                        eventError
                    );
                } else {
                    this.eh.emitEvent(
                        EventType.LOGIN_FAILURE,
                        InteractionType.Redirect,
                        null,
                        eventError
                    );
                }
                this.eh.emitEvent(
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
        this.l.verbose("acquireTokenRedirect called", correlationId);

        const atrMeasurement = this.pc.startMeasurement(
            BrowserRootPerformanceEvents.AcquireTokenPreRedirect,
            correlationId
        );
        atrMeasurement.add({
            accountType: getAccountType(request.account),
            scenarioId: request.scenarioId,
        });

        const configOnRedirectNavigateCb = this.cfg.auth.onRedirectNavigate;
        this.cfg.auth.onRedirectNavigate = (url: string) => {
            const navigate =
                typeof configOnRedirectNavigateCb === "function"
                    ? configOnRedirectNavigateCb(url)
                    : undefined;
            atrMeasurement.add({
                navigateCallbackResult: navigate !== false,
            });
            atrMeasurement.event =
                atrMeasurement.end({ success: true }) || atrMeasurement.event;
            return navigate;
        };

        // If logged in, emit acquire token events
        const isLoggedIn = this.getAllAccounts().length > 0;
        try {
            BrowserUtils.redirectPreflightCheck(this.init, this.cfg);
            this.bs.setInteractionInProgress(
                true,
                INTERACTION_TYPE.SIGNIN
            );

            if (isLoggedIn) {
                this.eh.emitEvent(
                    EventType.ACQUIRE_TOKEN_START,
                    InteractionType.Redirect,
                    request
                );
            } else {
                this.eh.emitEvent(
                    EventType.LOGIN_START,
                    InteractionType.Redirect,
                    request
                );
            }

            let result: Promise<void>;

            if (
                this.pap &&
                this.canUsePlatformBroker(request)
            ) {
                const nativeClient = new PlatformAuthInteractionClient(
                    this.cfg,
                    this.bs,
                    this.bc,
                    this.l,
                    this.eh,
                    this.navClient,
                    ApiId.acquireTokenRedirect,
                    this.pc,
                    this.pap,
                    this.getNativeAccountId(request),
                    this.nis,
                    correlationId
                );
                result = nativeClient
                    .acquireTokenRedirect(request, atrMeasurement)
                    .catch((e: AuthError) => {
                        if (
                            e instanceof NativeAuthError &&
                            isFatalNativeAuthError(e)
                        ) {
                            this.pap = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                            const redirectClient =
                                this.createRedirectClient(correlationId);
                            return redirectClient.acquireToken(request);
                        } else if (e instanceof InteractionRequiredAuthError) {
                            this.l.verbose(
                                "acquireTokenRedirect - Resolving interaction required error thrown by native broker by falling back to web flow"
                            );
                            const redirectClient =
                                this.createRedirectClient(correlationId);
                            return redirectClient.acquireToken(request);
                        }
                        throw e;
                    });
            } else {
                const redirectClient = this.createRedirectClient(correlationId);
                result = redirectClient.acquireToken(request);
            }

            return await result;
        } catch (e) {
            this.bs.resetRequestCache();
            /*
             * Pre-redirect event completes before navigation occurs.
             * Timed out navigation needs to be instrumented separately as a post-redirect event.
             */
            if (atrMeasurement.event.status === 2) {
                this.pc
                    .startMeasurement(
                        BrowserRootPerformanceEvents.AcquireTokenRedirect,
                        correlationId
                    )
                    .end({ success: false }, e);
            } else {
                atrMeasurement.end({ success: false }, e);
            }

            if (isLoggedIn) {
                this.eh.emitEvent(
                    EventType.ACQUIRE_TOKEN_FAILURE,
                    InteractionType.Redirect,
                    null,
                    e as EventError
                );
            } else {
                this.eh.emitEvent(
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
        const atPopupMeasurement = this.pc.startMeasurement(
            BrowserRootPerformanceEvents.AcquireTokenPopup,
            correlationId
        );

        atPopupMeasurement.add({
            scenarioId: request.scenarioId,
            accountType: getAccountType(request.account),
        });

        try {
            this.l.verbose("acquireTokenPopup called", correlationId);
            preflightCheck(this.init, atPopupMeasurement);
            this.bs.setInteractionInProgress(
                true,
                INTERACTION_TYPE.SIGNIN
            );
        } catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }

        // If logged in, emit acquire token events
        const loggedInAccounts = this.getAllAccounts();
        if (loggedInAccounts.length > 0) {
            this.eh.emitEvent(
                EventType.ACQUIRE_TOKEN_START,
                InteractionType.Popup,
                request
            );
        } else {
            this.eh.emitEvent(
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
                    atPopupMeasurement.end({
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
                        this.pap = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                        const popupClient =
                            this.createPopupClient(correlationId);
                        return popupClient.acquireToken(request, pkce);
                    } else if (e instanceof InteractionRequiredAuthError) {
                        this.l.verbose(
                            "acquireTokenPopup - Resolving interaction required error thrown by native broker by falling back to web flow"
                        );
                        const popupClient =
                            this.createPopupClient(correlationId);
                        return popupClient.acquireToken(request, pkce);
                    }
                    throw e;
                });
        } else {
            const popupClient = this.createPopupClient(correlationId);
            result = popupClient.acquireToken(request, pkce);
        }

        return result
            .then((result) => {
                /*
                 *  If logged in, emit acquire token events
                 */
                const isLoggingIn =
                    loggedInAccounts.length < this.getAllAccounts().length;
                if (isLoggingIn) {
                    this.eh.emitEvent(
                        EventType.LOGIN_SUCCESS,
                        InteractionType.Popup,
                        result
                    );
                } else {
                    this.eh.emitEvent(
                        EventType.ACQUIRE_TOKEN_SUCCESS,
                        InteractionType.Popup,
                        result
                    );
                }

                atPopupMeasurement.end({
                    success: true,
                    accessTokenSize: result.accessToken.length,
                    idTokenSize: result.idToken.length,
                    accountType: getAccountType(result.account),
                });
                return result;
            })
            .catch((e: Error) => {
                if (loggedInAccounts.length > 0) {
                    this.eh.emitEvent(
                        EventType.ACQUIRE_TOKEN_FAILURE,
                        InteractionType.Popup,
                        null,
                        e
                    );
                } else {
                    this.eh.emitEvent(
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
            })
            .finally(async () => {
                this.bs.setInteractionInProgress(false);
                if (!this.cfg.system.navigatePopups) {
                    await this.preGeneratePkceCodes(correlationId);
                }
            });
    }

    private trackPageVisibilityWithMeasurement(): void {
        const measurement =
            this.ssm ||
            this.atbcam;
        if (!measurement) {
            return;
        }

        this.l.info(
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
        this.ssm = this.pc.startMeasurement(
            BrowserRootPerformanceEvents.SsoSilent,
            correlationId
        );
        this.ssm?.add({
            scenarioId: request.scenarioId,
            accountType: getAccountType(request.account),
        });
        preflightCheck(this.init, this.ssm);
        this.ssm?.increment({
            visibilityChangeCount: 0,
        });

        document.addEventListener(
            "visibilitychange",
            this.trackPageVisibilityWithMeasurement
        );
        this.l.verbose("ssoSilent called", correlationId);
        this.eh.emitEvent(
            EventType.SSO_SILENT_START,
            InteractionType.Silent,
            validRequest
        );

        let result: Promise<AuthenticationResult>;

        if (this.canUsePlatformBroker(validRequest)) {
            result = this.acquireTokenNative(
                validRequest,
                ApiId.ssoSilent
            ).catch((e: AuthError) => {
                // If native token acquisition fails for availability reasons fallback to standard flow
                if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
                    this.pap = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
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
                this.eh.emitEvent(
                    EventType.SSO_SILENT_SUCCESS,
                    InteractionType.Silent,
                    response
                );
                this.ssm?.end({
                    success: true,
                    isNativeBroker: response.fromPlatformBroker,
                    accessTokenSize: response.accessToken.length,
                    idTokenSize: response.idToken.length,
                    accountType: getAccountType(response.account),
                });
                return response;
            })
            .catch((e: Error) => {
                this.eh.emitEvent(
                    EventType.SSO_SILENT_FAILURE,
                    InteractionType.Silent,
                    null,
                    e
                );
                this.ssm?.end(
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
        this.l.trace("acquireTokenByCode called", correlationId);
        const atbcMeasurement = this.pc.startMeasurement(
            BrowserRootPerformanceEvents.AcquireTokenByCode,
            correlationId
        );
        preflightCheck(this.init, atbcMeasurement);
        this.eh.emitEvent(
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
                let response = this.hacr.get(hybridAuthCode);
                if (!response) {
                    this.l.verbose(
                        "Initiating new acquireTokenByCode request",
                        correlationId
                    );
                    response = this.acquireTokenByCodeAsync({
                        ...request,
                        correlationId,
                    })
                        .then((result: AuthenticationResult) => {
                            this.eh.emitEvent(
                                EventType.ACQUIRE_TOKEN_BY_CODE_SUCCESS,
                                InteractionType.Silent,
                                result
                            );
                            this.hacr.delete(hybridAuthCode);
                            atbcMeasurement.end({
                                success: true,
                                isNativeBroker: result.fromPlatformBroker,
                                accessTokenSize: result.accessToken.length,
                                idTokenSize: result.idToken.length,
                                accountType: getAccountType(result.account),
                            });
                            return result;
                        })
                        .catch((error: Error) => {
                            this.hacr.delete(hybridAuthCode);
                            this.eh.emitEvent(
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
                    this.hacr.set(hybridAuthCode, response);
                } else {
                    this.l.verbose(
                        "Existing acquireTokenByCode request found",
                        correlationId
                    );
                    atbcMeasurement.discard();
                }
                return await response;
            } else if (request.nativeAccountId) {
                if (
                    this.canUsePlatformBroker(request, request.nativeAccountId)
                ) {
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
                            this.pap = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
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
            this.eh.emitEvent(
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
        this.l.trace(
            "acquireTokenByCodeAsync called",
            request.correlationId
        );
        this.atbcam =
            this.pc.startMeasurement(
                BrowserPerformanceEvents.AcquireTokenByCodeAsync,
                request.correlationId
            );
        this.atbcam?.increment({
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
                this.atbcam?.end({
                    success: true,
                    fromCache: response.fromCache,
                    isNativeBroker: response.fromPlatformBroker,
                });
                return response;
            })
            .catch((tokenRenewalError: Error) => {
                this.atbcam?.end(
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
        switch (cacheLookupPolicy) {
            case CacheLookupPolicy.Default:
            case CacheLookupPolicy.AccessToken:
            case CacheLookupPolicy.AccessTokenAndRefreshToken:
                const silentCacheClient = this.createSilentCacheClient(
                    commonRequest.correlationId
                );
                return invokeAsync(
                    silentCacheClient.acquireToken.bind(silentCacheClient),
                    BrowserPerformanceEvents.SilentCacheClientAcquireToken,
                    this.l,
                    this.pc,
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
                    BrowserPerformanceEvents.SilentRefreshClientAcquireToken,
                    this.l,
                    this.pc,
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
        const silentIframeClient = this.createSilentIframeClient(
            request.correlationId
        );

        return invokeAsync(
            silentIframeClient.acquireToken.bind(silentIframeClient),
            BrowserPerformanceEvents.SilentIframeClientAcquireToken,
            this.l,
            this.pc,
            request.correlationId
        )(request);
    }

    // #endregion

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void> {
        const correlationId = this.getRequestCorrelationId(logoutRequest);
        BrowserUtils.redirectPreflightCheck(this.init, this.cfg);
        this.bs.setInteractionInProgress(
            true,
            INTERACTION_TYPE.SIGNOUT
        );

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
            BrowserUtils.preflightCheck(this.init);
            this.bs.setInteractionInProgress(
                true,
                INTERACTION_TYPE.SIGNOUT
            );

            const popupClient = this.createPopupClient(correlationId);
            return popupClient.logout(logoutRequest).finally(() => {
                this.bs.setInteractionInProgress(false);
            });
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
        if (!this.isBrw) {
            this.l.info("in non-browser environment, returning early.");
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
            this.l,
            this.bs,
            this.isBrw,
            this.getRequestCorrelationId(),
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
            this.l,
            this.bs,
            this.getRequestCorrelationId()
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
            this.l,
            this.bs,
            this.getRequestCorrelationId()
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
            this.l,
            this.bs,
            this.getRequestCorrelationId()
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
            this.l,
            this.bs,
            this.getRequestCorrelationId()
        );
    }

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        AccountManager.setActiveAccount(
            account,
            this.bs,
            this.getRequestCorrelationId()
        );
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        return AccountManager.getActiveAccount(
            this.bs,
            this.getRequestCorrelationId()
        );
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
        this.l.verbose("hydrateCache called");

        // Account gets saved to browser storage regardless of native or not
        const accountEntity =
            AccountEntityUtils.createAccountEntityFromAccountInfo(
                result.account,
                result.cloudGraphHostName,
                result.msGraphHost
            );
        await this.bs.setAccount(
            accountEntity,
            result.correlationId
        );

        if (result.fromPlatformBroker) {
            this.l.verbose(
                "Response was from native broker, storing in-memory"
            );
            // Tokens from native broker are stored in-memory
            return this.nis.hydrateCache(result, request);
        } else {
            return this.bs.hydrateCache(result, request);
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
        accountId?: string,
        cacheLookupPolicy?: CacheLookupPolicy
    ): Promise<AuthenticationResult> {
        this.l.trace("acquireTokenNative called");
        if (!this.pap) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.nativeConnectionNotEstablished
            );
        }

        const nativeClient = new PlatformAuthInteractionClient(
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            apiId,
            this.pc,
            this.pap,
            accountId || this.getNativeAccountId(request),
            this.nis,
            request.correlationId
        );

        return nativeClient.acquireToken(request, cacheLookupPolicy);
    }

    /**
     * Returns boolean indicating if this request can use the platform broker
     * @param request
     */
    public canUsePlatformBroker(
        request: RedirectRequest | PopupRequest | SsoSilentRequest,
        accountId?: string
    ): boolean {
        this.l.trace("canUsePlatformBroker called");
        if (!this.pap) {
            this.l.trace(
                "canUsePlatformBroker: platform broker unavilable, returning false"
            );
            return false;
        }

        if (
            !isPlatformAuthAllowed(
                this.cfg,
                this.l,
                this.pap,
                request.authenticationScheme
            )
        ) {
            this.l.trace(
                "canUsePlatformBroker: isBrokerAvailable returned false, returning false"
            );
            return false;
        }

        if (request.prompt) {
            switch (request.prompt) {
                case Constants.PromptValue.NONE:
                case Constants.PromptValue.CONSENT:
                case Constants.PromptValue.LOGIN:
                    this.l.trace(
                        "canUsePlatformBroker: prompt is compatible with platform broker flow"
                    );
                    break;
                default:
                    this.l.trace(
                        `canUsePlatformBroker: prompt = ${request.prompt} is not compatible with platform broker flow, returning false`
                    );
                    return false;
            }
        }

        if (!accountId && !this.getNativeAccountId(request)) {
            this.l.trace(
                "canUsePlatformBroker: nativeAccountId is not available, returning false"
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
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            this.pc,
            this.nis,
            this.pap,
            correlationId
        );
    }

    /**
     * Returns new instance of the Redirect Interaction Client
     * @param correlationId
     */
    protected createRedirectClient(correlationId?: string): RedirectClient {
        return new RedirectClient(
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            this.pc,
            this.nis,
            this.pap,
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
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            ApiId.ssoSilent,
            this.pc,
            this.nis,
            this.pap,
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
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            this.pc,
            this.pap,
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
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            this.pc,
            this.pap,
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
            this.cfg,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            ApiId.acquireTokenByCode,
            this.pc,
            this.pap,
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
        return this.eh.addEventCallback(callback, eventTypes);
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        this.eh.removeEventCallback(callbackId);
    }

    /**
     * Registers a callback to receive performance events.
     *
     * @param {PerformanceCallbackFunction} callback
     * @returns {string}
     */
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        BrowserUtils.blockNonBrowserEnvironment();
        return this.pc.addPerformanceCallback(callback);
    }

    /**
     * Removes a callback registered with addPerformanceCallback.
     *
     * @param {string} callbackId
     * @returns {boolean}
     */
    removePerformanceCallback(callbackId: string): boolean {
        return this.pc.removePerformanceCallback(callbackId);
    }

    /**
     * Returns the logger instance
     */
    public getLogger(): Logger {
        return this.l;
    }

    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger Logger instance
     */
    setLogger(logger: Logger): void {
        this.l = logger;
    }

    /**
     * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
     * @param sku
     * @param version
     */
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        // Validate the SKU passed in is one we expect
        this.bs.setWrapperMetadata(sku, version);
    }

    /**
     * Sets navigation client
     * @param navigationClient
     */
    setNavigationClient(navigationClient: INavigationClient): void {
        this.navClient = navigationClient;
    }

    /**
     * Returns the configuration object
     */
    public getConfiguration(): BrowserConfiguration {
        return this.cfg;
    }

    /**
     * Returns the performance client
     */
    public getPerformanceClient(): IPerformanceClient {
        return this.pc;
    }

    /**
     * Returns the browser env indicator
     */
    public isBrowserEnv(): boolean {
        return this.isBrw;
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

        if (this.isBrw) {
            return createNewGuid();
        }

        /*
         * Included for fallback for non-browser environments,
         * and to ensure this method always returns a string.
         */
        return "";
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
        this.l.verbose("loginRedirect called", correlationId);
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
        this.l.verbose("loginPopup called", correlationId);
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
        const atsMeasurement = this.pc.startMeasurement(
            BrowserRootPerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        atsMeasurement.add({
            cacheLookupPolicy: request.cacheLookupPolicy,
            scenarioId: request.scenarioId,
        });

        preflightCheck(this.init, atsMeasurement);
        this.l.verbose("acquireTokenSilent called", correlationId);

        const account = request.account || this.getActiveAccount();
        if (!account) {
            throw createBrowserAuthError(BrowserAuthErrorCodes.noAccountError);
        }
        atsMeasurement.add({ accountType: getAccountType(account) });

        return this.acquireTokenSilentDeduped(request, account, correlationId)
            .then((result) => {
                atsMeasurement.end({
                    success: true,
                    fromCache: result.fromCache,
                    isNativeBroker: result.fromPlatformBroker,
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
            this.cfg.auth.clientId,
            {
                ...request,
                authority: request.authority || this.cfg.auth.authority,
                correlationId: correlationId,
            },
            account.homeAccountId
        );
        const silentRequestKey = JSON.stringify(thumbprint);

        const inProgressRequest =
            this.astr.get(silentRequestKey);

        if (typeof inProgressRequest === "undefined") {
            this.l.verbose(
                "acquireTokenSilent called for the first time, storing active request",
                correlationId
            );
            this.pc.addFields({ deduped: false }, correlationId);

            const activeRequest = invokeAsync(
                this.acquireTokenSilentAsync.bind(this),
                BrowserPerformanceEvents.AcquireTokenSilentAsync,
                this.l,
                this.pc,
                correlationId
            )(
                {
                    ...request,
                    correlationId,
                },
                account
            );
            this.astr.set(silentRequestKey, activeRequest);

            return activeRequest.finally(() => {
                this.astr.delete(silentRequestKey);
            });
        } else {
            this.l.verbose(
                "acquireTokenSilent has been called previously, returning the result from the first call",
                correlationId
            );
            this.pc.addFields({ deduped: true }, correlationId);
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
        const trackPageVisibility = () =>
            this.trackPageVisibility(request.correlationId);
        this.eh.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            InteractionType.Silent,
            request
        );

        if (request.correlationId) {
            this.pc.incrementFields(
                { visibilityChangeCount: 0 },
                request.correlationId
            );
        }

        document.addEventListener("visibilitychange", trackPageVisibility);

        const silentRequest = await invokeAsync(
            initializeSilentRequest,
            BrowserPerformanceEvents.InitializeSilentRequest,
            this.l,
            this.pc,
            request.correlationId
        )(request, account, this.cfg, this.pc, this.l);
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
                if (!this.air) {
                    let _resolve: (result: boolean) => void;
                    // Always set the active request tracker immediately after checking it to prevent races
                    this.air = [
                        new Promise((resolve) => {
                            _resolve = resolve;
                        }),
                        silentRequest.correlationId,
                    ];
                    this.l.verbose(
                        "Refresh token expired/invalid or CacheLookupPolicy is set to Skip, attempting acquire token by iframe.",
                        silentRequest.correlationId
                    );
                    return invokeAsync(
                        this.acquireTokenBySilentIframe.bind(this),
                        BrowserPerformanceEvents.AcquireTokenBySilentIframe,
                        this.l,
                        this.pc,
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
                            this.air = undefined;
                        });
                } else if (cacheLookupPolicy !== CacheLookupPolicy.Skip) {
                    const [activePromise, activeCorrelationId] =
                        this.air;
                    this.l.verbose(
                        `Iframe request is already in progress, awaiting resolution for request with correlationId: ${activeCorrelationId}`,
                        silentRequest.correlationId
                    );
                    const awaitConcurrentIframeMeasure =
                        this.pc.startMeasurement(
                            BrowserPerformanceEvents.AwaitConcurrentIframe,
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
                        this.l.verbose(
                            `Parallel iframe request with correlationId: ${activeCorrelationId} succeeded. Retrying cache and/or RT redemption`,
                            silentRequest.correlationId
                        );
                        // Retry cache lookup and/or RT exchange after iframe completes
                        return this.acquireTokenSilentNoIframe(
                            silentRequest,
                            cacheLookupPolicy
                        );
                    } else {
                        this.l.info(
                            `Iframe request with correlationId: ${activeCorrelationId} failed. Interaction is required.`
                        );
                        // If previous iframe request failed, it's unlikely to succeed this time. Throw original error.
                        throw refreshTokenError;
                    }
                } else {
                    // Cache policy set to skip and another iframe request is already in progress
                    this.l.warning(
                        "Another iframe request is currently in progress and CacheLookupPolicy is set to Skip. This may result in degraded performance and/or reliability for both calls. Please consider changing the CacheLookupPolicy to take advantage of request queuing and token cache.",
                        silentRequest.correlationId
                    );
                    return invokeAsync(
                        this.acquireTokenBySilentIframe.bind(this),
                        BrowserPerformanceEvents.AcquireTokenBySilentIframe,
                        this.l,
                        this.pc,
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
                this.eh.emitEvent(
                    EventType.ACQUIRE_TOKEN_SUCCESS,
                    InteractionType.Silent,
                    response
                );
                if (request.correlationId) {
                    this.pc.addFields(
                        {
                            fromCache: response.fromCache,
                            isNativeBroker: response.fromPlatformBroker,
                        },
                        request.correlationId
                    );
                }

                return response;
            })
            .catch((tokenRenewalError: Error) => {
                this.eh.emitEvent(
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
        // if the cache policy is set to access_token only, we should not be hitting the native layer yet
        if (
            isPlatformAuthAllowed(
                this.cfg,
                this.l,
                this.pap,
                silentRequest.authenticationScheme
            ) &&
            silentRequest.account.nativeAccountId
        ) {
            this.l.verbose(
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
                    this.l.verbose(
                        "acquireTokenSilent - native platform unavailable, falling back to web flow"
                    );
                    this.pap = undefined; // Prevent future requests from continuing to attempt
                    // Cache will not contain tokens, given that previous WAM requests succeeded. Skip cache and RT renewal and go straight to iframe renewal
                    throw createClientAuthError(
                        ClientAuthErrorCodes.tokenRefreshRequired
                    );
                }
                throw e;
            });
        } else {
            this.l.verbose(
                "acquireTokenSilent - attempting to acquire token from web flow"
            );
            // add logs to identify embedded cache retrieval
            if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                this.l.verbose(
                    "acquireTokenSilent - cache lookup policy set to AccessToken, attempting to acquire token from local cache"
                );
            }
            return invokeAsync(
                this.acquireTokenFromCache.bind(this),
                BrowserPerformanceEvents.AcquireTokenFromCache,
                this.l,
                this.pc,
                silentRequest.correlationId
            )(silentRequest, cacheLookupPolicy).catch(
                (cacheError: AuthError) => {
                    if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                        throw cacheError;
                    }

                    this.eh.emitEvent(
                        EventType.ACQUIRE_TOKEN_NETWORK_START,
                        InteractionType.Silent,
                        silentRequest
                    );

                    return invokeAsync(
                        this.acquireTokenByRefreshToken.bind(this),
                        BrowserPerformanceEvents.AcquireTokenByRefreshToken,
                        this.l,
                        this.pc,
                        silentRequest.correlationId
                    )(silentRequest, cacheLookupPolicy);
                }
            );
        }
    }

    /**
     * Pre-generates PKCE codes and stores it in local variable
     * @param correlationId
     */
    private async preGeneratePkceCodes(correlationId: string): Promise<void> {
        this.l.verbose("Generating new PKCE codes");
        this.pkce = await invokeAsync(
            generatePkceCodes,
            BrowserPerformanceEvents.GeneratePkceCodes,
            this.l,
            this.pc,
            correlationId
        )(this.pc, this.l, correlationId);
        return Promise.resolve();
    }

    /**
     * Provides pre-generated PKCE codes, if any
     * @param correlationId
     */
    private getPreGeneratedPkceCodes(
        correlationId: string
    ): PkceCodes | undefined {
        this.l.verbose("Attempting to pick up pre-generated PKCE codes");
        const res = this.pkce ? { ...this.pkce } : undefined;
        this.pkce = undefined;
        this.l.verbose(
            `${res ? "Found" : "Did not find"} pre-generated PKCE codes`
        );
        this.pc.addFields(
            { usePreGeneratedPkce: !!res },
            correlationId
        );
        return res;
    }

    private logMultipleInstances(
        performanceEvent: InProgressPerformanceEvent
    ): void {
        const clientId = this.cfg.auth.clientId;

        if (!window) return;
        // @ts-ignore
        window.msal = window.msal || {};
        // @ts-ignore
        window.msal.clientIds = window.msal.clientIds || [];

        // @ts-ignore
        const clientIds: string[] = window.msal.clientIds;

        if (clientIds.length > 0) {
            this.l.verbose(
                "There is already an instance of MSAL.js in the window."
            );
        }
        // @ts-ignore
        window.msal.clientIds.push(clientId);
        collectInstanceStats(clientId, performanceEvent, this.l);
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
