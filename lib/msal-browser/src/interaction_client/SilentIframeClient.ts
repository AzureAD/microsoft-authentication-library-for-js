/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    Logger,
    Constants,
    AuthorizationCodeClient,
    AuthError,
    IPerformanceClient,
    PerformanceEvents,
    invokeAsync,
    invoke,
    ProtocolMode,
    CommonAuthorizationUrlRequest,
} from "@azure/msal-common/browser";
import {
    initializeAuthorizationRequest,
    StandardInteractionClient,
} from "./StandardInteractionClient.js";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { EventHandler } from "../event/EventHandler.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import {
    InteractionType,
    ApiId,
    BrowserConstants,
} from "../utils/BrowserConstants.js";
import {
    initiateCodeRequest,
    initiateEarRequest,
    monitorIframeForHash,
} from "../interaction_handler/SilentHandler.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import * as ResponseHandler from "../response/ResponseHandler.js";
import * as Authorize from "../protocol/Authorize.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
import { isPlatformAuthAllowed } from "../broker/nativeBroker/PlatformAuthProvider.js";
import { generateEarKey } from "../crypto/BrowserCrypto.js";
import { IPlatformAuthHandler } from "../broker/nativeBroker/IPlatformAuthHandler.js";
import {
    getDiscoveredAuthority,
    initializeServerTelemetryManager,
} from "./BaseInteractionClient.js";

