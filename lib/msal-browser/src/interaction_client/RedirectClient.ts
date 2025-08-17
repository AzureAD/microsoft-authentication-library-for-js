/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    UrlString,
    AuthError,
    ServerTelemetryManager,
    AuthorizeResponse,
    ICrypto,
    Logger,
    IPerformanceClient,
    PerformanceEvents,
    ProtocolMode,
    invokeAsync,
    Constants,
    UrlUtils,
    InProgressPerformanceEvent,
    CommonAuthorizationUrlRequest,
} from "@azure/msal-common/browser";
import {
    initializeAuthorizationRequest,
    StandardInteractionClient,
} from "./StandardInteractionClient.js";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import {
    ApiId,
    INTERACTION_TYPE,
    InteractionType,
    TemporaryCacheKeys,
} from "../utils/BrowserConstants.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { EventType } from "../event/EventType.js";
import { NavigationOptions } from "../navigation/NavigationOptions.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { EventHandler } from "../event/EventHandler.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { EventError } from "../event/EventMessage.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import * as ResponseHandler from "../response/ResponseHandler.js";
import * as Authorize from "../protocol/Authorize.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
import { isPlatformAuthAllowed } from "../broker/nativeBroker/PlatformAuthProvider.js";
import { generateEarKey } from "../crypto/BrowserCrypto.js";
import { IPlatformAuthHandler } from "../broker/nativeBroker/IPlatformAuthHandler.js";
import {
    clearCacheOnLogout,
    getDiscoveredAuthority,
    initializeServerTelemetryManager,
} from "./BaseInteractionClient.js";
import { HandleRedirectPromiseOptions } from "../controllers/IController.js";

function getNavigationType(): NavigationTimingType | undefined {
    if (
        typeof window === "undefined" ||
        typeof window.performance === "undefined" ||
        typeof window.performance.getEntriesByType !== "function"
    ) {
        return undefined;
    }

    const navigationEntries = window.performance.getEntriesByType("navigation");
    const navigation = navigationEntries.length
        ? (navigationEntries[0] as PerformanceNavigationTiming)
        : undefined;
    return navigation?.type;
}

