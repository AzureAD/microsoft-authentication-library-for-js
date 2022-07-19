/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, CommonAuthorizationCodeRequest, AuthorizationCodeClient, UrlString, AuthError, ServerTelemetryManager, Constants, ProtocolUtils, ServerAuthorizationCodeResponse, ThrottlingUtils, ICrypto, Logger, IPerformanceClient } from "@azure/msal-common";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { ApiId, InteractionType, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { BrowserUtils } from "../utils/BrowserUtils";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { EventType } from "../event/EventType";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { RedirectRequest } from "../request/RedirectRequest";
import { NativeInteractionClient } from "./NativeInteractionClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { INavigationClient } from "../navigation/INavigationClient";

export class RedirectClient extends StandardInteractionClient {
    protected nativeStorage: BrowserCacheManager;

    constructor(config: BrowserConfiguration, storageImpl: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, performanceClient: IPerformanceClient, nativeStorageImpl: BrowserCacheManager, nativeMessageHandler?: NativeMessageHandler, correlationId?: string) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        this.nativeStorage = nativeStorageImpl;
    }

    /**
     * Redirects the page to the /authorize endpoint of the IDP
     * @param request
     */
    async acquireToken(request: RedirectRequest): Promise<void> {
        const validRequest = await this.initializeAuthorizationRequest(request, InteractionType.Redirect);
        this.browserStorage.updateCacheEntries(validRequest.state, validRequest.nonce, validRequest.authority, validRequest.loginHint || Constants.EMPTY_STRING, validRequest.account || null);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenRedirect);

        const handleBackButton = (event: PageTransitionEvent) => {
            // Clear temporary cache if the back button is clicked during the redirect flow.
            if (event.persisted) {
                this.logger.verbose("Page was restored from back/forward cache. Clearing temporary cache.");
                this.browserStorage.cleanRequestByState(validRequest.state);
            }
        };

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority, validRequest.azureCloudOptions);
            this.logger.verbose("Auth code client created");

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.browserCrypto);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl({
                ...validRequest,
                nativeBroker: NativeMessageHandler.isNativeAvailable(this.config, this.logger, this.nativeMessageHandler, request.authenticationScheme)
            });

            const redirectStartPage = this.getRedirectStartPage(request.redirectStartPage);
            this.logger.verbosePii(`Redirect start page: ${redirectStartPage}`);

            // Clear temporary cache if the back button is clicked during the redirect flow.
            window.addEventListener("pageshow", handleBackButton);

            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            return await interactionHandler.initiateAuthRequest(navigateUrl, {
                navigationClient: this.navigationClient,
                redirectTimeout: this.config.system.redirectNavigationTimeout,
                redirectStartPage: redirectStartPage,
                onRedirectNavigate: request.onRedirectNavigate
            });
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
            }
            window.removeEventListener("pageshow", handleBackButton);
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(validRequest.state);
            throw e;
        }
    }

    /**
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate
     * - if false, handles hash string and parses response
     * @param hash
     */
    async handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null> {
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.handleRedirectPromise);
        try {
            if (!this.browserStorage.isInteractionInProgress(true)) {
                this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
                return null;
            }

            const responseHash = this.getRedirectResponseHash(hash || window.location.hash);
            if (!responseHash) {
                // Not a recognized server response hash or hash not associated with a redirect request
                this.logger.info("handleRedirectPromise did not detect a response hash as a result of a redirect. Cleaning temporary cache.");
                this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
                return null;
            }

            let state: string;
            try {
                // Deserialize hash fragment response parameters.
                const serverParams: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(responseHash);
                state = this.validateAndExtractStateFromHash(serverParams, InteractionType.Redirect);
                this.logger.verbose("State extracted from hash");
            } catch (e) {
                this.logger.info(`handleRedirectPromise was unable to extract state due to: ${e}`);
                this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
                return null;
            }

            // If navigateToLoginRequestUrl is true, get the url where the redirect request was initiated
            const loginRequestUrl = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, true) || Constants.EMPTY_STRING;
            const loginRequestUrlNormalized = UrlString.removeHashFromUrl(loginRequestUrl);
            const currentUrlNormalized = UrlString.removeHashFromUrl(window.location.href);

            if (loginRequestUrlNormalized === currentUrlNormalized && this.config.auth.navigateToLoginRequestUrl) {
                // We are on the page we need to navigate to - handle hash
                this.logger.verbose("Current page is loginRequestUrl, handling hash");
                const handleHashResult = await this.handleHash(responseHash, state, serverTelemetryManager);

                if (loginRequestUrl.indexOf("#") > -1) {
                    // Replace current hash with non-msal hash, if present
                    BrowserUtils.replaceHash(loginRequestUrl);
                }

                return handleHashResult;
            } else if (!this.config.auth.navigateToLoginRequestUrl) {
                this.logger.verbose("NavigateToLoginRequestUrl set to false, handling hash");
                return this.handleHash(responseHash, state, serverTelemetryManager);
            } else if (!BrowserUtils.isInIframe() || this.config.system.allowRedirectInIframe) {
                /*
                 * Returned from authority using redirect - need to perform navigation before processing response
                 * Cache the hash to be retrieved after the next redirect
                 */
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.URL_HASH, responseHash, true);
                const navigationOptions: NavigationOptions = {
                    apiId: ApiId.handleRedirectPromise,
                    timeout: this.config.system.redirectNavigationTimeout,
                    noHistory: true
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
                    this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, homepage, true);
                    this.logger.warning("Unable to get valid login request url from cache, redirecting to home page");
                    processHashOnRedirect = await this.navigationClient.navigateInternal(homepage, navigationOptions);
                } else {
                    // Navigate to page that initiated the redirect request
                    this.logger.verbose(`Navigating to loginRequestUrl: ${loginRequestUrl}`);
                    processHashOnRedirect = await this.navigationClient.navigateInternal(loginRequestUrl, navigationOptions);
                }

                // If navigateInternal implementation returns false, handle the hash now
                if (!processHashOnRedirect) {
                    return this.handleHash(responseHash, state, serverTelemetryManager);
                }
            }

            return null;
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            throw e;
        }
    }

    /**
     * Gets the response hash for a redirect request
     * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
     * @param hash
     */
    protected getRedirectResponseHash(hash: string): string | null {
        this.logger.verbose("getRedirectResponseHash called");
        // Get current location hash from window or cache.
        const isResponseHash: boolean = UrlString.hashContainsKnownProperties(hash);

        if (isResponseHash) {
            BrowserUtils.clearHash(window);
            this.logger.verbose("Hash contains known properties, returning response hash");
            return hash;
        }

        const cachedHash = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.URL_HASH, true);
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));

        this.logger.verbose("Hash does not contain known properties, returning cached hash");
        return cachedHash;
    }

    /**
     * Checks if hash exists and handles in window.
     * @param hash
     * @param state
     */
    protected async handleHash(hash: string, state: string, serverTelemetryManager: ServerTelemetryManager): Promise<AuthenticationResult> {
        const cachedRequest = this.browserStorage.getCachedRequest(state, this.browserCrypto);
        this.logger.verbose("handleHash called, retrieved cached request");

        const serverParams: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(hash);

        if (serverParams.accountId) {
            this.logger.verbose("Account id found in hash, calling WAM for token");
            if (!this.nativeMessageHandler) {
                throw BrowserAuthError.createNativeConnectionNotEstablishedError();
            }
            const nativeInteractionClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenPopup, this.performanceClient, this.nativeMessageHandler, serverParams.accountId, this.browserStorage, cachedRequest.correlationId);
            const { userRequestState } = ProtocolUtils.parseRequestState(this.browserCrypto, state);
            return nativeInteractionClient.acquireToken({
                ...cachedRequest,
                state: userRequestState,
                prompt: undefined // Server should handle the prompt, ideally native broker can do this part silently
            }).finally(() => {
                this.browserStorage.cleanRequestByState(state);
            });
        }

        // Hash contains known properties - handle and return in callback
        const currentAuthority = this.browserStorage.getCachedAuthority(state);
        if (!currentAuthority) {
            throw BrowserAuthError.createNoCachedAuthorityError();
        }

        const authClient = await this.createAuthCodeClient(serverTelemetryManager, currentAuthority);
        this.logger.verbose("Auth code client created");
        ThrottlingUtils.removeThrottle(this.browserStorage, this.config.auth.clientId, cachedRequest);
        const interactionHandler = new RedirectHandler(authClient, this.browserStorage, cachedRequest, this.logger, this.browserCrypto);
        return await interactionHandler.handleCodeResponseFromHash(hash, state, authClient.authority, this.networkClient);
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        this.logger.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logout);

        try {
            this.eventHandler.emitEvent(EventType.LOGOUT_START, InteractionType.Redirect, logoutRequest);

            // Clear cache on logout
            await this.clearCacheOnLogout(validLogoutRequest.account);

            const navigationOptions: NavigationOptions = {
                apiId: ApiId.logout,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false
            };
            const authClient = await this.createAuthCodeClient(serverTelemetryManager, logoutRequest && logoutRequest.authority);
            this.logger.verbose("Auth code client created");

            // Create logout string and navigate user window to logout.
            const logoutUri: string = authClient.getLogoutUri(validLogoutRequest);

            this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Redirect, validLogoutRequest);
            // Check if onRedirectNavigate is implemented, and invoke it if so
            if (logoutRequest && typeof logoutRequest.onRedirectNavigate === "function") {
                const navigate = logoutRequest.onRedirectNavigate(logoutUri);

                if (navigate !== false) {
                    this.logger.verbose("Logout onRedirectNavigate did not return false, navigating");
                    // Ensure interaction is in progress
                    if (!this.browserStorage.getInteractionInProgress()) {
                        this.browserStorage.setInteractionInProgress(true);
                    }
                    await this.navigationClient.navigateExternal(logoutUri, navigationOptions);
                    return;
                } else {
                    // Ensure interaction is not in progress
                    this.browserStorage.setInteractionInProgress(false);
                    this.logger.verbose("Logout onRedirectNavigate returned false, stopping navigation");
                }
            } else {
                // Ensure interaction is in progress
                if (!this.browserStorage.getInteractionInProgress()) {
                    this.browserStorage.setInteractionInProgress(true);
                }
                await this.navigationClient.navigateExternal(logoutUri, navigationOptions);
                return;
            }
        } catch(e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Redirect, null, e);
            this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Redirect);
            throw e;
        }

        this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Redirect);
    }

    /**
     * Use to get the redirectStartPage either from request or use current window
     * @param requestStartPage
     */
    protected getRedirectStartPage(requestStartPage?: string): string {
        const redirectStartPage = requestStartPage || window.location.href;
        return UrlString.getAbsoluteUrl(redirectStartPage, BrowserUtils.getCurrentUri());
    }
}
