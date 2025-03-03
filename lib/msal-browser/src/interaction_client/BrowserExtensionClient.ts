/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationCodeRequest,
    AuthorizationCodeClient,
    ThrottlingUtils,
    AuthError,
    ProtocolUtils,
    PerformanceEvents,
    IPerformanceClient,
    Logger,
    ICrypto,
    invokeAsync,
    invoke,
    PkceCodes,
} from "@azure/msal-common/browser";
import { StandardInteractionClient } from "./StandardInteractionClient.js";
import {
    InteractionType,
    ApiId,
} from "../utils/BrowserConstants.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { NativeInteractionClient } from "./NativeInteractionClient.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { EventHandler } from "../event/EventHandler.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { InteractionHandler } from "../interaction_handler/InteractionHandler.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import * as ResponseHandler from "../response/ResponseHandler.js";

export class BrowserExtensionClient extends StandardInteractionClient {
    private currentWindow: Window | undefined;
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
        // Properly sets this reference for the unload event.
        this.unloadWindow = this.unloadWindow.bind(this);
        this.nativeStorage = nativeStorageImpl;
    }

    /**
     * Acquires tokens by opening a popup window to the /authorize endpoint of the authority
     * @param request
     * @param pkceCodes
     */
    acquireToken(
        request: PopupRequest,
        pkceCodes?: PkceCodes
    ): Promise<AuthenticationResult> {
        try {
            const chromeIdentity = (window.chrome || (window as any)['browser']).identity;
            if (chromeIdentity) {
                this.logger.verbose("chrome.identity API is available, acquiring token using Manifest V3 Webflow");
                return this.acquireTokenExtensionAsync(
                    request,
                    pkceCodes,
                )

            }
            return Promise.reject("chrome.identity API is not available");
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest
     */
    logout(): Promise<void> {
        return Promise.reject("API not implemented");
    }

    /**
     * Helper which obtains an access_token for your API via opening a popup window in the user's browser
     * @param request
     * @param pkceCodes
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    protected async acquireTokenExtensionAsync(
        request: PopupRequest,
        pkceCodes?: PkceCodes,
    ): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenExtensionAsync called");
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.acquireTokenPopup
        );

        const validRequest = await invokeAsync(
            this.initializeAuthorizationRequest.bind(this),
            PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(request, InteractionType.Popup);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest =
                await invokeAsync(
                    this.initializeAuthorizationCodeRequest.bind(this),
                    PerformanceEvents.StandardInteractionClientInitializeAuthorizationCodeRequest,
                    this.logger,
                    this.performanceClient,
                    this.correlationId
                )(validRequest, pkceCodes);

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

            const isPlatformBroker =
                NativeMessageHandler.isPlatformBrokerAvailable(
                    this.config,
                    this.logger,
                    this.nativeMessageHandler,
                    request.authenticationScheme
                );
            // Start measurement for server calls with native brokering enabled
            let fetchNativeAccountIdMeasurement;
            if (isPlatformBroker) {
                fetchNativeAccountIdMeasurement =
                    this.performanceClient.startMeasurement(
                        PerformanceEvents.FetchAccountIdWithNativeBroker,
                        request.correlationId
                    );
            }

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl({
                ...validRequest,
                platformBroker: isPlatformBroker,
            });

            const interactionHandler = new InteractionHandler(
                authClient,
                this.browserStorage,
                authCodeRequest,
                this.logger,
                this.performanceClient
            );

            const responseString = await (window.chrome || (window as any)['browser']).identity.launchWebAuthFlow({
                url: navigateUrl,
                interactive: true
            });

            const responseHash = responseString?.substring(responseString.indexOf("#") + 1);

            const serverParams = invoke(
                ResponseHandler.deserializeResponse,
                PerformanceEvents.DeserializeResponse,
                this.logger,
                this.performanceClient,
                this.correlationId
            )(
                responseHash || "",
                this.config.auth.OIDCOptions.serverResponseType,
                this.logger
            );
            // Remove throttle if it exists
            ThrottlingUtils.removeThrottle(
                this.browserStorage,
                this.config.auth.clientId,
                authCodeRequest
            );

            if (serverParams.accountId) {
                this.logger.verbose(
                    "Account id found in hash, calling WAM for token"
                );
                // end measurement for server call with native brokering enabled
                if (fetchNativeAccountIdMeasurement) {
                    fetchNativeAccountIdMeasurement.end({
                        success: true,
                        isNativeBroker: true,
                    });
                }

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
                    validRequest.correlationId
                );
                const { userRequestState } = ProtocolUtils.parseRequestState(
                    this.browserCrypto,
                    validRequest.state
                );
                return await nativeInteractionClient.acquireToken({
                    ...validRequest,
                    state: userRequestState,
                    prompt: undefined, // Server should handle the prompt, ideally native broker can do this part silently
                });
            }
            console.log(serverParams);
            debugger;
            // Handle response from hash string.
            const result = await interactionHandler.handleCodeResponse(
                serverParams,
                validRequest
            );

            return result;
        } catch (e) {
            // Close the synchronous popup if an error is thrown before the window unload event is registered

            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            throw e;
        }
    }

    /**
     *
     * @param validRequest
     * @param popupName
     * @param requestAuthority
     * @param popup
     * @param mainWindowRedirectUri
     * @param popupWindowAttributes
     */
    protected async logoutPopupAsync(
    ): Promise<void> {
        return Promise.reject("API not implemented");
    }

    /**
     * Opens a popup window with given request Url.
     * @param requestUrl
     */
    initiateAuthRequest(requestUrl: string): void {
        // Check that request url is not empty.
        if (requestUrl) {
            this.logger.infoPii(`Navigate to: ${requestUrl}`);
        } else {
            // Throw error if request URL is empty.
            this.logger.error("Navigate url is empty");
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.emptyNavigateUri
            );
        }
    }

    /**
     * Event callback to unload main window.
     */
    unloadWindow(e: Event): void {
        this.browserStorage.cleanRequestByInteractionType(
            InteractionType.Popup
        );
        if (this.currentWindow) {
            this.currentWindow.close();
        }
        // Guarantees browser unload will happen, so no other errors will be thrown.
        e.preventDefault();
    }
}