export class RedirectClient extends StandardInteractionClient {
    protected ns: BrowserCacheManager; // nativeStorage

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        nativeStorageImpl: BrowserCacheManager,
        platformAuthHandler?: IPlatformAuthHandler,
        correlationId?: string
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            platformAuthHandler,
            correlationId
        );
        this.ns = nativeStorageImpl;
    }

    /**
     * Redirects the page to the /authorize endpoint of the IDP
     * @param request
     */
    async acquireToken(request: RedirectRequest): Promise<void> {
        const validRequest = await invokeAsync(
            initializeAuthorizationRequest,
            BrowserPerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest,
            this.l,
            this.pc,
            this.cId
        )(
            request,
            InteractionType.Redirect,
            this.cfg,
            this.bc,
            this.bs,
            this.l,
            this.pc,
            this.cId
        );

        validRequest.platformBroker = isPlatformAuthAllowed(
            this.cfg,
            this.l,
            this.pap,
            request.authenticationScheme
        );

        const handleBackButton = (event: PageTransitionEvent) => {
            // Clear temporary cache if the back button is clicked during the redirect flow.
            if (event.persisted) {
                this.l.verbose(
                    "Page was restored from back/forward cache. Clearing temporary cache."
                );
                this.bs.resetRequestCache();
                this.eh.emitEvent(
                    EventType.RESTORE_FROM_BFCACHE,
                    InteractionType.Redirect
                );
            }
        };

        const redirectStartPage = this.getRedirectStartPage(
            request.redirectStartPage
        );
        this.l.verbosePii(`Redirect start page: ${redirectStartPage}`);
        // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
        this.bs.setTemporaryCache(
            TemporaryCacheKeys.ORIGIN_URI,
            redirectStartPage,
            true
        );

        // Clear temporary cache if the back button is clicked during the redirect flow.
        window.addEventListener("pageshow", handleBackButton);

        try {
            if (this.cfg.system.protocolMode === ProtocolMode.EAR) {
                await this.executeEarFlow(validRequest);
            } else {
                await this.executeCodeFlow(validRequest);
            }
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.cId);
            }
            window.removeEventListener("pageshow", handleBackButton);
            throw e;
        }
    }

    /**
     * Executes auth code + PKCE flow
     * @param request
     * @returns
     */
    async executeCodeFlow(
        request: CommonAuthorizationUrlRequest
    ): Promise<void> {
        const correlationId = request.correlationId;
        const serverTelemetryManager = initializeServerTelemetryManager(
            ApiId.acquireTokenRedirect,
            this.cfg.auth.clientId,
            this.cId,
            this.bs,
            this.l
        );

        const pkceCodes = await invokeAsync(
            generatePkceCodes,
            BrowserPerformanceEvents.GeneratePkceCodes,
            this.l,
            this.pc,
            correlationId
        )(this.pc, this.l, correlationId);

        const redirectRequest = {
            ...request,
            codeChallenge: pkceCodes.challenge,
        };

        this.bs.cacheAuthorizeRequest(
            redirectRequest,
            pkceCodes.verifier
        );

        try {
            // Initialize the client
            const authClient: AuthorizationCodeClient = await invokeAsync(
                this.createAuthCodeClient.bind(this),
                BrowserPerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
                this.l,
                this.pc,
                this.cId
            )({
                serverTelemetryManager,
                requestAuthority: redirectRequest.authority,
                requestAzureCloudOptions: redirectRequest.azureCloudOptions,
                requestExtraQueryParameters:
                    redirectRequest.extraQueryParameters,
                account: redirectRequest.account,
            });

            // Create acquire token url.
            const navigateUrl = await invokeAsync(
                Authorize.getAuthCodeRequestUrl,
                PerformanceEvents.GetAuthCodeUrl,
                this.l,
                this.pc,
                request.correlationId
            )(
                this.cfg,
                authClient.auth,
                redirectRequest,
                this.l,
                this.pc
            );
            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            return await this.initiateAuthRequest(navigateUrl);
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.cId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            throw e;
        }
    }

    /**
     * Executes EAR flow
     * @param request
     */
    async executeEarFlow(
        request: CommonAuthorizationUrlRequest
    ): Promise<void> {
        const {
            correlationId,
            authority,
            azureCloudOptions,
            extraQueryParameters,
            account,
        } = request;
        // Get the frame handle for the silent request
        const discoveredAuthority = await invokeAsync(
            getDiscoveredAuthority,
            BrowserPerformanceEvents.StandardInteractionClientGetDiscoveredAuthority,
            this.l,
            this.pc,
            correlationId
        )(
            this.cfg,
            this.cId,
            this.pc,
            this.bs,
            this.l,
            authority,
            azureCloudOptions,
            extraQueryParameters,
            account
        );

        const earJwk = await invokeAsync(
            generateEarKey,
            BrowserPerformanceEvents.GenerateEarKey,
            this.l,
            this.pc,
            correlationId
        )();
        const redirectRequest = {
            ...request,
            earJwk: earJwk,
        };
        this.bs.cacheAuthorizeRequest(redirectRequest);

        const form = await Authorize.getEARForm(
            document,
            this.cfg,
            discoveredAuthority,
            redirectRequest,
            this.l,
            this.pc
        );
        form.submit();
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                reject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.timedOut,
                        "failed_to_redirect"
                    )
                );
            }, this.cfg.system.redirectNavigationTimeout);
        });
    }

    /**
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate
     * - if false, handles hash string and parses response
     * @param hash {string} url hash
     * @param parentMeasurement {InProgressPerformanceEvent} parent measurement
     * @param request {CommonAuthorizationUrlRequest} request object
     * @param pkceVerifier {string} PKCE verifier
     * @param options {HandleRedirectPromiseOptions} options for handling redirect promise
     */
    async handleRedirectPromise(
        request: CommonAuthorizationUrlRequest,
        pkceVerifier: string,
        parentMeasurement: InProgressPerformanceEvent,
        options?: HandleRedirectPromiseOptions
    ): Promise<AuthenticationResult | null> {
        const serverTelemetryManager = initializeServerTelemetryManager(
            ApiId.handleRedirectPromise,
            this.cfg.auth.clientId,
            this.cId,
            this.bs,
            this.l
        );

        const navigateToLoginRequestUrl =
            options?.navigateToLoginRequestUrl ?? true;

        try {
            const [serverParams, responseString] = this.getRedirectResponse(
                options?.hash || ""
            );
            if (!serverParams) {
                // Not a recognized server response hash or hash not associated with a redirect request
                this.l.info(
                    "handleRedirectPromise did not detect a response as a result of a redirect. Cleaning temporary cache."
                );
                this.bs.resetRequestCache();

                // Do not instrument "no_server_response" if user clicked back button
                if (getNavigationType() !== "back_forward") {
                    parentMeasurement.event.errorCode = "no_server_response";
                } else {
                    this.l.verbose(
                        "Back navigation event detected. Muting no_server_response error"
                    );
                }
                return null;
            }

            // If navigateToLoginRequestUrl is true, get the url where the redirect request was initiated
            const loginRequestUrl =
                this.bs.getTemporaryCache(
                    TemporaryCacheKeys.ORIGIN_URI,
                    true
                ) || "";
            const loginRequestUrlNormalized =
                UrlString.removeHashFromUrl(loginRequestUrl);
            const currentUrlNormalized = UrlString.removeHashFromUrl(
                window.location.href
            );

            if (
                loginRequestUrlNormalized === currentUrlNormalized &&
                navigateToLoginRequestUrl
            ) {
                // We are on the page we need to navigate to - handle hash
                this.l.verbose(
                    "Current page is loginRequestUrl, handling response"
                );

                if (loginRequestUrl.indexOf("#") > -1) {
                    // Replace current hash with non-msal hash, if present
                    BrowserUtils.replaceHash(loginRequestUrl);
                }

                const handleHashResult = await this.handleResponse(
                    serverParams,
                    request,
                    pkceVerifier,
                    serverTelemetryManager
                );

                return handleHashResult;
            } else if (!navigateToLoginRequestUrl) {
                this.l.verbose(
                    "NavigateToLoginRequestUrl set to false, handling response"
                );
                return await this.handleResponse(
                    serverParams,
                    request,
                    pkceVerifier,
                    serverTelemetryManager
                );
            } else if (
                !BrowserUtils.isInIframe() ||
                this.cfg.system.allowRedirectInIframe
            ) {
                /*
                 * Returned from authority using redirect - need to perform navigation before processing response
                 * Cache the hash to be retrieved after the next redirect
                 */
                this.bs.setTemporaryCache(
                    TemporaryCacheKeys.URL_HASH,
                    responseString,
                    true
                );
                const navigationOptions: NavigationOptions = {
                    apiId: ApiId.handleRedirectPromise,
                    timeout: this.cfg.system.redirectNavigationTimeout,
                    noHistory: true,
                };

                /**
                 * Default behavior is to redirect to the start page and not process the hash now.
                 * The start page is expected to also call handleRedirectPromise which will process the hash in one of the checks above.
                 */
                let processHashOnRedirect: boolean = true;
                if (!loginRequestUrl || loginRequestUrl === "null") {
                    // Redirect to home page if login request url is null (real null or the string null)
                    const homepage = BrowserUtils.getHomepage();
                    // Cache the homepage under ORIGIN_URI to ensure cached hash is processed on homepage
                    this.bs.setTemporaryCache(
                        TemporaryCacheKeys.ORIGIN_URI,
                        homepage,
                        true
                    );
                    this.l.warning(
                        "Unable to get valid login request url from cache, redirecting to home page"
                    );
                    processHashOnRedirect =
                        await this.navClient.navigateInternal(
                            homepage,
                            navigationOptions
                        );
                } else {
                    // Navigate to page that initiated the redirect request
                    this.l.verbose(
                        `Navigating to loginRequestUrl: ${loginRequestUrl}`
                    );
                    processHashOnRedirect =
                        await this.navClient.navigateInternal(
                            loginRequestUrl,
                            navigationOptions
                        );
                }

                // If navigateInternal implementation returns false, handle the hash now
                if (!processHashOnRedirect) {
                    return await this.handleResponse(
                        serverParams,
                        request,
                        pkceVerifier,
                        serverTelemetryManager
                    );
                }
            }

            return null;
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.cId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            throw e;
        }
    }

    /**
     * Gets the response hash for a redirect request
     * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
     * @param hash
     */
    protected getRedirectResponse(
        userProvidedResponse: string
    ): [AuthorizeResponse | null, string] {
        this.l.verbose("getRedirectResponseHash called");
        // Get current location hash from window or cache.
        let responseString = userProvidedResponse;
        if (!responseString) {
            if (
                this.cfg.auth.OIDCOptions.responseMode ===
                Constants.ResponseMode.QUERY
            ) {
                responseString = window.location.search;
            } else {
                responseString = window.location.hash;
            }
        }
        let response = UrlUtils.getDeserializedResponse(responseString);

        if (response) {
            try {
                ResponseHandler.validateInteractionType(
                    response,
                    this.bc,
                    InteractionType.Redirect
                );
            } catch (e) {
                if (e instanceof AuthError) {
                    this.l.error(
                        `Interaction type validation failed due to ${e.errorCode}: ${e.errorMessage}`
                    );
                }
                return [null, ""];
            }

            BrowserUtils.clearHash(window);
            this.l.verbose(
                "Hash contains known properties, returning response hash"
            );
            return [response, responseString];
        }

        const cachedHash = this.bs.getTemporaryCache(
            TemporaryCacheKeys.URL_HASH,
            true
        );
        this.bs.removeItem(
            this.bs.generateCacheKey(TemporaryCacheKeys.URL_HASH)
        );

        if (cachedHash) {
            response = UrlUtils.getDeserializedResponse(cachedHash);
            if (response) {
                this.l.verbose(
                    "Hash does not contain known properties, returning cached hash"
                );
                return [response, cachedHash];
            }
        }

        return [null, ""];
    }

    /**
     * Checks if hash exists and handles in window.
     * @param hash
     * @param state
     */
    protected async handleResponse(
        serverParams: AuthorizeResponse,
        request: CommonAuthorizationUrlRequest,
        codeVerifier: string,
        serverTelemetryManager: ServerTelemetryManager
    ): Promise<AuthenticationResult> {
        const state = serverParams.state;
        if (!state) {
            throw createBrowserAuthError(BrowserAuthErrorCodes.noStateInHash);
        }

        const { authority, azureCloudOptions, extraQueryParameters, account } =
            request;

        if (serverParams.ear_jwe) {
            const discoveredAuthority = await invokeAsync(
                getDiscoveredAuthority,
                BrowserPerformanceEvents.StandardInteractionClientGetDiscoveredAuthority,
                this.l,
                this.pc,
                request.correlationId
            )(
                this.cfg,
                this.cId,
                this.pc,
                this.bs,
                this.l,
                authority,
                azureCloudOptions,
                extraQueryParameters,
                account
            );
            return invokeAsync(
                Authorize.handleResponseEAR,
                BrowserPerformanceEvents.HandleResponseEar,
                this.l,
                this.pc,
                request.correlationId
            )(
                request,
                serverParams,
                ApiId.acquireTokenRedirect,
                this.cfg,
                discoveredAuthority,
                this.bs,
                this.ns,
                this.eh,
                this.l,
                this.pc,
                this.pap
            );
        }

        const authClient = await invokeAsync(
            this.createAuthCodeClient.bind(this),
            BrowserPerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
            this.l,
            this.pc,
            this.cId
        )({ serverTelemetryManager, requestAuthority: request.authority });
        return invokeAsync(
            Authorize.handleResponseCode,
            BrowserPerformanceEvents.HandleResponseCode,
            this.l,
            this.pc,
            request.correlationId
        )(
            request,
            serverParams,
            codeVerifier,
            ApiId.acquireTokenRedirect,
            this.cfg,
            authClient,
            this.bs,
            this.ns,
            this.eh,
            this.l,
            this.pc,
            this.pap
        );
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     * @param onRedirectNavigateRequest - onRedirectNavigate callback provided on the request
     */
    async initiateAuthRequest(requestUrl: string): Promise<void> {
        this.l.verbose("RedirectHandler.initiateAuthRequest called");
        // Navigate if valid URL
        if (requestUrl) {
            this.l.infoPii(
                `RedirectHandler.initiateAuthRequest: Navigate to: ${requestUrl}`
            );
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.acquireTokenRedirect,
                timeout: this.cfg.system.redirectNavigationTimeout,
                noHistory: false,
            };

            const onRedirectNavigate = this.cfg.auth.onRedirectNavigate;

            // If onRedirectNavigate is implemented, invoke it and provide requestUrl
            if (typeof onRedirectNavigate === "function") {
                this.l.verbose(
                    "RedirectHandler.initiateAuthRequest: Invoking onRedirectNavigate callback"
                );
                const navigate = onRedirectNavigate(requestUrl);

                // Returning false from onRedirectNavigate will stop navigation
                if (navigate !== false) {
                    this.l.verbose(
                        "RedirectHandler.initiateAuthRequest: onRedirectNavigate did not return false, navigating"
                    );
                    await this.navClient.navigateExternal(
                        requestUrl,
                        navigationOptions
                    );
                    return;
                } else {
                    this.l.verbose(
                        "RedirectHandler.initiateAuthRequest: onRedirectNavigate returned false, stopping navigation"
                    );
                    return;
                }
            } else {
                // Navigate window to request URL
                this.l.verbose(
                    "RedirectHandler.initiateAuthRequest: Navigating window to navigate url"
                );
                await this.navClient.navigateExternal(
                    requestUrl,
                    navigationOptions
                );
                return;
            }
        } else {
            // Throw error if request URL is empty.
            this.l.info(
                "RedirectHandler.initiateAuthRequest: Navigate url is empty"
            );
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.emptyNavigateUri
            );
        }
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        this.l.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const serverTelemetryManager = initializeServerTelemetryManager(
            ApiId.logout,
            this.cfg.auth.clientId,
            this.cId,
            this.bs,
            this.l
        );

        try {
            this.eh.emitEvent(
                EventType.LOGOUT_START,
                InteractionType.Redirect,
                logoutRequest
            );

            // Clear cache on logout
            await clearCacheOnLogout(
                this.bs,
                this.bc,
                this.l,
                this.cId,
                validLogoutRequest.account
            );

            const navigationOptions: NavigationOptions = {
                apiId: ApiId.logout,
                timeout: this.cfg.system.redirectNavigationTimeout,
                noHistory: false,
            };

            const authClient = await invokeAsync(
                this.createAuthCodeClient.bind(this),
                BrowserPerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
                this.l,
                this.pc,
                this.cId
            )({
                serverTelemetryManager,
                requestAuthority: logoutRequest && logoutRequest.authority,
                requestExtraQueryParameters:
                    logoutRequest?.extraQueryParameters,
                account: (logoutRequest && logoutRequest.account) || undefined,
            });

            if (authClient.auth.protocolMode === ProtocolMode.OIDC) {
                try {
                    authClient.auth.endSessionEndpoint;
                } catch {
                    if (validLogoutRequest.account?.homeAccountId) {
                        this.eh.emitEvent(
                            EventType.LOGOUT_SUCCESS,
                            InteractionType.Redirect,
                            validLogoutRequest
                        );

                        return;
                    }
                }
            }

            // Create logout string and navigate user window to logout.
            const logoutUri: string =
                authClient.getLogoutUri(validLogoutRequest);

            this.eh.emitEvent(
                EventType.LOGOUT_SUCCESS,
                InteractionType.Redirect,
                validLogoutRequest
            );
            // Check if onRedirectNavigate is implemented, and invoke it if so
            if (
                logoutRequest &&
                typeof logoutRequest.onRedirectNavigate === "function"
            ) {
                const navigate = logoutRequest.onRedirectNavigate(logoutUri);

                if (navigate !== false) {
                    this.l.verbose(
                        "Logout onRedirectNavigate did not return false, navigating"
                    );
                    // Ensure interaction is in progress
                    if (!this.bs.getInteractionInProgress()) {
                        this.bs.setInteractionInProgress(
                            true,
                            INTERACTION_TYPE.SIGNOUT
                        );
                    }
                    await this.navClient.navigateExternal(
                        logoutUri,
                        navigationOptions
                    );
                    return;
                } else {
                    // Ensure interaction is not in progress
                    this.bs.setInteractionInProgress(false);
                    this.l.verbose(
                        "Logout onRedirectNavigate returned false, stopping navigation"
                    );
                }
            } else {
                // Ensure interaction is in progress
                if (!this.bs.getInteractionInProgress()) {
                    this.bs.setInteractionInProgress(
                        true,
                        INTERACTION_TYPE.SIGNOUT
                    );
                }
                await this.navClient.navigateExternal(
                    logoutUri,
                    navigationOptions
                );
                return;
            }
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.cId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            this.eh.emitEvent(
                EventType.LOGOUT_FAILURE,
                InteractionType.Redirect,
                null,
                e as EventError
            );
            this.eh.emitEvent(
                EventType.LOGOUT_END,
                InteractionType.Redirect
            );
            throw e;
        }

        this.eh.emitEvent(
            EventType.LOGOUT_END,
            InteractionType.Redirect
        );
    }

    /**
     * Use to get the redirectStartPage either from request or use current window
     * @param requestStartPage
     */
    protected getRedirectStartPage(requestStartPage?: string): string {
        const redirectStartPage = requestStartPage || window.location.href;
        return UrlString.getAbsoluteUrl(
            redirectStartPage,
            BrowserUtils.getCurrentUri()
        );
    }
}
