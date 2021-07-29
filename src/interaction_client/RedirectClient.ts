/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, CommonAuthorizationCodeRequest, AuthorizationCodeClient, UrlString, AccountEntity } from "@azure/msal-common";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { version } from "../packageMetadata";
import { ApiId, InteractionType, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { BrowserUtils } from "../utils/BrowserUtils";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { EventType } from "../event/EventType";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { RedirectRequest } from "../request/RedirectRequest";

export class RedirectClient extends StandardInteractionClient {   
    /**
     * Redirects the page to the /authorize endpoint of the IDP
     * @param request 
     */
    async acquireToken(request: RedirectRequest): Promise<void> {
        const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.Redirect);
        this.logger = this.logger.clone(name, version, validRequest.correlationId);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenRedirect, validRequest.correlationId);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority, validRequest.correlationId);
            this.logger.verbose("Auth code client created");

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.browserCrypto);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            const redirectStartPage = this.getRedirectStartPage(request.redirectStartPage);
            this.logger.verbosePii(`Redirect start page: ${redirectStartPage}`);

            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            return interactionHandler.initiateAuthRequest(navigateUrl, {
                navigationClient: this.navigationClient,
                redirectTimeout: this.config.system.redirectNavigationTimeout,
                redirectStartPage: redirectStartPage,
                onRedirectNavigate: request.onRedirectNavigate
            });
        } catch (e) {
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
        if (!this.interactionInProgress()) {
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
            state = this.validateAndExtractStateFromHash(responseHash, InteractionType.Redirect);
            BrowserUtils.clearHash(window);
            this.logger.verbose("State extracted from hash");
        } catch (e) {
            this.logger.info(`handleRedirectPromise was unable to extract state due to: ${e}`);
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            return null;
        }

        // If navigateToLoginRequestUrl is true, get the url where the redirect request was initiated
        const loginRequestUrl = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, true) || "";
        const loginRequestUrlNormalized = UrlString.removeHashFromUrl(loginRequestUrl);
        const currentUrlNormalized = UrlString.removeHashFromUrl(window.location.href);

        if (loginRequestUrlNormalized === currentUrlNormalized && this.config.auth.navigateToLoginRequestUrl) {
            // We are on the page we need to navigate to - handle hash
            this.logger.verbose("Current page is loginRequestUrl, handling hash");
            const handleHashResult = await this.handleHash(responseHash, state);

            if (loginRequestUrl.indexOf("#") > -1) {
                // Replace current hash with non-msal hash, if present
                BrowserUtils.replaceHash(loginRequestUrl);
            }

            return handleHashResult;
        } else if (!this.config.auth.navigateToLoginRequestUrl) {
            this.logger.verbose("NavigateToLoginRequestUrl set to false, handling hash");
            return this.handleHash(responseHash, state);
        } else if (!BrowserUtils.isInIframe()) {
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
                return this.handleHash(responseHash, state);
            }
        }

        return null;
    }

    /**
     * Gets the response hash for a redirect request
     * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
     * @param hash
     */
    private getRedirectResponseHash(hash: string): string | null {
        this.logger.verbose("getRedirectResponseHash called");
        // Get current location hash from window or cache.
        const isResponseHash: boolean = UrlString.hashContainsKnownProperties(hash);
        const cachedHash = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.URL_HASH, true);
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));

        if (isResponseHash) {
            this.logger.verbose("Hash contains known properties, returning response hash");
            return hash;
        }

        this.logger.verbose("Hash does not contain known properties, returning cached hash");
        return cachedHash;
    }

    /**
     * Checks if hash exists and handles in window.
     * @param hash
     * @param state
     */
    private async handleHash(hash: string, state: string): Promise<AuthenticationResult> {
        const cachedRequest = this.browserStorage.getCachedRequest(state, this.browserCrypto);
        const browserRequestLogger = this.logger.clone(name, version, cachedRequest.correlationId);
        browserRequestLogger.verbose("handleHash called, retrieved cached request");
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.handleRedirectPromise, cachedRequest.correlationId);

        try {
            // Hash contains known properties - handle and return in callback
            const currentAuthority = this.browserStorage.getCachedAuthority(state);
            if (!currentAuthority) {
                throw BrowserAuthError.createNoCachedAuthorityError();
            }

            const authClient = await this.createAuthCodeClient(serverTelemetryManager, currentAuthority, cachedRequest.correlationId);
            browserRequestLogger.verbose("Auth code client created");
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage, cachedRequest, browserRequestLogger, this.browserCrypto);
            return await interactionHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient, this.config.auth.clientId);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            throw e;
        }
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        this.logger.verbose("logoutRedirect called", logoutRequest?.correlationId);
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const browserRequestLogger = this.logger.clone(name, version, validLogoutRequest.correlationId);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logout, validLogoutRequest.correlationId);

        try {
            this.eventHandler.emitEvent(EventType.LOGOUT_START, InteractionType.Redirect, logoutRequest);
            const authClient = await this.createAuthCodeClient(serverTelemetryManager, logoutRequest && logoutRequest.authority, validLogoutRequest.correlationId);
            browserRequestLogger.verbose("Auth code client created");

            // create logout string and navigate user window to logout. Auth module will clear cache.
            const logoutUri: string = authClient.getLogoutUri(validLogoutRequest);
            
            if (!validLogoutRequest.account || AccountEntity.accountInfoIsEqual(validLogoutRequest.account, this.browserStorage.getActiveAccount(), false)) {
                browserRequestLogger.verbose("Setting active account to null");
                this.browserStorage.setActiveAccount(null);
            }
            
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.logout,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false
            };
            
            this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Redirect, validLogoutRequest);
            // Check if onRedirectNavigate is implemented, and invoke it if so
            if (logoutRequest && typeof logoutRequest.onRedirectNavigate === "function") {
                const navigate = logoutRequest.onRedirectNavigate(logoutUri);

                if (navigate !== false) {
                    browserRequestLogger.verbose("Logout onRedirectNavigate did not return false, navigating");
                    await this.navigationClient.navigateExternal(logoutUri, navigationOptions);
                    return;
                } else {
                    browserRequestLogger.verbose("Logout onRedirectNavigate returned false, stopping navigation");
                }
            } else {
                await this.navigationClient.navigateExternal(logoutUri, navigationOptions);
                return;
            }
        } catch(e) {
            serverTelemetryManager.cacheFailedRequest(e);
            this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Redirect, null, e);
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