export class SilentIframeClient extends StandardInteractionClient {
    protected aid: ApiId; // apiId
    protected ns: BrowserCacheManager; // nativeStorage

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        apiId: ApiId,
        performanceClient: IPerformanceClient,
        nativeStorageImpl: BrowserCacheManager,
        platformAuthProvider?: IPlatformAuthHandler,
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
            platformAuthProvider,
            correlationId
        );
        this.aid = apiId;
        this.ns = nativeStorageImpl;
    }

    /**
     * Acquires a token silently by opening a hidden iframe to the /authorize endpoint with prompt=none or prompt=no_session
     * @param request
     */
    async acquireToken(
        request: SsoSilentRequest
    ): Promise<AuthenticationResult> {
        // Check that we have some SSO data
        if (
            !request.loginHint &&
            !request.sid &&
            (!request.account || !request.account.username)
        ) {
            this.l.warning(
                "No user hint provided. The authorization server may need more information to complete this request."
            );
        }

        // Check the prompt value
        const inputRequest = { ...request };
        if (inputRequest.prompt) {
            if (
                inputRequest.prompt !== Constants.PromptValue.NONE &&
                inputRequest.prompt !== Constants.PromptValue.NO_SESSION
            ) {
                this.l.warning(
                    `SilentIframeClient. Replacing invalid prompt ${inputRequest.prompt} with ${Constants.PromptValue.NONE}`
                );
                inputRequest.prompt = Constants.PromptValue.NONE;
            }
        } else {
            inputRequest.prompt = Constants.PromptValue.NONE;
        }

        // Create silent request
        const silentRequest: CommonAuthorizationUrlRequest = await invokeAsync(
            initializeAuthorizationRequest,
            BrowserPerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest,
            this.l,
            this.pc,
            request.correlationId
        )(
            inputRequest,
            InteractionType.Silent,
            this.cfg,
            this.bc,
            this.bs,
            this.l,
            this.pc,
            this.cId
        );
        silentRequest.platformBroker = isPlatformAuthAllowed(
            this.cfg,
            this.l,
            this.pap,
            silentRequest.authenticationScheme
        );
        BrowserUtils.preconnect(silentRequest.authority);

        if (this.cfg.system.protocolMode === ProtocolMode.EAR) {
            return this.executeEarFlow(silentRequest);
        } else {
            return this.executeCodeFlow(silentRequest);
        }
    }

    /**
     * Executes auth code + PKCE flow
     * @param request
     * @returns
     */
    async executeCodeFlow(
        request: CommonAuthorizationUrlRequest
    ): Promise<AuthenticationResult> {
        let authClient: AuthorizationCodeClient | undefined;
        const serverTelemetryManager = initializeServerTelemetryManager(
            this.aid,
            this.cfg.auth.clientId,
            this.cId,
            this.bs,
            this.l
        );

        try {
            // Initialize the client
            authClient = await invokeAsync(
                this.createAuthCodeClient.bind(this),
                BrowserPerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
                this.l,
                this.pc,
                request.correlationId
            )({
                serverTelemetryManager,
                requestAuthority: request.authority,
                requestAzureCloudOptions: request.azureCloudOptions,
                requestExtraQueryParameters: request.extraQueryParameters,
                account: request.account,
            });

            return await invokeAsync(
                this.silentTokenHelper.bind(this),
                BrowserPerformanceEvents.SilentIframeClientTokenHelper,
                this.l,
                this.pc,
                request.correlationId
            )(authClient, request);
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.cId);
                serverTelemetryManager.cacheFailedRequest(e);
            }

            if (
                !authClient ||
                !(e instanceof AuthError) ||
                e.errorCode !== BrowserConstants.INVALID_GRANT_ERROR
            ) {
                throw e;
            }

            this.pc.addFields(
                {
                    retryError: e.errorCode,
                },
                this.cId
            );

            return await invokeAsync(
                this.silentTokenHelper.bind(this),
                BrowserPerformanceEvents.SilentIframeClientTokenHelper,
                this.l,
                this.pc,
                this.cId
            )(authClient, request);
        }
    }

    /**
     * Executes EAR flow
     * @param request
     */
    async executeEarFlow(
        request: CommonAuthorizationUrlRequest
    ): Promise<AuthenticationResult> {
        const {
            correlationId,
            authority,
            azureCloudOptions,
            extraQueryParameters,
            account,
        } = request;
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
        const silentRequest = {
            ...request,
            earJwk: earJwk,
        };
        const msalFrame = await invokeAsync(
            initiateEarRequest,
            BrowserPerformanceEvents.SilentHandlerInitiateAuthRequest,
            this.l,
            this.pc,
            correlationId
        )(
            this.cfg,
            discoveredAuthority,
            silentRequest,
            this.l,
            this.pc
        );

        const responseType = this.cfg.auth.OIDCOptions.responseMode;
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const responseString = await invokeAsync(
            monitorIframeForHash,
            BrowserPerformanceEvents.SilentHandlerMonitorIframeForHash,
            this.l,
            this.pc,
            correlationId
        )(
            msalFrame,
            this.cfg.system.iframeHashTimeout,
            this.cfg.system.pollIntervalMilliseconds,
            this.pc,
            this.l,
            correlationId,
            responseType
        );

        const serverParams = invoke(
            ResponseHandler.deserializeResponse,
            BrowserPerformanceEvents.DeserializeResponse,
            this.l,
            this.pc,
            correlationId
        )(responseString, responseType, this.l);

        return invokeAsync(
            Authorize.handleResponseEAR,
            BrowserPerformanceEvents.HandleResponseEar,
            this.l,
            this.pc,
            correlationId
        )(
            silentRequest,
            serverParams,
            this.aid,
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

    /**
     * Currently Unsupported
     */
    logout(): Promise<void> {
        // Synchronous so we must reject
        return Promise.reject(
            createBrowserAuthError(
                BrowserAuthErrorCodes.silentLogoutUnsupported
            )
        );
    }

    /**
     * Helper which acquires an authorization code silently using a hidden iframe from given url
     * using the scopes requested as part of the id, and exchanges the code for a set of OAuth tokens.
     * @param navigateUrl
     * @param userRequestScopes
     */
    protected async silentTokenHelper(
        authClient: AuthorizationCodeClient,
        request: CommonAuthorizationUrlRequest
    ): Promise<AuthenticationResult> {
        const correlationId = request.correlationId;
        const pkceCodes = await invokeAsync(
            generatePkceCodes,
            BrowserPerformanceEvents.GeneratePkceCodes,
            this.l,
            this.pc,
            correlationId
        )(this.pc, this.l, correlationId);

        const silentRequest = {
            ...request,
            codeChallenge: pkceCodes.challenge,
        };
        // Create authorize request url
        const navigateUrl = await invokeAsync(
            Authorize.getAuthCodeRequestUrl,
            PerformanceEvents.GetAuthCodeUrl,
            this.l,
            this.pc,
            correlationId
        )(
            this.cfg,
            authClient.auth,
            silentRequest,
            this.l,
            this.pc
        );

        // Get the frame handle for the silent request
        const msalFrame = await invokeAsync(
            initiateCodeRequest,
            BrowserPerformanceEvents.SilentHandlerInitiateAuthRequest,
            this.l,
            this.pc,
            correlationId
        )(navigateUrl, this.pc, this.l, correlationId);

        const responseType = this.cfg.auth.OIDCOptions.responseMode;
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const responseString = await invokeAsync(
            monitorIframeForHash,
            BrowserPerformanceEvents.SilentHandlerMonitorIframeForHash,
            this.l,
            this.pc,
            correlationId
        )(
            msalFrame,
            this.cfg.system.iframeHashTimeout,
            this.cfg.system.pollIntervalMilliseconds,
            this.pc,
            this.l,
            correlationId,
            responseType
        );
        const serverParams = invoke(
            ResponseHandler.deserializeResponse,
            BrowserPerformanceEvents.DeserializeResponse,
            this.l,
            this.pc,
            correlationId
        )(responseString, responseType, this.l);

        return invokeAsync(
            Authorize.handleResponseCode,
            BrowserPerformanceEvents.HandleResponseCode,
            this.l,
            this.pc,
            correlationId
        )(
            request,
            serverParams,
            pkceCodes.verifier,
            this.aid,
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
}
