/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    AccessTokenEntity,
    AccountEntity,
    AccountEntityUtils,
    AccountInfo,
    AuthError,
    AuthErrorCodes,
    AuthToken,
    AuthorityType,
    CacheHelpers,
    ClientAuthErrorCodes,
    ClientConfigurationErrorCodes,
    CommonSilentFlowRequest,
    Constants,
    DpopProofGenerator,
    ICrypto,
    IPerformanceClient,
    IdTokenEntity,
    InProgressPerformanceEvent,
    Logger,
    JsonWebTokenAlgorithms,
    PerformanceEvents,
    PopTokenGenerator,
    RequestParameterBuilder,
    ScopeSet,
    ServerTelemetryManager,
    SignedHttpRequestParameters,
    StoreInCache,
    TimeUtils,
    TokenClaims,
    ITokenBindingKeyManager,
    UrlString,
    buildAccountToCache,
    createAuthError,
    createClientAuthError,
    createClientConfigurationError,
    invokeAsync,
    normalizeDpopResourceRequestContext,
    updateAccountTenantProfileData,
} from "@azure/msal-common/browser";
import { IPlatformAuthHandler } from "../broker/nativeBroker/IPlatformAuthHandler.js";
import {
    createPlatformAuthExtraParametersNoCache,
    PlatformAuthBindingPreference,
    PlatformAuthEnclave,
    PlatformAuthRequest,
    PlatformAuthTokenType,
} from "../broker/nativeBroker/PlatformAuthRequest.js";
import {
    MATS,
    NativeResponseProperties,
    PlatformAuthResponse,
} from "../broker/nativeBroker/PlatformAuthResponse.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { base64Decode } from "../encode/Base64Decode.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import {
    NativeAuthError,
    NativeAuthErrorCodes,
    createNativeAuthError,
    isFatalNativeAuthError,
} from "../error/NativeAuthError.js";
import { EventHandler } from "../event/EventHandler.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { NavigationOptions } from "../navigation/NavigationOptions.js";
import { version } from "../packageMetadata.js";
import { HandleRedirectPromiseOptions } from "../request/HandleRedirectPromiseOptions.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { isTokenBindingKeyPersistedForRedirect } from "../request/RequestHelpers.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import {
    ApiId,
    BrowserConstants,
    CacheLookupPolicy,
    PlatformAuthConstants,
    TemporaryCacheKeys,
} from "../utils/BrowserConstants.js";
import { getCurrentUri } from "../utils/BrowserUtils.js";
import {
    BaseInteractionClient,
    getDiscoveredAuthority,
    getRedirectUri,
    initializeServerTelemetryManager,
} from "./BaseInteractionClient.js";
import { SilentCacheClient } from "./SilentCacheClient.js";

type PlatformAuthTokenRequestParameters = {
    tokenType: PlatformAuthRequest["tokenType"];
} & Partial<
    Pick<
        PlatformAuthRequest,
        | "preferBinding"
        | "keyId"
        | "reqCnf"
        | "signPopToken"
        | "resourceRequestMethod"
        | "resourceRequestUri"
        | "shrClaims"
        | "shrNonce"
    >
>;

type BrokerDpopFailureReason =
    | "conflicting_fields"
    | "invalid_attestation"
    | "missing_attestation"
    | "missing_l1_binding"
    | "missing_proof"
    | "unexpected_response"
    | "unknown_token_type";

const DPOP_POP_KID_NOT_SUPPORTED = "dpop_pop_kid_not_supported";

export class PlatformAuthInteractionClient extends BaseInteractionClient {
    protected apiId: ApiId;
    protected accountId: string;
    protected platformAuthProvider: IPlatformAuthHandler;
    protected silentCacheClient: SilentCacheClient;
    protected nativeStorageManager: BrowserCacheManager;
    protected skus: string;

    private static readonly DPOP_BROKER_REQUEST_KEY_LOCATION =
        PlatformAuthEnclave.SOFTWARE;

    constructor(
        config: BrowserConfiguration,
        browserStorage: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        apiId: ApiId,
        performanceClient: IPerformanceClient,
        provider: IPlatformAuthHandler,
        accountId: string,
        nativeStorageImpl: BrowserCacheManager,
        correlationId: string,
        tokenBindingKeyManager?: ITokenBindingKeyManager
    ) {
        super(
            config,
            browserStorage,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            correlationId,
            provider,
            tokenBindingKeyManager
        );
        this.apiId = apiId;
        this.accountId = accountId;
        this.platformAuthProvider = provider;
        this.nativeStorageManager = nativeStorageImpl;
        this.silentCacheClient = new SilentCacheClient(
            config,
            this.nativeStorageManager,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            correlationId,
            provider,
            this.tokenBindingKeyManager
        );

        const extensionName = this.platformAuthProvider.getExtensionName();

        this.skus = ServerTelemetryManager.makeExtraSkuString({
            libraryName: BrowserConstants.MSAL_SKU,
            libraryVersion: version,
            extensionName: extensionName,
            extensionVersion: this.platformAuthProvider.getExtensionVersion(),
        });
    }

    /**
     * Acquire token from native platform via browser extension
     * @param request
     */
    async acquireToken(
        request: PopupRequest | SilentRequest | SsoSilentRequest,
        cacheLookupPolicy?: CacheLookupPolicy
    ): Promise<AuthenticationResult> {
        this.logger.trace(
            "NativeInteractionClient - acquireToken called.",
            this.correlationId
        );

        // start the perf measurement
        const nativeATMeasurement = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.NativeInteractionClientAcquireToken,
            this.correlationId
        );
        const reqTimestamp = TimeUtils.nowSeconds();

        const serverTelemetryManager = initializeServerTelemetryManager(
            this.apiId,
            this.config.auth.clientId,
            this.correlationId,
            this.browserStorage,
            this.logger,
            undefined,
            this.config.system.serverTelemetryEnabled
        );

        // initialize native request (statically builds the request; does not contact the broker)
        let nativeRequest: PlatformAuthRequest;
        try {
            nativeRequest = await invokeAsync(
                this.initializePlatformRequest.bind(this),
                BrowserPerformanceEvents.PlatformAuthInteractionClientInitializeRequest,
                this.logger,
                this.performanceClient,
                this.correlationId
            )(request);
        } catch (e) {
            /*
             * Request initialization (e.g. PoP token generation or authority
             * resolution) failed before the broker was contacted, so end the
             * measurement here to avoid an orphaned sub-measurement.
             * Broker was never engaged, so this was not a native broker outcome.
             */
            nativeATMeasurement.add({
                isNativeBroker: false,
            });
            nativeATMeasurement.end(
                {
                    success: false,
                },
                e
            );
            throw e;
        }

