/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    CommonAuthorizationCodeRequest,
    Logger,
    ServerError,
    IPerformanceClient,
    createClientAuthError,
    ClientAuthErrorCodes,
    CcsCredential,
    invokeAsync,
    PerformanceEvents,
    ServerAuthorizationCodeResponse,
} from "@azure/msal-common";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { ApiId, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { INavigationClient } from "../navigation/INavigationClient";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { AuthenticationResult } from "../response/AuthenticationResult";

export type RedirectParams = {
    navigationClient: INavigationClient;
    redirectTimeout: number;
    redirectStartPage: string;
    onRedirectNavigate?: (url: string) => void | boolean;
};

export class RedirectHandler {
    authModule: AuthorizationCodeClient;
    browserStorage: BrowserCacheManager;
    authCodeRequest: CommonAuthorizationCodeRequest;
    logger: Logger;
    performanceClient: IPerformanceClient;

    constructor(
        authCodeModule: AuthorizationCodeClient,
        storageImpl: BrowserCacheManager,
        authCodeRequest: CommonAuthorizationCodeRequest,
        logger: Logger,
        performanceClient: IPerformanceClient
    ) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
        this.authCodeRequest = authCodeRequest;
        this.logger = logger;
        this.performanceClient = performanceClient;
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    async initiateAuthRequest(
        requestUrl: string,
        params: RedirectParams
    ): Promise<void> {
        this.logger.verbose("RedirectHandler.initiateAuthRequest called");
        // Navigate if valid URL
        if (requestUrl) {
            // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
            if (params.redirectStartPage) {
                this.logger.verbose(
                    "RedirectHandler.initiateAuthRequest: redirectStartPage set, caching start page"
                );
                this.browserStorage.setTemporaryCache(
                    TemporaryCacheKeys.ORIGIN_URI,
                    params.redirectStartPage,
                    true
                );
            }

            // Set interaction status in the library.
            this.browserStorage.setTemporaryCache(
                TemporaryCacheKeys.CORRELATION_ID,
                this.authCodeRequest.correlationId,
                true
            );
            this.browserStorage.cacheCodeRequest(this.authCodeRequest);
            this.logger.infoPii(
                `RedirectHandler.initiateAuthRequest: Navigate to: ${requestUrl}`
            );
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.acquireTokenRedirect,
                timeout: params.redirectTimeout,
                noHistory: false,
            };

            // If onRedirectNavigate is implemented, invoke it and provide requestUrl
            if (typeof params.onRedirectNavigate === "function") {
                this.logger.verbose(
                    "RedirectHandler.initiateAuthRequest: Invoking onRedirectNavigate callback"
                );
                const navigate = params.onRedirectNavigate(requestUrl);

                // Returning false from onRedirectNavigate will stop navigation
                if (navigate !== false) {
                    this.logger.verbose(
                        "RedirectHandler.initiateAuthRequest: onRedirectNavigate did not return false, navigating"
                    );
                    await params.navigationClient.navigateExternal(
                        requestUrl,
                        navigationOptions
                    );
                    return;
                } else {
                    this.logger.verbose(
                        "RedirectHandler.initiateAuthRequest: onRedirectNavigate returned false, stopping navigation"
                    );
                    return;
                }
            } else {
                // Navigate window to request URL
                this.logger.verbose(
                    "RedirectHandler.initiateAuthRequest: Navigating window to navigate url"
                );
                await params.navigationClient.navigateExternal(
                    requestUrl,
                    navigationOptions
                );
                return;
            }
        } else {
            // Throw error if request URL is empty.
            this.logger.info(
                "RedirectHandler.initiateAuthRequest: Navigate url is empty"
            );
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.emptyNavigateUri
            );
        }
    }

    /**
     * Handle authorization code response in the window.
     * @param hash
     */
    async handleCodeResponse(
        response: ServerAuthorizationCodeResponse,
        state: string
    ): Promise<AuthenticationResult> {
        this.logger.verbose("RedirectHandler.handleCodeResponse called");

        // Interaction is completed - remove interaction status.
        this.browserStorage.setInteractionInProgress(false);

        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        if (!requestState) {
            throw createClientAuthError(
                ClientAuthErrorCodes.stateNotFound,
                "Cached State"
            );
        }

        let authCodeResponse;
        try {
            authCodeResponse = this.authModule.handleFragmentResponse(
                response,
                requestState
            );
        } catch (e) {
            if (
                e instanceof ServerError &&
                e.subError === BrowserAuthErrorCodes.userCancelled
            ) {
                // Translate server error caused by user closing native prompt to corresponding first class MSAL error
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.userCancelled
                );
            } else {
                throw e;
            }
        }

        // Get cached items
        const nonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);

        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;

        // Check for new cloud instance
        if (authCodeResponse.cloud_instance_host_name) {
            await invokeAsync(
                this.authModule.updateAuthority.bind(this.authModule),
                PerformanceEvents.UpdateTokenEndpointAuthority,
                this.logger,
                this.performanceClient,
                this.authCodeRequest.correlationId
            )(
                authCodeResponse.cloud_instance_host_name,
                this.authCodeRequest.correlationId
            );
        }

        authCodeResponse.nonce = cachedNonce || undefined;
        authCodeResponse.state = requestState;

        // Add CCS parameters if available
        if (authCodeResponse.client_info) {
            this.authCodeRequest.clientInfo = authCodeResponse.client_info;
        } else {
            const cachedCcsCred = this.checkCcsCredentials();
            if (cachedCcsCred) {
                this.authCodeRequest.ccsCredential = cachedCcsCred;
            }
        }

        // Acquire token with retrieved code.
        const tokenResponse = (await this.authModule.acquireToken(
            this.authCodeRequest,
            authCodeResponse
        )) as AuthenticationResult;

        this.browserStorage.cleanRequestByState(state);
        return tokenResponse;
    }

    /**
     * Looks up ccs creds in the cache
     */
    protected checkCcsCredentials(): CcsCredential | null {
        // Look up ccs credential in temp cache
        const cachedCcsCred = this.browserStorage.getTemporaryCache(
            TemporaryCacheKeys.CCS_CREDENTIAL,
            true
        );
        if (cachedCcsCred) {
            try {
                return JSON.parse(cachedCcsCred) as CcsCredential;
            } catch (e) {
                this.authModule.logger.error(
                    "Cache credential could not be parsed"
                );
                this.authModule.logger.errorPii(
                    `Cache credential could not be parsed: ${cachedCcsCred}`
                );
            }
        }
        return null;
    }
}
