/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient, StringUtils, AuthorizationCodeRequest, ICrypto, AuthenticationResult, ThrottlingUtils, Authority, INetworkModule } from "@azure/msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { InteractionHandler, InteractionParams } from "./InteractionHandler";

export type RedirectParams = InteractionParams & {
    redirectTimeout: number;
    redirectStartPage: string;
};

export class RedirectHandler extends InteractionHandler {

    private browserCrypto: ICrypto;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, browserCrypto: ICrypto) {
        super(authCodeModule, storageImpl);
        this.browserCrypto = browserCrypto;
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    initiateAuthRequest(requestUrl: string, authCodeRequest: AuthorizationCodeRequest, params: RedirectParams): Promise<void> {
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
            if (params.redirectStartPage) {
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, params.redirectStartPage, true);
            }

            // Set interaction status in the library.
            this.browserStorage.setTemporaryCache(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            this.browserStorage.cacheCodeRequest(authCodeRequest, this.browserCrypto);
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            
            // Navigate window to request URL
            return BrowserUtils.navigateWindow(requestUrl, params.redirectTimeout, this.authModule.logger);
        } else {
            // Throw error if request URL is empty.
            this.authModule.logger.info("Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }
    }

    /**
     * Handle authorization code response in the window.
     * @param hash
     */
    async handleCodeResponse(locationHash: string, authority: Authority, networkModule: INetworkModule, clientId?: string): Promise<AuthenticationResult> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY));

        // Deserialize hash fragment response parameters.
        const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(locationHash);

        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(serverParams.state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        const authCodeResponse = this.authModule.handleFragmentResponse(locationHash, requestState);

        // Get cached items
        const nonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);
        this.authCodeRequest = this.browserStorage.getCachedRequest(requestState, this.browserCrypto);
        
        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;

        // Check for new cloud instance
        if (authCodeResponse.cloud_instance_host_name) {
            await this.updateTokenEndpointAuthority(authCodeResponse.cloud_instance_host_name, authority, networkModule);
        }

        authCodeResponse.nonce = cachedNonce;
        authCodeResponse.state = requestState;

        // Remove throttle if it exists
        if (clientId) {
            ThrottlingUtils.removeThrottle(this.browserStorage, clientId, this.authCodeRequest.authority, this.authCodeRequest.scopes);
        }
        
        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, authCodeResponse);

        this.browserStorage.cleanRequest(serverParams.state);
        return tokenResponse;
    }
}
