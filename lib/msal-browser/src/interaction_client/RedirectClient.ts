/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationCodeRequest,
    AuthorizationCodeClient,
    UrlString,
    AuthError,
    ServerTelemetryManager,
    Constants,
    ProtocolUtils,
    ServerAuthorizationCodeResponse,
    ThrottlingUtils,
    ICrypto,
    Logger,
    IPerformanceClient,
    PerformanceEvents,
    ProtocolMode,
    invokeAsync,
    ServerResponseType,
    UrlUtils,
    InProgressPerformanceEvent,
} from "@azure/msal-common/browser";
import { StandardInteractionClient } from "./StandardInteractionClient.js";
import {
    ApiId,
    InteractionType,
    TemporaryCacheKeys,
} from "../utils/BrowserConstants.js";
import { RedirectHandler } from "../interaction_handler/RedirectHandler.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { EventType } from "../event/EventType.js";
import { NavigationOptions } from "../navigation/NavigationOptions.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { NativeInteractionClient } from "./NativeInteractionClient.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { EventHandler } from "../event/EventHandler.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { EventError } from "../event/EventMessage.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import * as ResponseHandler from "../response/ResponseHandler.js";

export class RedirectClient extends StandardInteractionClient {
    protected nativeStorage: BrowserCacheManager;

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        nativeStorageImpl: BrowserCacheManager,
        nativeMessageHandler?: NativeMessageHandler,
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
            nativeMessageHandler,
            correlationId
        );
        this.nativeStorage = nativeStorageImpl;
    }

    /**
     * Redirects the page to the /authorize endpoint of the IDP
     * @param request
     */
    async acquireToken(request: RedirectRequest): Promise<void> {
        const validRequest = await invokeAsync(
            this.initializeAuthorizationRequest.bind(this),
            PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(request, InteractionType.Redirect);

        this.browserStorage.updateCacheEntries(
            validRequest.state,
            validRequest.nonce,
            validRequest.authority,
            validRequest.loginHint || "",
            validRequest.account || null
        );
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.acquireTokenRedirect
        );

        const handleBackButton = (event: PageTransitionEvent) => {
            // Clear temporary cache if the back button is clicked during the redirect flow.
            if (event.persisted) {
                this.logger.verbose(
                    "Page was restored from back/forward cache. Clearing temporary cache."
                );
                this.browserStorage.cleanRequestByState(validRequest.state);
                this.eventHandler.emitEvent(
                    EventType.RESTORE_FROM_BFCACHE,
                    InteractionType.Redirect
                );
            }
        };

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest =
                await invokeAsync(
                    this.initializeAuthorizationCodeRequest.bind(this),
                    PerformanceEvents.StandardInteractionClientInitializeAuthorizationCodeRequest,
                    this.logger,
                    this.performanceClient,
                    this.correlationId
                )(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await invokeAsync(
                this.createAuthCodeClient.bind(this),
                PerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
                this.logger,
                this.performanceClient,
                this.correlationId
            )({
                serverTelemetryManager,
                requestAuthority: validRequest.authority,
                requestAzureCloudOptions: validRequest.azureCloudOptions,
                requestExtraQueryParameters: validRequest.extraQueryParameters,
                account: validRequest.account,
            });

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(
                authClient,
                this.browserStorage,
                authCodeRequest,
                this.logger,
                this.performanceClient
            );

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl({
                ...validRequest,
                nativeBroker: NativeMessageHandler.isNativeAvailable(
                    this.config,
                    this.logger,
                    this.nativeMessageHandler,
                    request.authenticationScheme
                ),
            });

            const redirectStartPage = this.getRedirectStartPage(
                request.redirectStartPage
            );
            this.logger.verbosePii(`Redirect start page: ${redirectStartPage}`);

            // Clear temporary cache if the back button is clicked during the redirect flow.
            window.addEventListener("pageshow", handleBackButton);

            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            return await interactionHandler.initiateAuthRequest(navigateUrl, {
                navigationClient: this.navigationClient,
                redirectTimeout: this.config.system.redirectNavigationTimeout,
                redirectStartPage: redirectStartPage,
                onRedirectNavigate:
                    request.onRedirectNavigate ||
                    this.config.auth.onRedirectNavigate,
            });
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            window.removeEventListener("pageshow", handleBackButton);
            this.browserStorage.cleanRequestByState(validRequest.state);
            throw e;
        }
    }

    /**
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate
     * - if false, handles hash string and parses response
     * @param hash {string} url hash
     * @param parentMeasurement {InProgressPerformanceEvent} parent measurement
     */
    async handleRedirectPromise(
        hash: string = "",
        parentMeasurement: InProgressPerformanceEvent
    ): Promise<AuthenticationResult | null> {
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.handleRedirectPromise
        );

        try {
            if (!this.browserStorage.isInteractionInProgress(true)) {
                this.logger.info(
                    "handleRedirectPromise called but there is no interaction in progress, returning null."
                );
                return null;
            }
            const [serverParams, responseString] = this.getRedirectResponse(
                hash || ""
            );
            if (!serverParams) {
                // Not a recognized server response hash or hash not associated with a redirect request
                this.logger.info(
                    "handleRedirectPromise did not detect a response as a result of a redirect. Cleaning temporary cache."
                );
                this.browserStorage.cleanRequestByInteractionType(
                    InteractionType.Redirect
                );
                parentMeasurement.event.errorCode = "no_server_response";
                return null;
            }

            // If navigateToLoginRequestUrl is true, get the url where the redirect request was initiated
            const loginRequestUrl =
                this.browserStorage.getTemporaryCache(
                    TemporaryCacheKeys.ORIGIN_URI,
                    true
                ) || Constants.EMPTY_STRING;
            const loginRequestUrlNormalized =
                UrlString.removeHashFromUrl(loginRequestUrl);
            const currentUrlNormalized = UrlString.removeHashFromUrl(
                window.location.href
            );

            if (
                loginRequestUrlNormalized === currentUrlNormalized &&
                this.config.auth.navigateToLoginRequestUrl
            ) {
                // We are on the page we need to navigate to - handle hash
                this.logger.verbose(
                    "Current page is loginRequestUrl, handling response"
                );

                if (loginRequestUrl.indexOf("#") > -1) {
                    // Replace current hash with non-msal hash, if present
                    BrowserUtils.replaceHash(loginRequestUrl);
                }

                const handleHashResult = await this.handleResponse(
                    serverParams,
                    serverTelemetryManager
                );

                return handleHashResult;
            } else if (!this.config.auth.navigateToLoginRequestUrl) {
                this.logger.verbose(
                    "NavigateToLoginRequestUrl set to false, handling response"
                );
                return await this.handleResponse(
                    serverParams,
                    serverTelemetryManager
                );
            } else if (
                !BrowserUtils.isInIframe() ||
                this.config.system.allowRedirectInIframe
            ) {
                /*
                 * Returned from authority using redirect - need to perform navigation before processing response
                 * Cache the hash to be retrieved after the next redirect
                 */
                this.browserStorage.setTemporaryCache(
                    TemporaryCacheKeys.URL_HASH,
                    responseString,
                    true
                );
                const navigationOptions: NavigationOptions = {
                    apiId: ApiId.handleRedirectPromise,
                    timeout: this.config.system.redirectNavigationTimeout,
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
                    this.browserStorage.setTemporaryCache(
                        TemporaryCacheKeys.ORIGIN_URI,
                        homepage,
                        true
                    );
                    this.logger.warning(
                        "Unable to get valid login request url from cache, redirecting to home page"
                    );
                    processHashOnRedirect =
                        await this.navigationClient.navigateInternal(
                            homepage,
                            navigationOptions
                        );
                } else {
                    // Navigate to page that initiated the redirect request
                    this.logger.verbose(
                        `Navigating to loginRequestUrl: ${loginRequestUrl}`
                    );
                    processHashOnRedirect =
                        await this.navigationClient.navigateInternal(
                            loginRequestUrl,
                            navigationOptions
                        );
                }

                // If navigateInternal implementation returns false, handle the hash now
                if (!processHashOnRedirect) {
                    return await this.handleResponse(
                        serverParams,
                        serverTelemetryManager
                    );
                }
            }

            return null;
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            this.browserStorage.cleanRequestByInteractionType(
                InteractionType.Redirect
            );
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
    ): [ServerAuthorizationCodeResponse | null, string] {
        this.logger.verbose("getRedirectResponseHash called");
        // Get current location hash from window or cache.
        let responseString = userProvidedResponse;
        if (!responseString) {
            if (
                this.config.auth.OIDCOptions.serverResponseType ===
                ServerResponseType.QUERY
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
                    this.browserCrypto,
                    InteractionType.Redirect
                );
            } catch (e) {
                if (e instanceof AuthError) {
                    this.logger.error(
                        `Interaction type validation failed due to ${e.errorCode}: ${e.errorMessage}`
                    );
                }
                return [null, ""];
            }

            BrowserUtils.clearHash(window);
            this.logger.verbose(
                "Hash contains known properties, returning response hash"
            );
            return [response, responseString];
        }

        const cachedHash = this.browserStorage.getTemporaryCache(
            TemporaryCacheKeys.URL_HASH,
            true
        );
        this.browserStorage.removeItem(
            this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH)
        );

        if (cachedHash) {
            response = UrlUtils.getDeserializedResponse(cachedHash);
            if (response) {
                this.logger.verbose(
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
        serverParams: ServerAuthorizationCodeResponse,
        serverTelemetryManager: ServerTelemetryManager
    ): Promise<AuthenticationResult> {
        const state = serverParams.state;
        if (!state) {
            throw createBrowserAuthError(BrowserAuthErrorCodes.noStateInHash);
        }

        const cachedRequest = this.browserStorage.getCachedRequest(state);
        this.logger.verbose("handleResponse called, retrieved cached request");

        if (serverParams.accountId) {
            this.logger.verbose(
                "Account id found in hash, calling WAM for token"
            );
            if (!this.nativeMessageHandler) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.nativeConnectionNotEstablished
                );
            }
            const nativeInteractionClient = new NativeInteractionClient(
                this.config,
                this.browserStorage,
                this.browserCrypto,
                this.logger,
                this.eventHandler,
                this.navigationClient,
                ApiId.acquireTokenPopup,
                this.performanceClient,
                this.nativeMessageHandler,
                serverParams.accountId,
                this.nativeStorage,
                cachedRequest.correlationId
            );
            const { userRequestState } = ProtocolUtils.parseRequestState(
                this.browserCrypto,
                state
            );
            return nativeInteractionClient
                .acquireToken({
                    ...cachedRequest,
                    state: userRequestState,
                    prompt: undefined, // Server should handle the prompt, ideally native broker can do this part silently
                })
                .finally(() => {
                    this.browserStorage.cleanRequestByState(state);
                });
        }

        // Hash contains known properties - handle and return in callback
        const currentAuthority = this.browserStorage.getCachedAuthority(state);
        if (!currentAuthority) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.noCachedAuthorityError
            );
        }

        const authClient = await invokeAsync(
            this.createAuthCodeClient.bind(this),
            PerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
            this.logger,
            this.performanceClient,
            this.correlationId
        )({ serverTelemetryManager, requestAuthority: currentAuthority });

        ThrottlingUtils.removeThrottle(
            this.browserStorage,
            this.config.auth.clientId,
            cachedRequest
        );
        const interactionHandler = new RedirectHandler(
            authClient,
            this.browserStorage,
            cachedRequest,
            this.logger,
            this.performanceClient
        );
        return interactionHandler.handleCodeResponse(serverParams, state);
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        this.logger.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.logout
        );

        try {
            this.eventHandler.emitEvent(
                EventType.LOGOUT_START,
                InteractionType.Redirect,
                logoutRequest
            );

            // Clear cache on logout
            await this.clearCacheOnLogout(validLogoutRequest.account);

            const navigationOptions: NavigationOptions = {
                apiId: ApiId.logout,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false,
            };

            const authClient = await invokeAsync(
                this.createAuthCodeClient.bind(this),
                PerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
                this.logger,
                this.performanceClient,
                this.correlationId
            )({
                serverTelemetryManager,
                requestAuthority: logoutRequest && logoutRequest.authority,
                requestExtraQueryParameters:
                    logoutRequest?.extraQueryParameters,
                account: (logoutRequest && logoutRequest.account) || undefined,
            });

            if (authClient.authority.protocolMode === ProtocolMode.OIDC) {
                try {
                    authClient.authority.endSessionEndpoint;
                } catch {
                    if (validLogoutRequest.account?.homeAccountId) {
                        void this.browserStorage.removeAccount(
                            validLogoutRequest.account?.homeAccountId
                        );

                        this.eventHandler.emitEvent(
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

            this.eventHandler.emitEvent(
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
                    this.logger.verbose(
                        "Logout onRedirectNavigate did not return false, navigating"
                    );
                    // Ensure interaction is in progress
                    if (!this.browserStorage.getInteractionInProgress()) {
                        this.browserStorage.setInteractionInProgress(true);
                    }
                    await this.navigationClient.navigateExternal(
                        logoutUri,
                        navigationOptions
                    );
                    return;
                } else {
                    // Ensure interaction is not in progress
                    this.browserStorage.setInteractionInProgress(false);
                    this.logger.verbose(
                        "Logout onRedirectNavigate returned false, stopping navigation"
                    );
                }
            } else {
                // Ensure interaction is in progress
                if (!this.browserStorage.getInteractionInProgress()) {
                    this.browserStorage.setInteractionInProgress(true);
                }
                await this.navigationClient.navigateExternal(
                    logoutUri,
                    navigationOptions
                );
                return;
            }
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            this.eventHandler.emitEvent(
                EventType.LOGOUT_FAILURE,
                InteractionType.Redirect,
                null,
                e as EventError
            );
            this.eventHandler.emitEvent(
                EventType.LOGOUT_END,
                InteractionType.Redirect
            );
            throw e;
        }

        this.eventHandler.emitEvent(
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
