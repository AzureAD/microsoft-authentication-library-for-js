/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, CommonAuthorizationCodeRequest, AuthorizationCodeClient, ThrottlingUtils, CommonEndSessionRequest, AccountEntity, UrlString, AuthError } from "@azure/msal-common";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { PopupUtils } from "../utils/PopupUtils";
import { EventType } from "../event/EventType";
import { InteractionType, ApiId, TemporaryCacheKeys, BrowserConstants } from "../utils/BrowserConstants";
import { PopupHandler, PopupParams } from "../interaction_handler/PopupHandler";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { BrowserUtils } from "../utils/BrowserUtils";
import { PopupRequest } from "../request/PopupRequest";

export class PopupClient extends StandardInteractionClient {
    /**
     * Acquires tokens by opening a popup window to the /authorize endpoint of the authority
     * @param request 
     */
    acquireToken(request: PopupRequest): Promise<AuthenticationResult> {
        try {
            const validRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);
            const popupName = PopupUtils.generatePopupName(this.config.auth.clientId, validRequest);

            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true, acquiring token");
                return this.acquireTokenPopupAsync(validRequest, popupName);
            } else {
                // asyncPopups flag is set to false. Opens popup before acquiring token.
                this.logger.verbose("asyncPopup set to false, opening popup before acquiring token");
                const popup = PopupUtils.openSizedPopup("about:blank", popupName);
                return this.acquireTokenPopupAsync(validRequest, popupName, popup);
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
            const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);

            const popupName = PopupUtils.generateLogoutPopupName(this.config.auth.clientId, validLogoutRequest);
            let popup;

            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true");
            } else {
                // asyncPopups flag is set to false. Opens popup before logging out.
                this.logger.verbose("asyncPopup set to false, opening popup");
                popup = PopupUtils.openSizedPopup("about:blank", popupName);
            }

            const authority = logoutRequest && logoutRequest.authority;
            const mainWindowRedirectUri = logoutRequest && logoutRequest.mainWindowRedirectUri;
            return this.logoutPopupAsync(validLogoutRequest, popupName, authority, popup, mainWindowRedirectUri);
        } catch (e) {
            // Since this function is synchronous we need to reject
            return Promise.reject(e);
        }
    }

    /**
     * Helper which obtains an access_token for your API via opening a popup window in the user's browser
     * @param popupName
     * @param popup
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    private async acquireTokenPopupAsync(validRequest: AuthorizationUrlRequest, popupName: string, popup?: Window|null): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenPopupAsync called");
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenPopup);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority);
            this.logger.verbose("Auth code client created");

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            // Create popup interaction handler.
            const interactionHandler = new PopupHandler(authClient, this.browserStorage, authCodeRequest, this.logger);

            // Show the UI once the url has been created. Get the window handle for the popup.
            const popupParameters: PopupParams = {
                popup,
                popupName
            };
            const popupWindow: Window = interactionHandler.initiateAuthRequest(navigateUrl, popupParameters);
            this.eventHandler.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, {popupWindow}, null);

            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const hash = await interactionHandler.monitorPopupForHash(popupWindow);
            const state = this.validateAndExtractStateFromHash(hash, InteractionType.Popup, validRequest.correlationId);

            // Remove throttle if it exists
            ThrottlingUtils.removeThrottle(this.browserStorage, this.config.auth.clientId, authCodeRequest.authority, authCodeRequest.scopes);

            // Handle response from hash string.
            const result = await interactionHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient);

            return result;
        } catch (e) {            
            if (popup) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                popup.close();
            }

            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
            }

            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(validRequest.state);
            throw e;
        }
    }

    /**
     * 
     * @param request 
     * @param popupName 
     * @param requestAuthority
     * @param popup 
     */
    private async logoutPopupAsync(validRequest: CommonEndSessionRequest, popupName: string, requestAuthority?: string, popup?: Window|null, mainWindowRedirectUri?: string): Promise<void> {
        this.logger.verbose("logoutPopupAsync called");
        this.eventHandler.emitEvent(EventType.LOGOUT_START, InteractionType.Popup, validRequest);

        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logoutPopup);
        
        try {
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            // Initialize the client
            const authClient = await this.createAuthCodeClient(serverTelemetryManager, requestAuthority);
            this.logger.verbose("Auth code client created");

            // Create logout string and navigate user window to logout.
            const logoutUri: string = authClient.getLogoutUri(validRequest);

            // Clear cache on logout
            await authClient.clearCacheOnLogout(validRequest);
            
            if (!validRequest.account || AccountEntity.accountInfoIsEqual(validRequest.account, this.browserStorage.getActiveAccount(), false)) {
                this.logger.verbose("Setting active account to null");
                this.browserStorage.setActiveAccount(null);
            }

            this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Popup, validRequest);

            const popupUtils = new PopupUtils(this.browserStorage, this.logger);
            // Open the popup window to requestUrl.
            const popupWindow = popupUtils.openPopup(logoutUri, popupName, popup);
            this.eventHandler.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, {popupWindow}, null);

            try {
                // Don't care if this throws an error (User Cancelled)
                await popupUtils.monitorPopupForSameOrigin(popupWindow);
                this.logger.verbose("Popup successfully redirected to postLogoutRedirectUri");
            } catch (e) {
                this.logger.verbose(`Error occurred while monitoring popup for same origin. Session on server may remain active. Error: ${e}`);
            }

            popupUtils.cleanPopup(popupWindow);

            if (mainWindowRedirectUri) {
                const navigationOptions: NavigationOptions = {
                    apiId: ApiId.logoutPopup,
                    timeout: this.config.system.redirectNavigationTimeout,
                    noHistory: false
                };
                const absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, BrowserUtils.getCurrentUri());

                this.logger.verbose("Redirecting main window to url specified in the request");
                this.logger.verbosePii(`Redirecing main window to: ${absoluteUrl}`);
                this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
            } else {
                this.logger.verbose("No main window navigation requested");
            }

        } catch (e) {
            if (popup) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                popup.close();
            }

            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
            }
            
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
            this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Popup, null, e);
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }

        this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Popup);
    }
}
