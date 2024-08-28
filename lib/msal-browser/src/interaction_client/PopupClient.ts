/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationCodeRequest,
    AuthorizationCodeClient,
    ThrottlingUtils,
    CommonEndSessionRequest,
    UrlString,
    AuthError,
    OIDC_DEFAULT_SCOPES,
    ProtocolUtils,
    PerformanceEvents,
    IPerformanceClient,
    Logger,
    ICrypto,
    ProtocolMode,
    ServerResponseType,
    invokeAsync,
    invoke,
} from "@azure/msal-common";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { EventType } from "../event/EventType";
import {
    InteractionType,
    ApiId,
    BrowserConstants,
} from "../utils/BrowserConstants";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { NavigationOptions } from "../navigation/NavigationOptions";
import * as BrowserUtils from "../utils/BrowserUtils";
import { PopupRequest } from "../request/PopupRequest";
import { NativeInteractionClient } from "./NativeInteractionClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { INavigationClient } from "../navigation/INavigationClient";
import { EventHandler } from "../event/EventHandler";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { BrowserConfiguration } from "../config/Configuration";
import { InteractionHandler } from "../interaction_handler/InteractionHandler";
import { PopupWindowAttributes } from "../request/PopupWindowAttributes";
import { EventError } from "../event/EventMessage";
import { AuthenticationResult } from "../response/AuthenticationResult";
import * as ResponseHandler from "../response/ResponseHandler";

export type PopupParams = {
    popup?: Window | null;
    popupName: string;
    popupWindowAttributes: PopupWindowAttributes;
};