        // check if the tokens can be retrieved from internal cache
        let cachedResult: AuthenticationResult | undefined;
        try {
            cachedResult = await this.acquireTokensFromCache(
                this.accountId,
                nativeRequest
            );
        } catch (e) {
            if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                this.logger.info(
                    "MSAL internal Cache does not contain tokens, return error as per cache policy",
                    this.correlationId
                );
                nativeATMeasurement.add({
                    isNativeBroker: false,
                });
                nativeATMeasurement.end({
                    success: false,
                });
                await this.resetGeneratedDpopRequestKey(
                    nativeRequest,
                    "best-effort"
                );
                throw e;
            }
            // continue with a native call for any and all errors
            this.logger.info(
                "MSAL internal Cache does not contain tokens, proceed to make a native call",
                this.correlationId
            );
        }

        if (cachedResult) {
            // Served from the native internal cache; token did not come directly from the broker
            nativeATMeasurement.add({
                isNativeBroker: false,
            });
            nativeATMeasurement.end({
                success: true,
                fromCache: true,
            });
            await this.resetGeneratedDpopRequestKey(nativeRequest);
            return cachedResult;
        }

        // dispatch the request to the broker
        try {
            await this.prepareDpopBrokerRequest(nativeRequest);
            const validatedResponse: PlatformAuthResponse =
                await this.platformAuthProvider.sendMessage(nativeRequest);

            const result = await invokeAsync(
                this.handleNativeResponse.bind(this),
                BrowserPerformanceEvents.PlatformAuthHandleNativeResponse,
                this.logger,
                this.performanceClient,
                this.correlationId
            )(
                validatedResponse,
                nativeRequest,
                reqTimestamp,
                request.storeInCache
            );
            nativeATMeasurement.end({
                success: true,
                requestId: result.requestId,
            });
            serverTelemetryManager.clearNativeBrokerErrorCode();
            return result;
        } catch (e) {
            if (e instanceof NativeAuthError) {
                serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
            }
            nativeATMeasurement.end(
                {
                    success: false,
                },
                e
            );
            this.setBrokerErrorTelemetry(e);
            await this.resetGeneratedDpopRequestKey(
                nativeRequest,
                "best-effort"
            );
            throw e;
        }
    }

    /**
     * Records platform-broker error telemetry on the root event for the current
     * correlationId. `isNativeBroker` is set optimistically to true because the
     * broker was engaged; when the caller subsequently falls back to a web flow
     * that succeeds, the root success measurement overrides it to false via
     * `result.fromPlatformBroker`. Terminal broker errors (no fallback) retain
     * true. `brokerErrorName`/`brokerErrorCode` are recorded when the error is an `AuthError`.
     * @param error error thrown by the broker interaction
     */
    private setBrokerErrorTelemetry(error: unknown): void {
        if (error instanceof AuthError) {
            this.performanceClient.addFields(
                {
                    isNativeBroker: true,
                    brokerErrorName: error.name,
                    brokerErrorCode: error.errorCode,
                },
                this.correlationId
            );
        }
    }

    /**
     * Creates silent flow request
     * @param request
     * @param cachedAccount
     * @returns CommonSilentFlowRequest
     */
    private createSilentCacheRequest(
        request: PlatformAuthRequest,
        cachedAccount: AccountInfo
    ): CommonSilentFlowRequest {
        const silentRequest: CommonSilentFlowRequest = {
            authority: request.authority,
            correlationId: this.correlationId,
            scopes: ScopeSet.fromString(
                request.scope,
                this.correlationId
            ).asArray(),
            account: cachedAccount,
            forceRefresh: false,
            authenticationScheme: this.isDpopBrokerRequest(request)
                ? Constants.AuthenticationScheme.DPOP
                : (request.tokenType as Constants.AuthenticationScheme),
            popKid: request.keyId,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            resource: request.extraParameters?.resource,
        };

        // Preserve FMI partition semantics for silent cache filtering.
        if (request.attributeTokens) {
            silentRequest.attributeTokens = request.attributeTokens.split(" ");
        }

        const dpopNonce = request.extraParametersNoCache?.pop_nonce;
        if (dpopNonce !== undefined) {
            silentRequest.extraParameters = {
                pop_nonce: dpopNonce,
            };
        }

        return silentRequest;
    }

    /**
     * Fetches the tokens from the cache if un-expired
     * @param nativeAccountId
     * @param request
     * @returns authenticationResult
     */
    protected async acquireTokensFromCache(
        nativeAccountId: string,
        request: PlatformAuthRequest
    ): Promise<AuthenticationResult> {
        if (!nativeAccountId) {
            this.logger.warning(
                "NativeInteractionClient:acquireTokensFromCache - No nativeAccountId provided",
                this.correlationId
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.noAccountFound,
                this.correlationId
            );
        }
        // fetch the account from browser cache
        const account = this.browserStorage.getBaseAccountInfo(
            {
                nativeAccountId,
            },
            this.correlationId
        );

        if (!account) {
            throw createClientAuthError(
                ClientAuthErrorCodes.noAccountFound,
                this.correlationId
            );
        }

        // leverage silent flow for cached tokens retrieval
        try {
            const silentRequest = this.createSilentCacheRequest(
                request,
                account
            );
            const result = await this.silentCacheClient.acquireToken(
                silentRequest
            );

            const idToken = this.browserStorage.getIdToken(
                account,
                this.correlationId,
                this.browserStorage.getTokenKeys(),
                account.tenantId
            );

            const idTokenClaims = AuthToken.extractTokenClaims(
                idToken?.secret || "",
                base64Decode,
                this.correlationId
            );

            const fullAccount = updateAccountTenantProfileData(
                account,
                undefined, // tenantProfile optional
                idTokenClaims,
                idToken?.secret
            );

            return {
                ...result,
                idToken: idToken?.secret || "",
                idTokenClaims: idTokenClaims as TokenClaims,
                account: fullAccount,
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * Acquires a token from native platform then redirects to the redirectUri instead of returning the response
     * @param {RedirectRequest} request
     * @param {InProgressPerformanceEvent} rootMeasurement
     * @param {HandleRedirectPromiseOptions} options
     */
    async acquireTokenRedirect(
        request: RedirectRequest,
        rootMeasurement: InProgressPerformanceEvent,
        options?: HandleRedirectPromiseOptions
    ): Promise<void> {
        this.logger.trace(
            "NativeInteractionClient - acquireTokenRedirect called.",
            this.correlationId
        );

        const nativeRequest = await invokeAsync(
            this.initializePlatformRequest.bind(this),
            BrowserPerformanceEvents.PlatformAuthInteractionClientInitializeRequest,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(request);
        const navigateToLoginRequestUrl =
            options?.navigateToLoginRequestUrl ?? true;

        try {
            await this.prepareDpopBrokerRequest(nativeRequest);
            const response = await this.platformAuthProvider.sendMessage(
                nativeRequest
            );
            const dpopBrokerOutcome = this.validateDpopBrokerOutcome(
                response,
                nativeRequest
            );
            if (dpopBrokerOutcome === "L3") {
                await this.resetGeneratedDpopRequestKey(nativeRequest);
            }
        } catch (e) {
            /*
             * Raw persistent/transient broker errors are retrieved again in
             * phase two. Availability errors are thrown for controller-managed
             * web fallback, while translated cancellation, network, and
             * interaction-required errors are surfaced without being swallowed.
             */
            if (e instanceof NativeAuthError) {
                const serverTelemetryManager = initializeServerTelemetryManager(
                    this.apiId,
                    this.config.auth.clientId,
                    this.correlationId,
                    this.browserStorage,
                    this.logger,
                    undefined,
                    this.config.system.serverTelemetryEnabled
                );
                serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
                if (isFatalNativeAuthError(e)) {
                    /*
                     * Fatal error on redirect initiate always falls back to a
                     * regular web redirect, so this request did not complete
                     * natively. Token telemetry for the eventual outcome lands
                     * in handleRedirectPromise (phase 2).
                     */
                    this.setBrokerErrorTelemetry(e);
                    await this.resetGeneratedDpopRequestKey(
                        nativeRequest,
                        "best-effort"
                    );
                    throw e;
                }
                await this.resetGeneratedDpopRequestKey(
                    nativeRequest,
                    "best-effort"
                );
            } else if (this.isDpopBrokerRequest(nativeRequest)) {
                await this.resetGeneratedDpopRequestKey(
                    nativeRequest,
                    "best-effort"
                );
                throw e;
            }
        }
        try {
            await this.ensureRedirectDpopKeyIsPersisted(nativeRequest);
        } catch (e) {
            await this.resetGeneratedDpopRequestKey(
                nativeRequest,
                "best-effort"
            );
            throw e;
        }
        this.browserStorage.setTemporaryCache(
            TemporaryCacheKeys.NATIVE_REQUEST,
            JSON.stringify({
                ...nativeRequest,
                storeInCache: request.storeInCache,
            }),
            true
        );

        const navigationOptions: NavigationOptions = {
            apiId: ApiId.acquireTokenRedirect,
            timeout: this.config.system.redirectNavigationTimeout,
            noHistory: false,
        };
        const redirectUri = navigateToLoginRequestUrl
            ? UrlString.getAbsoluteUrl(
                  request.redirectStartPage || window.location.href,
                  getCurrentUri(),
                  this.correlationId
              )
            : getRedirectUri(
                  request.redirectUri,
                  this.config.auth.redirectUri,
                  this.logger,
                  this.correlationId
              );
        rootMeasurement.end({ success: true });
        try {
            await this.navigationClient.navigateExternal(
                redirectUri,
                navigationOptions
            ); // Need to treat this as external to ensure handleRedirectPromise is run again
        } catch (e) {
            this.browserStorage.removeItem(
                this.browserStorage.generateCacheKey(
                    TemporaryCacheKeys.NATIVE_REQUEST
                )
            );
            await this.resetGeneratedDpopRequestKey(
                nativeRequest,
                "best-effort"
            );
            throw e;
        }
    }

    /**
     * If the previous page called native platform for a token using redirect APIs, send the same request again and return the response
     * @param performanceClient {IPerformanceClient?}
     * @param correlationId {string?} correlation identifier
     */
    async handleRedirectPromise(): Promise<AuthenticationResult | null> {
        this.logger.trace(
            "NativeInteractionClient - handleRedirectPromise called.",
            this.correlationId
        );
        if (!this.browserStorage.isInteractionInProgress(true)) {
            this.logger.info(
                "handleRedirectPromise called but there is no interaction in progress, returning null.",
                this.correlationId
            );
            return null;
        }

        // remove prompt from the request to prevent WAM from prompting twice
        const cachedRequest = this.browserStorage.getCachedNativeRequest();
        if (!cachedRequest) {
            this.logger.verbose(
                "NativeInteractionClient - handleRedirectPromise called but there is no cached request, returning null.",
                this.correlationId
            );
            this.performanceClient?.addFields(
                {
                    errorCode: "no_cached_request",
                },
                this.correlationId
            );
            return null;
        }

        /*
         * storeInCache is a client-side cache directive persisted alongside the cached
         * request (not a broker-contract parameter), so extract it here before resending.
         */
        const { prompt, storeInCache, ...request } =
            cachedRequest as PlatformAuthRequest & {
                storeInCache?: StoreInCache;
            };
        if (prompt) {
            this.logger.verbose(
                "NativeInteractionClient - handleRedirectPromise called and prompt was included in the original request, removing prompt from cached request to prevent second interaction with native broker window.",
                this.correlationId
            );
        }

        this.browserStorage.removeItem(
            this.browserStorage.generateCacheKey(
                TemporaryCacheKeys.NATIVE_REQUEST
            )
        );

        const reqTimestamp = TimeUtils.nowSeconds();

        try {
            await this.prepareDpopBrokerRequest(request, true);
            this.logger.verbose(
                "NativeInteractionClient - handleRedirectPromise sending message to native broker.",
                this.correlationId
            );
            const response: PlatformAuthResponse =
                await this.platformAuthProvider.sendMessage(request);
            const authResult = await invokeAsync(
                this.handleNativeResponse.bind(this),
                BrowserPerformanceEvents.PlatformAuthHandleNativeResponse,
                this.logger,
                this.performanceClient,
                this.correlationId
            )(response, request, reqTimestamp, storeInCache);

            const serverTelemetryManager = initializeServerTelemetryManager(
                this.apiId,
                this.config.auth.clientId,
                this.correlationId,
                this.browserStorage,
                this.logger,
                undefined,
                this.config.system.serverTelemetryEnabled
            );
            serverTelemetryManager.clearNativeBrokerErrorCode();
            return authResult;
        } catch (e) {
            if (e instanceof NativeAuthError) {
                const serverTelemetryManager = initializeServerTelemetryManager(
                    this.apiId,
                    this.config.auth.clientId,
                    this.correlationId,
                    this.browserStorage,
                    this.logger,
                    undefined,
                    this.config.system.serverTelemetryEnabled
                );
                serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
            }
            this.setBrokerErrorTelemetry(e);
            await this.resetGeneratedDpopRequestKey(request, "best-effort");
            throw e;
        }
    }

    /**
     * Logout from native platform via browser extension
     * @param request
     */
    logout(): Promise<void> {
        this.logger.trace(
            "NativeInteractionClient - logout called.",
            this.correlationId
        );
        return Promise.reject("Logout not implemented yet");
    }

    /**
     * Transform response from native platform into AuthenticationResult object which will be returned to the end user
     * @param response
     * @param request
     * @param reqTimestamp
     */
    protected async handleNativeResponse(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest,
        reqTimestamp: number,
        storeInCache?: StoreInCache
    ): Promise<AuthenticationResult> {
        this.logger.trace(
            "NativeInteractionClient - handleNativeResponse called.",
            this.correlationId
        );

        const dpopBrokerOutcome = this.validateDpopBrokerOutcome(
            response,
            request
        );

        // generate identifiers
        const idTokenClaims = AuthToken.extractTokenClaims(
            response.id_token,
            base64Decode,
            this.correlationId
        );

        const homeAccountIdentifier = this.createHomeAccountIdentifier(
            response,
            idTokenClaims
        );

        const cachedhomeAccountId =
            this.browserStorage.getAccountInfoFilteredBy(
                {
                    nativeAccountId: request.accountId,
                },
                this.correlationId
            )?.homeAccountId;

        // add exception for double brokering, please note this is temporary and will be fortified in future
        if (
            request.extraParameters?.child_client_id &&
            response.account.id !== request.accountId
        ) {
            this.logger.info(
                "handleNativeServerResponse: Double broker flow detected, ignoring accountId mismatch",
                this.correlationId
            );
        } else if (
            homeAccountIdentifier !== cachedhomeAccountId &&
            response.account.id !== request.accountId
        ) {
            // User switch in native broker prompt is not supported. All users must first sign in through web flow to ensure server state is in sync
            throw createNativeAuthError(
                NativeAuthErrorCodes.userSwitch,
                this.correlationId
            );
        }

        // Get the preferred_cache domain for the given authority
        const authority = await getDiscoveredAuthority(
            this.config,
            this.correlationId,
            this.performanceClient,
            this.browserStorage,
            this.logger,
            request.authority
        );

        const baseAccount = buildAccountToCache(
            this.browserStorage,
            authority,
            homeAccountIdentifier,
            base64Decode,
            this.correlationId,
            idTokenClaims,
            response.client_info,
            authority.getPreferredCache(), // environment
            idTokenClaims.tid,
            undefined, // auth code payload
            response.account.id,
            this.logger,
            this.performanceClient
        );

        // Ensure expires_in is in number format
        response.expires_in = Number(response.expires_in);

        // generate authenticationResult
        const result = await invokeAsync(
            this.generateAuthenticationResult.bind(this),
            BrowserPerformanceEvents.NativeGenerateAuthResult,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(
            response,
            request,
            idTokenClaims,
            baseAccount,
            authority.canonicalAuthority,
            reqTimestamp,
            dpopBrokerOutcome
        );

        const isL3DpopResponse = dpopBrokerOutcome === "L3";
        // cache accounts and tokens in the appropriate storage
        const shouldRemoveGeneratedDpopKey =
            isL3DpopResponse ||
            (this.isDpopBrokerRequest(request) &&
                storeInCache?.accessToken === false);
        if (shouldRemoveGeneratedDpopKey) {
            await this.resetGeneratedDpopRequestKey(request);
        }

        await invokeAsync(
            this.cacheAccount.bind(this),
            BrowserPerformanceEvents.PlatformAuthCacheAccount,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(baseAccount, AuthToken.isKmsi(idTokenClaims), !isL3DpopResponse);
        await invokeAsync(
            this.cacheNativeTokens.bind(this),
            BrowserPerformanceEvents.PlatformAuthCacheNativeTokens,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(
            response,
            request,
            homeAccountIdentifier,
            idTokenClaims,
            result.tenantId,
            reqTimestamp,
            authority.getPreferredCache(), // environment
            storeInCache,
            dpopBrokerOutcome
        );

        return result;
    }

    /**
     * creates an homeAccountIdentifier for the account
     * @param response
     * @param idTokenObj
     * @returns
     */
    protected createHomeAccountIdentifier(
        response: PlatformAuthResponse,
        idTokenClaims: TokenClaims
    ): string {
        // Save account in browser storage
        const homeAccountIdentifier = AccountEntityUtils.generateHomeAccountId(
            response.client_info || "",
            AuthorityType.Default,
            this.logger,
            this.browserCrypto,
            this.correlationId,
            idTokenClaims
        );

        return homeAccountIdentifier;
    }

    /**
     * Helper to generate scopes
     * @param response
     * @param request
     * @returns
     */
    generateScopes(requestScopes: string, responseScopes?: string): ScopeSet {
        return responseScopes
            ? ScopeSet.fromString(responseScopes, this.correlationId)
            : ScopeSet.fromString(requestScopes, this.correlationId);
    }

    /**
     * If PoP token is requesred, records the PoP token if returned from the WAM, else generates one in the browser
     * @param request
     * @param response
     */
    async generatePopAccessToken(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest
    ): Promise<string> {
        if (
            request.tokenType === Constants.AuthenticationScheme.POP &&
            request.signPopToken
        ) {
            /**
             * This code prioritizes SHR returned from the native layer. In case of error/SHR not calculated from WAM and the AT
             * is still received, SHR is calculated locally
             */

            // Check if native layer returned an SHR token
            if (response.shr) {
                this.logger.trace(
                    "handleNativeServerResponse: SHR is enabled in native layer",
                    this.correlationId
                );
                return response.shr;
            }

            // Generate SHR in msal js if WAM does not compute it when POP is enabled
            const popTokenGenerator: PopTokenGenerator = new PopTokenGenerator(
                this.browserCrypto,
                this.tokenBindingKeyManager,
                this.performanceClient
            );
            const shrParameters: SignedHttpRequestParameters = {
                resourceRequestMethod: request.resourceRequestMethod,
                resourceRequestUri: request.resourceRequestUri,
                shrClaims: request.shrClaims,
                shrNonce: request.shrNonce,
                correlationId: this.correlationId,
            };

            /**
             * KeyID must be present in the native request from when the PoP key was generated in order for
             * PopTokenGenerator to query the full key for signing
             */
            if (!request.keyId) {
                throw createClientAuthError(
                    ClientAuthErrorCodes.keyIdMissing,
                    this.correlationId
                );
            }
            return popTokenGenerator.signPopToken(
                response.access_token,
                request.keyId,
                shrParameters
            );
        } else {
            return response.access_token;
        }
    }

    /**
     * Generates authentication result
     * @param response
     * @param request
     * @param idTokenObj
     * @param accountEntity
     * @param authority
     * @param reqTimestamp
     * @returns
     */
    protected async generateAuthenticationResult(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest,
        idTokenClaims: TokenClaims,
        accountEntity: AccountEntity,
        authority: string,
        reqTimestamp: number,
        dpopBrokerOutcome: "none" | "L1" | "L3" = "none"
    ): Promise<AuthenticationResult> {
        // Add Native Broker fields to Telemetry
        const mats = this.addTelemetryFromNativeResponse(
            response.properties.MATS
        );

        // If scopes not returned in server response, use request scopes
        const responseScopes = this.generateScopes(
            request.scope,
            response.scope
        );

        const accountProperties = response.account.properties || {};
        const uid =
            accountProperties["UID"] ||
            idTokenClaims.oid ||
            idTokenClaims.sub ||
            "";
        const tid = accountProperties["TenantId"] || idTokenClaims.tid || "";

        const accountInfo: AccountInfo | null = updateAccountTenantProfileData(
            AccountEntityUtils.getAccountInfo(accountEntity),
            undefined, // tenantProfile optional
            idTokenClaims,
            response.id_token
        );

        /**
         * In pairwise broker flows, this check prevents the broker's native account id
         * from being returned over the embedded app's account id.
         */
        if (accountInfo.nativeAccountId !== response.account.id) {
            accountInfo.nativeAccountId = response.account.id;
            // Also update the matching tenant profile (source of truth)
            const targetTenantId = tid || accountInfo.tenantId;
            const tenantProfile =
                accountInfo.tenantProfiles?.get(targetTenantId);
            if (tenantProfile) {
                tenantProfile.nativeAccountId = response.account.id;
            }
        }

        // generate PoP token as needed
        const responseAccessToken = await this.generatePopAccessToken(
            response,
            request
        );
        const isDpopRequest = this.isDpopBrokerRequest(request);
        const tokenType = isDpopRequest
            ? Constants.AuthenticationScheme.DPOP
            : request.tokenType === Constants.AuthenticationScheme.POP
            ? Constants.AuthenticationScheme.POP
            : Constants.AuthenticationScheme.BEARER;
        const dpopProof =
            isDpopRequest &&
            !(dpopBrokerOutcome === "L3" && response.DPoP === undefined)
                ? await this.generateDpopProof(response, request)
                : undefined;

        const result: AuthenticationResult = {
            authority: authority,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes.asArray(),
            account: accountInfo,
            idToken: response.id_token,
            idTokenClaims: idTokenClaims,
            accessToken: responseAccessToken,
            fromCache: mats ? this.isResponseFromCache(mats) : false,
            // Request timestamp and NativeResponse expires_in are in seconds, converting to Date for AuthenticationResult
            expiresOn: TimeUtils.toDateFromSeconds(
                reqTimestamp + response.expires_in
            ),
            tokenType: tokenType,
            dpopProof,
            correlationId: this.correlationId,
            state: response.state,
            fromPlatformBroker: true,
            ...(request.extraParameters?.resource && {
                resource: request.extraParameters.resource,
            }),
        };

        return result;
    }

    /**
     * cache the account entity in browser storage
     * @param accountEntity
     */
    async cacheAccount(
        accountEntity: AccountEntity,
        kmsi: boolean,
        clearExistingTokens: boolean = true
    ): Promise<void> {
        // Store the account info and hence `nativeAccountId` in browser cache
        await this.browserStorage.setAccount(
            accountEntity,
            this.correlationId,
            kmsi,
            this.apiId
        );
        // Remove any existing cached tokens for this account in browser storage
        if (clearExistingTokens) {
            this.browserStorage.removeAccountContext(
                AccountEntityUtils.getAccountInfo(accountEntity),
                this.correlationId
            );
        }
    }

    /**
     * Stores the access_token and id_token in inmemory storage
     * @param response
     * @param request
     * @param homeAccountIdentifier
     * @param idTokenObj
     * @param responseAccessToken
     * @param tenantId
     * @param reqTimestamp
     */
    async cacheNativeTokens(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest,
        homeAccountIdentifier: string,
        idTokenClaims: TokenClaims,
        tenantId: string,
        reqTimestamp: number,
        environment: string,
        storeInCache?: StoreInCache,
        dpopBrokerOutcome: "none" | "L1" | "L3" = "none"
    ): Promise<void> {
        const cachedIdToken: IdTokenEntity | null =
            CacheHelpers.createIdTokenEntity(
                homeAccountIdentifier,
                environment,
                response.id_token || "",
                request.clientId,
                idTokenClaims.tid || ""
            );

        // save idtoken credential in configured browser storage
        if (!!cachedIdToken && storeInCache?.idToken !== false) {
            await this.browserStorage.setIdTokenCredential(
                cachedIdToken,
                this.correlationId,
                AuthToken.isKmsi(idTokenClaims)
            );
        }

        if (dpopBrokerOutcome === "L3") {
            return;
        }

        if (storeInCache?.accessToken === false) {
            return;
        }

        const cachedAccessToken = this.createNativeAccessToken(
            response,
            request,
            homeAccountIdentifier,
            idTokenClaims,
            tenantId,
            reqTimestamp,
            environment
        );
        if (!cachedAccessToken) {
            return;
        }

        // save access token credential in memory storage
        const nativeCacheRecord = {
            accessToken: cachedAccessToken,
        };

        return this.nativeStorageManager.saveCacheRecord(
            nativeCacheRecord,
            this.correlationId,
            AuthToken.isKmsi(idTokenClaims),
            this.apiId,
            storeInCache
        );
    }

    /**
     * Creates the access-token entity returned by the native broker.
     * @param response - Native broker response.
     * @param request - Native broker request.
     * @param homeAccountIdentifier - Home account identifier.
     * @param idTokenClaims - Claims from the returned ID token.
     * @param tenantId - Tenant identifier.
     * @param reqTimestamp - Request timestamp in seconds.
     * @param environment - Preferred cache environment.
     * @returns The access-token entity representing the broker response.
     */
    private createNativeAccessToken(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest,
        homeAccountIdentifier: string,
        idTokenClaims: TokenClaims,
        tenantId: string,
        reqTimestamp: number,
        environment: string
    ): AccessTokenEntity {
        const expiresIn: number =
            request.tokenType === Constants.AuthenticationScheme.POP
                ? Constants.SHR_NONCE_VALIDITY
                : (typeof response.expires_in === "string"
                      ? parseInt(response.expires_in, 10)
                      : response.expires_in) || 0;
        const tokenExpirationSeconds = reqTimestamp + expiresIn;
        const responseScopes = this.generateScopes(
            response.scope,
            request.scope
        );

        const additionalCacheKeyComponents = request.attributeTokens
            ? { attribute_tokens: request.attributeTokens }
            : undefined;

        const accessToken = CacheHelpers.createAccessTokenEntity(
            homeAccountIdentifier,
            environment,
            response.access_token,
            request.clientId,
            idTokenClaims.tid || tenantId,
            responseScopes.printScopes(),
            tokenExpirationSeconds,
            0,
            base64Decode,
            request.correlationId,
            undefined,
            this.isDpopBrokerRequest(request)
                ? Constants.AuthenticationScheme.DPOP
                : (request.tokenType as Constants.AuthenticationScheme),
            undefined,
            request.keyId,
            additionalCacheKeyComponents
        );
        if (request.extraParameters?.resource) {
            accessToken.resource = request.extraParameters.resource;
        }
        return accessToken;
    }

    getExpiresInValue(
        tokenType: string,
        expiresIn: string | number | undefined
    ): number {
        return tokenType === Constants.AuthenticationScheme.POP
            ? Constants.SHR_NONCE_VALIDITY
            : (typeof expiresIn === "string"
                  ? parseInt(expiresIn, 10)
                  : expiresIn) || 0;
    }

    protected addTelemetryFromNativeResponse(
        matsResponse?: string
    ): MATS | null {
        const mats = this.getMATSFromResponse(matsResponse);

        if (!mats) {
            return null;
        }

        this.performanceClient.addFields(
            {
                extensionId: this.platformAuthProvider.getExtensionId(),
                extensionVersion:
                    this.platformAuthProvider.getExtensionVersion(),
                matsBrokerVersion: mats.broker_version,
                matsAccountJoinOnStart: mats.account_join_on_start,
                matsAccountJoinOnEnd: mats.account_join_on_end,
                matsDeviceJoin: mats.device_join,
                matsPromptBehavior: mats.prompt_behavior,
                matsApiErrorCode: mats.api_error_code,
                matsUiVisible: mats.ui_visible,
                matsSilentCode: mats.silent_code,
                matsSilentBiSubCode: mats.silent_bi_sub_code,
                matsSilentMessage: mats.silent_message,
                matsSilentStatus: mats.silent_status,
                matsHttpStatus: mats.http_status,
                matsHttpEventCount: mats.http_event_count,
            },
            this.correlationId
        );

        return mats;
    }

    /**
     * Gets MATS telemetry from native response
     * @param response
     * @returns
     */
    private getMATSFromResponse(matsResponse: string | undefined): MATS | null {
        if (matsResponse) {
            try {
                return JSON.parse(matsResponse);
            } catch (e) {
                this.logger.error(
                    "NativeInteractionClient - Error parsing MATS telemetry, returning null instead",
                    this.correlationId
                );
            }
        }

        return null;
    }

    /**
     * Returns whether or not response came from native cache
     * @param response
     * @returns
     */
    protected isResponseFromCache(mats: MATS): boolean {
        if (typeof mats.is_cached === "undefined") {
            this.logger.verbose(
                "NativeInteractionClient - MATS telemetry does not contain field indicating if response was served from cache. Returning false.",
                this.correlationId
            );
            return false;
        }

        return !!mats.is_cached;
    }

    /**
     * Translates developer provided request object into NativeRequest object
     * @param request
     */
    protected async initializePlatformRequest(
        request: PopupRequest | SsoSilentRequest
    ): Promise<PlatformAuthRequest> {
        this.logger.trace(
            "NativeInteractionClient - initializePlatformRequest called",
            this.correlationId
        );

        const canonicalAuthority = await this.getCanonicalAuthority(request);

        // ignore config claims if skipBrokerClaims is set to true and this is a brokered authentication flow
        const configClaims =
            request.skipBrokerClaims && !!request.embeddedClientId
                ? undefined
                : this.config.auth.clientCapabilities;

        const { scopes, claims, dpopNonce } = request as (
            | PopupRequest
            | SsoSilentRequest
        ) & {
            dpopNonce?: string;
        };
        const scopeSet = new ScopeSet(
            [...(scopes || []), ...Constants.OIDC_DEFAULT_SCOPES],
            this.correlationId
        );

        const mergedClaims = RequestParameterBuilder.buildMergedClaims(
            claims,
            configClaims?.length ? configClaims : undefined
        );

        const hasAttributeTokens = !!request.attributeTokens?.length;
        this.performanceClient?.addFields(
            {
                hasAttributeTokens,
            },
            this.correlationId
        );
        const redirectUri = getRedirectUri(
            request.redirectUri,
            this.config.auth.redirectUri,
            this.logger,
            this.correlationId
        );
        const brokerParameters = this.createBrokerRequestParameters(
            request,
            redirectUri
        );
        const tokenParameters = await this.createTokenRequestParameters(
            request
        );
        const extraParametersNoCache = createPlatformAuthExtraParametersNoCache(
            tokenParameters.tokenType,
            tokenParameters.resourceRequestMethod,
            tokenParameters.resourceRequestUri,
            dpopNonce
        );
        const attributeTokens = CacheHelpers.serializeAttributeTokens(
            request.attributeTokens
        );

        return {
            claims: mergedClaims,
            accountId: this.accountId,
            clientId: this.config.auth.clientId,
            authority: canonicalAuthority.urlString,
            scope: scopeSet.printScopes(),
            redirectUri: brokerParameters.redirectUri,
            prompt: this.getPrompt(request.prompt),
            correlationId: this.correlationId,
            isSts: false,
            windowTitleSubstring: document.title,
            nonce: request.nonce,
            state: request.state,
            loginHint: request.loginHint,
            extraParameters: brokerParameters.extraParameters,
            extendedExpiryToken: false, // Make this configurable?
            ...tokenParameters,
            ...(extraParametersNoCache && { extraParametersNoCache }),
            ...(attributeTokens && { attributeTokens }),
        };
    }

    private async createTokenRequestParameters(
        request: PopupRequest | SsoSilentRequest
    ): Promise<PlatformAuthTokenRequestParameters> {
        switch (request.authenticationScheme) {
            case Constants.AuthenticationScheme.POP:
                return this.createPopRequestParameters(request);
            case Constants.AuthenticationScheme.DPOP:
                return this.createDpopRequestParameters(request);
            default:
                return {
                    tokenType: request.authenticationScheme,
                };
        }
    }

    private async createPopRequestParameters(
        request: PopupRequest | SsoSilentRequest
    ): Promise<PlatformAuthTokenRequestParameters> {
        const shrParameters: SignedHttpRequestParameters = {
            resourceRequestUri: request.resourceRequestUri,
            resourceRequestMethod: request.resourceRequestMethod,
            shrClaims: request.shrClaims,
            shrNonce: request.shrNonce,
            correlationId: this.correlationId,
        };
        const popTokenGenerator = new PopTokenGenerator(
            this.browserCrypto,
            this.tokenBindingKeyManager,
            this.performanceClient
        );

        if (request.popKid) {
            return {
                tokenType: Constants.AuthenticationScheme.POP,
                keyId: request.popKid,
                reqCnf: this.browserCrypto.base64UrlEncode(
                    JSON.stringify({ kid: request.popKid })
                ),
                signPopToken: false,
                resourceRequestMethod: request.resourceRequestMethod,
                resourceRequestUri: request.resourceRequestUri,
                shrClaims: request.shrClaims,
                shrNonce: request.shrNonce,
            };
        }

        const generatedReqCnfData = await invokeAsync(
            popTokenGenerator.generateCnf.bind(popTokenGenerator),
            PerformanceEvents.PopTokenGenerateCnf,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(shrParameters, this.logger);

        return {
            tokenType: Constants.AuthenticationScheme.POP,
            keyId: generatedReqCnfData.kid,
            reqCnf: generatedReqCnfData.reqCnfString,
            signPopToken: true,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            shrNonce: request.shrNonce,
        };
    }

    private createDpopRequestParameters(
        request: PopupRequest | SsoSilentRequest
    ): PlatformAuthTokenRequestParameters {
        if (request.popKid) {
            throw createBrowserAuthError(
                DPOP_POP_KID_NOT_SUPPORTED,
                this.correlationId
            );
        }

        if (
            !request.resourceRequestMethod?.trim() ||
            !request.resourceRequestUri?.trim()
        ) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.dpopMissingResourceContext,
                this.correlationId
            );
        }

        const resourceContext = normalizeDpopResourceRequestContext(
            {
                htm: request.resourceRequestMethod,
                htu: request.resourceRequestUri,
            },
            this.correlationId
        );

        return {
            tokenType: PlatformAuthTokenType.DPOP_WITH_PROOF,
            preferBinding: PlatformAuthBindingPreference.ATTESTED,
            keyId: request.dpopJkt,
            resourceRequestMethod: resourceContext.htm,
            resourceRequestUri: resourceContext.htu,
        };
    }

    /**
     * Provisions the local key and confirmation data for a DPoP broker request.
     * @param request - Broker request to prepare.
     * @param reuseExistingKey - Whether a complete existing key binding may be reused.
     */
    private async prepareDpopBrokerRequest(
        request: PlatformAuthRequest,
        reuseExistingKey: boolean = false
    ): Promise<void> {
        if (request.tokenType !== PlatformAuthTokenType.DPOP_WITH_PROOF) {
            return;
        }

        /*
         * Phase one clears both fields after an L3 response or non-fatal broker
         * error. In that case phase two must provision a replacement. If either
         * field remains, treat it as a retained binding and validate it fully.
         */
        if (reuseExistingKey && (request.keyId || request.reqCnf)) {
            if (!request.keyId || !request.reqCnf) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    this.correlationId,
                    "DPoP request key binding is incomplete after redirect."
                );
            }

            const expectedReqCnf = this.createDpopBrokerReqCnf(request.keyId);
            if (request.reqCnf !== expectedReqCnf) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    this.correlationId,
                    "DPoP request key binding is invalid after redirect."
                );
            }
            const hasKey =
                this.tokenBindingKeyManager.hasTokenBindingKey !== undefined
                    ? await this.tokenBindingKeyManager.hasTokenBindingKey(
                          request.keyId,
                          this.correlationId
                      )
                    : await this.tokenBindingKeyManager
                          .getTokenBindingPublicKeyJwk(
                              request.keyId,
                              this.correlationId
                          )
                          .then(
                              () => true,
                              () => false
                          );
            if (!hasKey) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    this.correlationId,
                    "DPoP request key is unavailable after redirect."
                );
            }
            return;
        }

        if (request.reqCnf) {
            throw createAuthError(
                AuthErrorCodes.unexpectedError,
                this.correlationId,
                "Unexpected preexisting DPoP request key."
            );
        }

        if (!request.keyId) {
            request.keyId =
                await this.tokenBindingKeyManager.provisionTokenBindingKey({
                    tokenBindingKeyType:
                        Constants.AuthenticationScheme.DPOP.toLowerCase(),
                    tokenBindingKeyAlgorithm: JsonWebTokenAlgorithms.ES256,
                    correlationId: this.correlationId,
                });
        }
        request.reqCnf = this.createDpopBrokerReqCnf(request.keyId);
    }

    /**
     * Creates the confirmation claim for an MSAL-owned broker DPoP key.
     * @param keyId - Browser-managed DPoP key identifier.
     * @returns Encoded broker confirmation claim.
     */
    private createDpopBrokerReqCnf(keyId: string): string {
        return this.browserCrypto.base64UrlEncode(
            JSON.stringify({
                kid: keyId,
                xms_ksl:
                    PlatformAuthInteractionClient.DPOP_BROKER_REQUEST_KEY_LOCATION,
            })
        );
    }

    /**
     * Ensures an owned DPoP key can survive redirect navigation before the
     * request metadata is persisted for phase two.
     */
    private async ensureRedirectDpopKeyIsPersisted(
        request: PlatformAuthRequest
    ): Promise<void> {
        if (!request.keyId) {
            return;
        }

        if (
            !(await isTokenBindingKeyPersistedForRedirect(
                request,
                this.tokenBindingKeyManager
            ))
        ) {
            throw createAuthError(
                AuthErrorCodes.unexpectedError,
                this.correlationId,
                "DPoP request key could not be persisted for redirect."
            );
        }
    }

    /**
     * Validates and normalizes the DPoP binding outcome returned by the broker.
     * @param response - Broker response to validate.
     * @param request - Broker request associated with the response.
     * @returns The validated DPoP binding level, or `none` for non-DPoP requests.
     */
    private validateDpopBrokerOutcome(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest
    ): "none" | "L1" | "L3" {
        const throwInvalidDpopResponse = (
            failureReason: BrokerDpopFailureReason,
            message: string
        ): never => {
            this.performanceClient.addFields(
                {
                    "ext.brokerDpopOutcome": "invalid_response",
                    "ext.brokerDpopFailureReason": failureReason,
                },
                this.correlationId
            );
            throw createAuthError(
                AuthErrorCodes.unexpectedError,
                this.correlationId,
                message
            );
        };
        const isDpopRequest = this.isDpopBrokerRequest(request);
        const responseProperties = response.properties as
            | (NativeResponseProperties & {
                  token_type?: string;
                  DPoP?: string;
                  binding_attested?: boolean | string;
              })
            | undefined;
        const propertyTokenType = responseProperties?.token_type;
        const topLevelTokenType = response.token_type;
        const normalizeTokenType = (
            tokenType: string | undefined
        ): string | undefined =>
            typeof tokenType === "string"
                ? tokenType.trim().toLowerCase()
                : undefined;
        const normalizedPropertyTokenType =
            normalizeTokenType(propertyTokenType);
        const normalizedTopLevelTokenType =
            normalizeTokenType(topLevelTokenType);
        const normalizedResponseTokenType =
            normalizedPropertyTokenType ?? normalizedTopLevelTokenType;
        const hasConflictingTokenType =
            normalizedPropertyTokenType !== undefined &&
            normalizedTopLevelTokenType !== undefined &&
            normalizedPropertyTokenType !== normalizedTopLevelTokenType;
        const normalizedRequestTokenType = request.tokenType
            ?.trim()
            .toLowerCase();
        const bindingPreferenceSent =
            request.bindingPreferenceSent ??
            request.preferBinding !== undefined;
        const dpopTokenType = Constants.AuthenticationScheme.DPOP.toLowerCase();
        const dpopWithProofTokenType =
            PlatformAuthTokenType.DPOP_WITH_PROOF.toLowerCase();
        const propertyProof = responseProperties?.DPoP;
        const topLevelProof = response.DPoP;
        const brokerProof = propertyProof ?? topLevelProof;
        const proofValues = [propertyProof, topLevelProof].filter(
            (proof): proof is string => proof !== undefined
        );
        const hasConflictingProof = new Set(proofValues).size > 1;
        const normalizeBindingAttestedValue = (
            value: boolean | string | undefined
        ): boolean | undefined =>
            typeof value === "boolean"
                ? value
                : typeof value === "string"
                ? value.trim().toLowerCase() === "true"
                    ? true
                    : value.trim().toLowerCase() === "false"
                    ? false
                    : undefined
                : undefined;
        const propertyBindingAttested = responseProperties?.binding_attested;
        const topLevelBindingAttested = response.binding_attested;
        const normalizedPropertyBindingAttested = normalizeBindingAttestedValue(
            propertyBindingAttested
        );
        const normalizedTopLevelBindingAttested = normalizeBindingAttestedValue(
            topLevelBindingAttested
        );
        const normalizedBindingAttested =
            normalizedPropertyBindingAttested ??
            normalizedTopLevelBindingAttested;
        const hasMalformedBindingAttested =
            (propertyBindingAttested !== undefined &&
                normalizedPropertyBindingAttested === undefined) ||
            (topLevelBindingAttested !== undefined &&
                normalizedTopLevelBindingAttested === undefined);
        const hasConflictingBindingAttested =
            normalizedPropertyBindingAttested !== undefined &&
            normalizedTopLevelBindingAttested !== undefined &&
            normalizedPropertyBindingAttested !==
                normalizedTopLevelBindingAttested;
        const hasDpopResponse =
            this.isDpopBrokerTokenType(normalizedResponseTokenType) ||
            brokerProof !== undefined ||
            response.binding_attested !== undefined ||
            responseProperties?.binding_attested !== undefined;

        if (!isDpopRequest) {
            if (hasDpopResponse) {
                throwInvalidDpopResponse(
                    "unexpected_response",
                    "Unexpected DPoP broker response."
                );
            }
            return "none";
        }

        if (!this.isDpopBrokerTokenType(normalizedResponseTokenType)) {
            throwInvalidDpopResponse(
                "unknown_token_type",
                "Unknown DPoP broker response."
            );
        }

        if (
            hasConflictingProof ||
            hasConflictingTokenType ||
            hasConflictingBindingAttested
        ) {
            throwInvalidDpopResponse(
                "conflicting_fields",
                "Conflicting DPoP broker response."
            );
        }

        if (hasMalformedBindingAttested) {
            throwInvalidDpopResponse(
                "invalid_attestation",
                "Conflicting DPoP broker response."
            );
        }

        if (bindingPreferenceSent && normalizedBindingAttested === undefined) {
            throwInvalidDpopResponse(
                "missing_attestation",
                "Conflicting DPoP broker response."
            );
        }

        response.binding_attested = normalizedBindingAttested;
        response.DPoP = brokerProof;

        const hasProof = brokerProof !== undefined;
        if (
            hasProof &&
            (typeof brokerProof !== "string" || brokerProof.trim().length === 0)
        ) {
            throwInvalidDpopResponse(
                "missing_proof",
                "Malformed DPoP broker response."
            );
        }

        if (hasProof) {
            if (normalizedBindingAttested !== true) {
                throwInvalidDpopResponse(
                    "invalid_attestation",
                    "Malformed DPoP broker response."
                );
            }
            if (
                normalizedRequestTokenType !== dpopWithProofTokenType ||
                normalizedResponseTokenType !== dpopWithProofTokenType
            ) {
                throwInvalidDpopResponse(
                    "conflicting_fields",
                    "Malformed DPoP broker response."
                );
            }
            response.token_type = PlatformAuthTokenType.DPOP_WITH_PROOF;
            this.performanceClient.addFields(
                {
                    "ext.brokerDpopOutcome": "l3",
                    "ext.brokerDpopBindingLevel": "L3",
                },
                this.correlationId
            );
            return "L3";
        }

        if (normalizedResponseTokenType !== dpopTokenType) {
            throwInvalidDpopResponse(
                "missing_proof",
                "Malformed DPoP broker response."
            );
        }
        response.token_type = Constants.AuthenticationScheme.DPOP;

        if (normalizedRequestTokenType !== dpopWithProofTokenType) {
            throwInvalidDpopResponse(
                "conflicting_fields",
                "Malformed DPoP broker L1 response."
            );
        }

        if (
            normalizedBindingAttested !== false &&
            !(!bindingPreferenceSent && normalizedBindingAttested === undefined)
        ) {
            throwInvalidDpopResponse(
                "invalid_attestation",
                "Malformed DPoP broker L1 response."
            );
        }

        if (!request.reqCnf || !request.keyId) {
            throwInvalidDpopResponse(
                "missing_l1_binding",
                "Malformed DPoP broker L1 response."
            );
        }

        this.performanceClient.addFields(
            {
                "ext.brokerDpopOutcome": "l1",
                "ext.brokerDpopBindingLevel": "L1",
            },
            this.correlationId
        );
        return "L1";
    }

    /**
     * Returns the broker proof or signs an L1 resource proof with the local key.
     * @param response - Broker response containing the access token and optional proof.
     * @param request - Broker request containing the proof context and local key.
     * @returns The resource proof for the broker access token.
     */
    private async generateDpopProof(
        response: PlatformAuthResponse,
        request: PlatformAuthRequest
    ): Promise<string> {
        if (response.DPoP !== undefined) {
            return response.DPoP;
        }

        const dpopProofGenerator = new DpopProofGenerator(
            this.browserCrypto,
            this.tokenBindingKeyManager
        );
        return dpopProofGenerator.generateResourceProof(
            {
                htu: request.resourceRequestUri,
                htm: request.resourceRequestMethod,
                accessToken: response.access_token,
                nonce: request.extraParametersNoCache?.pop_nonce,
            },
            request.keyId as string,
            this.correlationId
        );
    }

    /**
     * Removes a generated DPoP request key and clears its request metadata.
     * @param request - Broker request whose generated key should be removed.
     * @param mode - Whether cleanup failures should be thrown or only recorded.
     */
    private async resetGeneratedDpopRequestKey(
        request: PlatformAuthRequest,
        mode: "strict" | "best-effort" = "strict"
    ): Promise<void> {
        if (!this.isDpopBrokerRequest(request) || !request.keyId) {
            return;
        }

        try {
            if (request.keyId && !(await this.removeDpopKey(request.keyId))) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    this.correlationId,
                    "Failed to remove generated DPoP request key."
                );
            }

            request.keyId = undefined;
            request.reqCnf = undefined;
        } catch (error) {
            if (mode === "strict") {
                throw error;
            }

            this.logger.error(
                "Failed to remove generated DPoP request key after an operation error.",
                this.correlationId
            );
            this.performanceClient.incrementFields(
                { removeTokenBindingKeyFailure: 1 },
                this.correlationId
            );

            request.keyId = undefined;
            request.reqCnf = undefined;
        }
    }

    /**
     * Determines whether a request uses the DPoP broker protocol.
     * @param request - Broker request to inspect.
     * @returns Whether the request uses a DPoP token type.
     */
    private isDpopBrokerRequest(request: PlatformAuthRequest): boolean {
        return this.isDpopBrokerTokenType(request.tokenType);
    }

    /**
     * Determines whether a token type represents a DPoP broker request.
     * @param tokenType - Token type to inspect.
     * @returns Whether the token type is a supported DPoP broker token type.
     */
    private isDpopBrokerTokenType(tokenType: string | undefined): boolean {
        const normalizedTokenType = tokenType?.trim().toLowerCase();
        return (
            normalizedTokenType === PlatformAuthTokenType.DPOP_WITH_PROOF ||
            normalizedTokenType ===
                Constants.AuthenticationScheme.DPOP.toLowerCase()
        );
    }

    /**
     * Removes a DPoP key while reporting cleanup failures.
     * @param keyId - Identifier of the DPoP key to remove.
     * @returns Whether the key was removed successfully.
     */
    private async removeDpopKey(keyId: string): Promise<boolean> {
        try {
            await this.tokenBindingKeyManager.removeTokenBindingKey(
                keyId,
                this.correlationId
            );
            return true;
        } catch {
            this.logger.error(
                "Failed to remove unused DPoP key",
                this.correlationId
            );
            return false;
        }
    }

    private async getCanonicalAuthority(
        request: PopupRequest | SsoSilentRequest
    ): Promise<UrlString> {
        const requestAuthority =
            request.authority || this.config.auth.authority;

        const { azureCloudOptions, account } = request;

        if (account) {
            // validate authority
            await getDiscoveredAuthority(
                this.config,
                this.correlationId,
                this.performanceClient,
                this.browserStorage,
                this.logger,
                requestAuthority,
                azureCloudOptions,
                undefined, // requestExtraQueryParameters
                account
            );
        }

        const canonicalAuthority = new UrlString(
            requestAuthority,
            this.correlationId
        );
        canonicalAuthority.validateAsUri();
        return canonicalAuthority;
    }

    private getPrompt(prompt?: string): string | undefined {
        // If request is silent, prompt is always none
        switch (this.apiId) {
            case ApiId.ssoSilent:
            case ApiId.acquireTokenSilent_silentFlow:
                this.logger.trace(
                    "initializePlatformRequest: silent request sets prompt to none",
                    this.correlationId
                );
                return Constants.PromptValue.NONE;
            default:
                break;
        }

        // Prompt not provided, request may proceed and native broker decides if it needs to prompt
        if (!prompt) {
            this.logger.trace(
                "initializePlatformRequest: prompt was not provided",
                this.correlationId
            );
            return undefined;
        }

        // If request is interactive, check if prompt provided is allowed to go directly to native broker
        switch (prompt) {
            case Constants.PromptValue.NONE:
            case Constants.PromptValue.CONSENT:
            case Constants.PromptValue.LOGIN:
                this.logger.trace(
                    "initializePlatformRequest: prompt is compatible with native flow",
                    this.correlationId
                );
                return prompt;
            default:
                this.logger.trace(
                    `initializePlatformRequest: prompt = '${prompt}' is not compatible with native flow`,
                    this.correlationId
                );
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.nativePromptNotSupported,
                    this.correlationId
                );
        }
    }

    private createBrokerRequestParameters(
        request: PopupRequest | SsoSilentRequest,
        redirectUri: string
    ): {
        redirectUri: string;
        extraParameters: NonNullable<PlatformAuthRequest["extraParameters"]>;
    } {
        const extraParameters: NonNullable<
            PlatformAuthRequest["extraParameters"]
        > = {
            ...request.extraParameters,
            ...(request.resource && { resource: request.resource }),
            telemetry: PlatformAuthConstants.MATS_TELEMETRY,
            [AADServerParamKeys.X_CLIENT_EXTRA_SKU]: this.skus,
        };
        const hasOwnParameter = (parameter: string): boolean =>
            Object.prototype.hasOwnProperty.call(extraParameters, parameter);
        const hasExtraBrokerParams =
            hasOwnParameter(AADServerParamKeys.BROKER_CLIENT_ID) &&
            hasOwnParameter(AADServerParamKeys.BROKER_REDIRECT_URI) &&
            hasOwnParameter(AADServerParamKeys.CLIENT_ID);

        if (!request.embeddedClientId && !hasExtraBrokerParams) {
            return {
                redirectUri,
                extraParameters,
            };
        }

        const childRedirectUri = redirectUri;
        const childClientId =
            request.embeddedClientId ||
            extraParameters[AADServerParamKeys.CLIENT_ID];
        const brokerRedirectUri = request.embeddedClientId
            ? this.config.auth.redirectUri
            : extraParameters[AADServerParamKeys.BROKER_REDIRECT_URI];

        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [AADServerParamKeys.BROKER_CLIENT_ID]: _brkClientId,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [AADServerParamKeys.BROKER_REDIRECT_URI]: _brkRedirectUri,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [AADServerParamKeys.CLIENT_ID]: _clientId,
            ...remainingExtraParameters
        } = extraParameters;
        const brokerExtraParameters = {
            ...remainingExtraParameters,
            child_client_id: childClientId,
            child_redirect_uri: childRedirectUri,
        };

        this.performanceClient?.addFields(
            {
                embeddedClientId: childClientId,
                embeddedRedirectUri: childRedirectUri,
            },
            this.correlationId
        );

        return {
            redirectUri: brokerRedirectUri,
            extraParameters: brokerExtraParameters,
        };
    }
}
