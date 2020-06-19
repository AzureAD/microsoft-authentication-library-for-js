/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils, AuthorizationCodeRequest, CacheSchemaType, AuthenticationResult, AuthorizationCodeClient, AuthorizationCodePayload, AuthorityFactory, INetworkModule } from "@azure/msal-common";
import { BrowserStorage } from "../cache/BrowserStorage";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { TemporaryCacheKeys } from "../utils/BrowserConstants";

/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export abstract class InteractionHandler {

    protected authModule: AuthorizationCodeClient;
    protected browserStorage: BrowserStorage;
    protected authCodeRequest: AuthorizationCodeRequest;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserStorage) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
    }

    /**
     * Function to enable user interaction.
     * @param requestUrl
     */
    abstract initiateAuthRequest(requestUrl: string, authCodeRequest: AuthorizationCodeRequest): Window | Promise<HTMLIFrameElement>;

    /**
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    async handleCodeResponse(locationHash: string, networkModule: INetworkModule): Promise<AuthenticationResult> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Get cached items
        const requestState = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_STATE), CacheSchemaType.TEMPORARY) as string;
        const cachedNonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getItem(this.browserStorage.generateCacheKey(cachedNonceKey), CacheSchemaType.TEMPORARY) as string;

        // Handle code response.
        const authCodeResponse: AuthorizationCodePayload = this.authModule.handleFragmentResponse(locationHash, requestState);

        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;
        if (authCodeResponse.cloud_graph_host_name) {
            const cloudInstanceAuthorityUri = `https://${authCodeResponse.cloud_instance_host_name}/common/`;
            if (cloudInstanceAuthorityUri !== this.browserStorage.getCachedAuthority()) {
                const cloudInstanceAuthority = await AuthorityFactory.createDiscoveredInstance(this.authCodeRequest.authority, networkModule, true);
                this.authModule.updateAuthority(cloudInstanceAuthority);
            }
        }

        authCodeResponse.nonce = cachedNonce;
        authCodeResponse.state = requestState;

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, authCodeResponse);
        this.browserStorage.cleanRequest();
        return tokenResponse;
    }
}