export class PopupClient extends StandardInteractionClient {
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
     */
    acquireToken(request: PopupRequest): Promise<AuthenticationResult> {
        try {
            const popupName = this.generatePopupName(
                request.scopes || OIDC_DEFAULT_SCOPES,
                request.authority || this.config.auth.authority
            );
            const popupWindowAttributes = request.popupWindowAttributes || {};

            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true, acquiring token");
                // Passes on popup position and dimensions if in request
                return this.acquireTokenPopupAsync(
                    request,
                    popupName,
                    popupWindowAttributes
                );
            } else {
                // asyncPopups flag is set to false. Opens popup before acquiring token.
                this.logger.verbose(
                    "asyncPopup set to false, opening popup before acquiring token"
                );
                const popup = this.openSizedPopup(
                    "about:blank",
                    popupName,
                    popupWindowAttributes
                );
                return this.acquireTokenPopupAsync(
                    request,
                    popupName,
                    popupWindowAttributes,
                    popup
                );
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest
     */
    logout(logoutRequest?: EndSessionPopupRequest): Promise<void> {
        try {
            this.logger.verbose("logoutPopup called");
            const validLogoutRequest =
                this.initializeLogoutRequest(logoutRequest);

            const popupName = this.generateLogoutPopupName(validLogoutRequest);
            const authority = logoutRequest && logoutRequest.authority;
            const mainWindowRedirectUri =
                logoutRequest && logoutRequest.mainWindowRedirectUri;
            const popupWindowAttributes =
                logoutRequest?.popupWindowAttributes || {};

            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true");
                // Passes on popup position and dimensions if in request
                return this.logoutPopupAsync(
                    validLogoutRequest,
                    popupName,
                    popupWindowAttributes,
                    authority,
                    undefined,
                    mainWindowRedirectUri
                );
            } else {
                // asyncPopups flag is set to false. Opens popup before logging out.
                this.logger.verbose("asyncPopup set to false, opening popup");
                const popup = this.openSizedPopup(
                    "about:blank",
                    popupName,
                    popupWindowAttributes
                );
                return this.logoutPopupAsync(
                    validLogoutRequest,
                    popupName,
                    popupWindowAttributes,
                    authority,
                    popup,
                    mainWindowRedirectUri
                );
            }
        } catch (e) {
            // Since this function is synchronous we need to reject
            return Promise.reject(e);
        }
    }

    /**
     * Helper which obtains an access_token for your API via opening a popup window in the user's browser
     * @param validRequest
     * @param popupName
     * @param popup
     * @param popupWindowAttributes
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    protected async acquireTokenPopupAsync(
        request: PopupRequest,
        popupName: string,
        popupWindowAttributes: PopupWindowAttributes,
        popup?: Window | null
    ): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenPopupAsync called");
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

        BrowserUtils.preconnect(validRequest.authority);

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
            )(
                serverTelemetryManager,
                validRequest.authority,
                validRequest.azureCloudOptions,
                validRequest.account
            );

            const isNativeBroker = NativeMessageHandler.isNativeAvailable(
                this.config,
                this.logger,
                this.nativeMessageHandler,
                request.authenticationScheme
            );
            // Start measurement for server calls with native brokering enabled
            let fetchNativeAccountIdMeasurement;
            if (isNativeBroker) {
                fetchNativeAccountIdMeasurement =
                    this.performanceClient.startMeasurement(
                        PerformanceEvents.FetchAccountIdWithNativeBroker,
                        request.correlationId
                    );
            }

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl({
                ...validRequest,
                nativeBroker: isNativeBroker,
            });

            // Create popup interaction handler.
            const interactionHandler = new InteractionHandler(
                authClient,
                this.browserStorage,
                authCodeRequest,
                this.logger,
                this.performanceClient
            );

            // Show the UI once the url has been created. Get the window handle for the popup.
            const popupParameters: PopupParams = {
                popup,
                popupName,
                popupWindowAttributes,
            };
            const popupWindow: Window = this.initiateAuthRequest(
                navigateUrl,
                popupParameters
            );
            this.eventHandler.emitEvent(
                EventType.POPUP_OPENED,
                InteractionType.Popup,
                { popupWindow },
                null
            );

            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const responseString = await this.monitorPopupForHash(popupWindow);

            const serverParams = invoke(
                ResponseHandler.deserializeResponse,
                PerformanceEvents.DeserializeResponse,
                this.logger,
                this.performanceClient,
                this.correlationId
            )(
                responseString,
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

            // Handle response from hash string.
            const result = await interactionHandler.handleCodeResponse(
                serverParams,
                validRequest
            );

            return result;
        } catch (e) {
            if (popup) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                popup.close();
            }

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
        validRequest: CommonEndSessionRequest,
        popupName: string,
        popupWindowAttributes: PopupWindowAttributes,
        requestAuthority?: string,
        popup?: Window | null,
        mainWindowRedirectUri?: string
    ): Promise<void> {
        this.logger.verbose("logoutPopupAsync called");
        this.eventHandler.emitEvent(
            EventType.LOGOUT_START,
            InteractionType.Popup,
            validRequest
        );

        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.logoutPopup
        );

        try {
            // Clear cache on logout
            await this.clearCacheOnLogout(validRequest.account);

            // Initialize the client
            const authClient = await invokeAsync(
                this.createAuthCodeClient.bind(this),
                PerformanceEvents.StandardInteractionClientCreateAuthCodeClient,
                this.logger,
                this.performanceClient,
                this.correlationId
            )(
                serverTelemetryManager,
                requestAuthority,
                undefined, // AzureCloudOptions
                validRequest.account || undefined
            );

            try {
                authClient.authority.endSessionEndpoint;
            } catch {
                if (
                    validRequest.account?.homeAccountId &&
                    validRequest.postLogoutRedirectUri &&
                    authClient.authority.protocolMode === ProtocolMode.OIDC
                ) {
                    void this.browserStorage.removeAccount(
                        validRequest.account?.homeAccountId
                    );

                    this.eventHandler.emitEvent(
                        EventType.LOGOUT_SUCCESS,
                        InteractionType.Popup,
                        validRequest
                    );

                    if (mainWindowRedirectUri) {
                        const navigationOptions: NavigationOptions = {
                            apiId: ApiId.logoutPopup,
                            timeout:
                                this.config.system.redirectNavigationTimeout,
                            noHistory: false,
                        };
                        const absoluteUrl = UrlString.getAbsoluteUrl(
                            mainWindowRedirectUri,
                            BrowserUtils.getCurrentUri()
                        );
                        await this.navigationClient.navigateInternal(
                            absoluteUrl,
                            navigationOptions
                        );
                    }

                    if (popup) {
                        popup.close();
                    }

                    return;
                }
            }

            // Create logout string and navigate user window to logout.
            const logoutUri: string = authClient.getLogoutUri(validRequest);

            this.eventHandler.emitEvent(
                EventType.LOGOUT_SUCCESS,
                InteractionType.Popup,
                validRequest
            );

            // Open the popup window to requestUrl.
            const popupWindow = this.openPopup(logoutUri, {
                popupName,
                popupWindowAttributes,
                popup,
            });
            this.eventHandler.emitEvent(
                EventType.POPUP_OPENED,
                InteractionType.Popup,
                { popupWindow },
                null
            );

            await this.monitorPopupForHash(popupWindow).catch(() => {
                // Swallow any errors related to monitoring the window. Server logout is best effort
            });

            if (mainWindowRedirectUri) {
                const navigationOptions: NavigationOptions = {
                    apiId: ApiId.logoutPopup,
                    timeout: this.config.system.redirectNavigationTimeout,
                    noHistory: false,
                };
                const absoluteUrl = UrlString.getAbsoluteUrl(
                    mainWindowRedirectUri,
                    BrowserUtils.getCurrentUri()
                );

                this.logger.verbose(
                    "Redirecting main window to url specified in the request"
                );
                this.logger.verbosePii(
                    `Redirecting main window to: ${absoluteUrl}`
                );
                await this.navigationClient.navigateInternal(
                    absoluteUrl,
                    navigationOptions
                );
            } else {
                this.logger.verbose("No main window navigation requested");
            }
        } catch (e) {
            if (popup) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                popup.close();
            }

            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            this.browserStorage.setInteractionInProgress(false);
            this.eventHandler.emitEvent(
                EventType.LOGOUT_FAILURE,
                InteractionType.Popup,
                null,
                e as EventError
            );
            this.eventHandler.emitEvent(
                EventType.LOGOUT_END,
                InteractionType.Popup
            );
            throw e;
        }

        this.eventHandler.emitEvent(
            EventType.LOGOUT_END,
            InteractionType.Popup
        );
    }

    /**
     * Opens a popup window with given request Url.
     * @param requestUrl
     */
    initiateAuthRequest(requestUrl: string, params: PopupParams): Window {
        // Check that request url is not empty.
        if (requestUrl) {
            this.logger.infoPii(`Navigate to: ${requestUrl}`);
            // Open the popup window to requestUrl.
            return this.openPopup(requestUrl, params);
        } else {
            // Throw error if request URL is empty.
            this.logger.error("Navigate url is empty");
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.emptyNavigateUri
            );
        }
    }

