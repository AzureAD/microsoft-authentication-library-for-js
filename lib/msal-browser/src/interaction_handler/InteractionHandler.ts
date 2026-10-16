/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodePayload,
    CommonAuthorizationCodeRequest,
    AuthorizationCodeClient,
    CcsCredential,
    Logger,
    ServerError,
    IPerformanceClient,
    PerformanceEvents,
    invokeAsync,
    CcsCredentialType,
    AuthorizeResponse,
    AuthorizeProtocol,
    CommonAuthorizationUrlRequest,
} from "@azure/msal-common/browser";
import { ApiId } from "../utils/BrowserConstants.js";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { AuthorizationCodeRedemptionContinuation } from "../app/IPublicClientApplication.js";

/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export class InteractionHandler {
    protected authModule: AuthorizationCodeClient;
    protected browserStorage: BrowserCacheManager;
    protected authCodeRequest: CommonAuthorizationCodeRequest;
    protected logger: Logger;
    protected performanceClient: IPerformanceClient;

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
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    async handleCodeResponse(
        response: AuthorizeResponse,
        request: CommonAuthorizationUrlRequest,
        apiId: ApiId
    ): Promise<AuthenticationResult> {
        let authCodeResponse;
        try {
            authCodeResponse = AuthorizeProtocol.getAuthorizationCodePayload(
                response,
                request.state,
                request.correlationId
            );
        } catch (e) {
            if (
                e instanceof ServerError &&
                e.subError === BrowserAuthErrorCodes.userCancelled
            ) {
                // Translate server error caused by user closing native prompt to corresponding first class MSAL error
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.userCancelled,
                    request.correlationId
                );
            } else {
                throw e;
            }
        }

        return invokeAsync(
            this.handleCodeResponseFromServer.bind(this),
            PerformanceEvents.HandleCodeResponseFromServer,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(authCodeResponse, request, apiId);
    }

    /**
     * Process auth code response from AAD
     * @param authCodeResponse
     * @param request
     * @param validateNonce
     * @returns
     */
    async handleCodeResponseFromServer(
        authCodeResponse: AuthorizationCodePayload,
        request: CommonAuthorizationUrlRequest,
        apiId: ApiId,
        validateNonce: boolean = true
    ): Promise<AuthenticationResult> {
        this.prepareCodeRequest(authCodeResponse, request, validateNonce);

        // Acquire token with retrieved code.
        const tokenResponse = (await invokeAsync(
            this.authModule.acquireToken.bind(this.authModule),
            BrowserPerformanceEvents.AuthClientAcquireToken,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(
            this.authCodeRequest,
            apiId,
            authCodeResponse
        )) as AuthenticationResult;
        return tokenResponse;
    }

    /**
     * Prepares authorization-code redemption and pauses after the final token
     * endpoint has been selected.
     * @internal
     */
    async prepareCodeRedemptionFromServer(
        authCodeResponse: AuthorizationCodePayload,
        request: CommonAuthorizationUrlRequest,
        apiId: ApiId,
        validateNonce: boolean = true
    ): Promise<AuthorizationCodeRedemptionContinuation> {
        this.prepareCodeRequest(authCodeResponse, request, validateNonce);
        const tokenEndpoint = await this.authModule.prepareTokenRequest(
            this.authCodeRequest,
            authCodeResponse
        );
        let redeemed = false;

        return {
            tokenEndpoint,
            redeem: async (
                dpopProof: string
            ): Promise<AuthenticationResult> => {
                if (redeemed) {
                    throw createBrowserAuthError(
                        BrowserAuthErrorCodes.authCodeRedemptionContinuationAlreadyUsed,
                        request.correlationId
                    );
                }
                if (!dpopProof.trim()) {
                    throw createBrowserAuthError(
                        BrowserAuthErrorCodes.dpopProofRequired,
                        request.correlationId
                    );
                }

                redeemed = true;
                this.authCodeRequest.dpopProof = dpopProof;
                return (await invokeAsync(
                    this.authModule.acquireTokenWithPreparedAuthority.bind(
                        this.authModule
                    ),
                    BrowserPerformanceEvents.AuthClientAcquireToken,
                    this.logger,
                    this.performanceClient,
                    request.correlationId
                )(
                    this.authCodeRequest,
                    apiId,
                    authCodeResponse
                )) as AuthenticationResult;
            },
        };
    }

    private prepareCodeRequest(
        authCodeResponse: AuthorizationCodePayload,
        request: CommonAuthorizationUrlRequest,
        validateNonce: boolean
    ): void {
        this.logger.trace(
            "InteractionHandler.handleCodeResponseFromServer called",
            request.correlationId
        );

        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;

        // Nonce validation not needed when redirect not involved (e.g. hybrid spa, renewing token via rt)
        if (validateNonce) {
            // TODO: Assigning "response nonce" to "request nonce" is confusing. Refactor the function doing validation to accept request nonce directly
            authCodeResponse.nonce = request.nonce || undefined;
        }

        authCodeResponse.state = request.state;

        // Add CCS parameters if available
        if (authCodeResponse.client_info) {
            this.authCodeRequest.clientInfo = authCodeResponse.client_info;
        } else {
            const ccsCred = this.createCcsCredentials(request);
            if (ccsCred) {
                this.authCodeRequest.ccsCredential = ccsCred;
            }
        }
    }

    /**
     * Build ccs creds if available
     */
    protected createCcsCredentials(
        request: CommonAuthorizationUrlRequest
    ): CcsCredential | null {
        if (request.account) {
            return {
                credential: request.account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID,
            };
        } else if (request.loginHint) {
            return {
                credential: request.loginHint,
                type: CcsCredentialType.UPN,
            };
        }

        return null;
    }
}