    /**
     * Monitors a window until it loads a url with the same origin.
     * @param popupWindow - window that is being monitored
     * @param timeout - timeout for processing hash once popup is redirected back to application
     */
    monitorPopupForHash(popupWindow: Window): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.logger.verbose(
                "PopupHandler.monitorPopupForHash - polling started"
            );

            const intervalId = setInterval(() => {
                // Window is closed
                if (popupWindow.closed) {
                    this.logger.error(
                        "PopupHandler.monitorPopupForHash - window closed"
                    );
                    clearInterval(intervalId);
                    reject(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.userCancelled
                        )
                    );
                    return;
                }

                let href = "";
                try {
                    /*
                     * Will throw if cross origin,
                     * which should be caught and ignored
                     * since we need the interval to keep running while on STS UI.
                     */
                    href = popupWindow.location.href;
                } catch (e) {}

                // Don't process blank pages or cross domain
                if (!href || href === "about:blank") {
                    return;
                }
                clearInterval(intervalId);

                let responseString = "";
                const responseType =
                    this.config.auth.OIDCOptions.serverResponseType;
                if (popupWindow) {
                    if (responseType === ServerResponseType.QUERY) {
                        responseString = popupWindow.location.search;
                    } else {
                        responseString = popupWindow.location.hash;
                    }
                }

                this.logger.verbose(
                    "PopupHandler.monitorPopupForHash - popup window is on same origin as caller"
                );

                resolve(responseString);
            }, this.config.system.pollIntervalMilliseconds);
        }).finally(() => {
            this.cleanPopup(popupWindow);
        });
    }

    /**
     * @hidden
     *
     * Configures popup window for login.
     *
     * @param urlNavigate
     * @param title
     * @param popUpWidth
     * @param popUpHeight
     * @param popupWindowAttributes
     * @ignore
     * @hidden
     */
    openPopup(urlNavigate: string, popupParams: PopupParams): Window {
        try {
            let popupWindow;
            // Popup window passed in, setting url to navigate to
            if (popupParams.popup) {
                popupWindow = popupParams.popup;
                this.logger.verbosePii(
                    `Navigating popup window to: ${urlNavigate}`
                );
                popupWindow.location.assign(urlNavigate);
            } else if (typeof popupParams.popup === "undefined") {
                // Popup will be undefined if it was not passed in
                this.logger.verbosePii(
                    `Opening popup window to: ${urlNavigate}`
                );
                popupWindow = this.openSizedPopup(
                    urlNavigate,
                    popupParams.popupName,
                    popupParams.popupWindowAttributes
                );
            }

            // Popup will be null if popups are blocked
            if (!popupWindow) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.emptyWindowError
                );
            }
            if (popupWindow.focus) {
                popupWindow.focus();
            }
            this.currentWindow = popupWindow;
            window.addEventListener("beforeunload", this.unloadWindow);

            return popupWindow;
        } catch (e) {
            this.logger.error(
                "error opening popup " + (e as AuthError).message
            );
            this.browserStorage.setInteractionInProgress(false);
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.popupWindowError
            );
        }
    }

    /**
     * Helper function to set popup window dimensions and position
     * @param urlNavigate
     * @param popupName
     * @param popupWindowAttributes
     * @returns
     */
    openSizedPopup(
        urlNavigate: string,
        popupName: string,
        popupWindowAttributes: PopupWindowAttributes
    ): Window | null {
        /**
         * adding winLeft and winTop to account for dual monitor
         * using screenLeft and screenTop for IE8 and earlier
         */
        const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
        const winTop = window.screenTop ? window.screenTop : window.screenY;
        /**
         * window.innerWidth displays browser window"s height and width excluding toolbars
         * using document.documentElement.clientWidth for IE8 and earlier
         */
        const winWidth =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
        const winHeight =
            window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight;

        let width = popupWindowAttributes.popupSize?.width;
        let height = popupWindowAttributes.popupSize?.height;
        let top = popupWindowAttributes.popupPosition?.top;
        let left = popupWindowAttributes.popupPosition?.left;

        if (!width || width < 0 || width > winWidth) {
            this.logger.verbose(
                "Default popup window width used. Window width not configured or invalid."
            );
            width = BrowserConstants.POPUP_WIDTH;
        }

        if (!height || height < 0 || height > winHeight) {
            this.logger.verbose(
                "Default popup window height used. Window height not configured or invalid."
            );
            height = BrowserConstants.POPUP_HEIGHT;
        }

        if (!top || top < 0 || top > winHeight) {
            this.logger.verbose(
                "Default popup window top position used. Window top not configured or invalid."
            );
            top = Math.max(
                0,
                winHeight / 2 - BrowserConstants.POPUP_HEIGHT / 2 + winTop
            );
        }

        if (!left || left < 0 || left > winWidth) {
            this.logger.verbose(
                "Default popup window left position used. Window left not configured or invalid."
            );
            left = Math.max(
                0,
                winWidth / 2 - BrowserConstants.POPUP_WIDTH / 2 + winLeft
            );
        }

        return window.open(
            urlNavigate,
            popupName,
            `width=${width}, height=${height}, top=${top}, left=${left}, scrollbars=yes`
        );
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

    /**
     * Closes popup, removes any state vars created during popup calls.
     * @param popupWindow
     */
    cleanPopup(popupWindow?: Window): void {
        if (popupWindow) {
            // Close window.
            popupWindow.close();
        }
        // Remove window unload function
        window.removeEventListener("beforeunload", this.unloadWindow);

        // Interaction is completed - remove interaction status.
        this.browserStorage.setInteractionInProgress(false);
    }

    /**
     * Generates the name for the popup based on the client id and request
     * @param clientId
     * @param request
     */
    generatePopupName(scopes: Array<string>, authority: string): string {
        return `${BrowserConstants.POPUP_NAME_PREFIX}.${
            this.config.auth.clientId
        }.${scopes.join("-")}.${authority}.${this.correlationId}`;
    }

    /**
     * Generates the name for the popup based on the client id and request for logouts
     * @param clientId
     * @param request
     */
    generateLogoutPopupName(request: CommonEndSessionRequest): string {
        const homeAccountId = request.account && request.account.homeAccountId;
        return `${BrowserConstants.POPUP_NAME_PREFIX}.${this.config.auth.clientId}.${homeAccountId}.${this.correlationId}`;
    }
}
