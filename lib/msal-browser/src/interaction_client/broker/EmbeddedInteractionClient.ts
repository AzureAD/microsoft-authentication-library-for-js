/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardInteractionClient } from "../StandardInteractionClient";
import { AuthenticationResult, Logger, ICrypto, StringUtils, PromptValue, CommonSilentFlowRequest } from "@azure/msal-common";
import { EmbeddedClientApplication } from "../../broker/client/EmbeddedClientApplication";
import { BrokerClientApplication } from "../../broker/client/BrokerClientApplication";
import { ExperimentalBrowserConfiguration } from "../../config/ExperimentalConfiguration";
import { INavigationClient } from "../../navigation/INavigationClient";
import { EventHandler } from "../../event/EventHandler";
import { BrowserCacheManager } from "../../cache/BrowserCacheManager";
import { BrowserConfiguration } from "../../config/Configuration";
import { PopupRequest } from "../../request/PopupRequest";
import { InteractionType } from "../../utils/BrowserConstants";
import { SsoSilentRequest } from "../../request/SsoSilentRequest";
import { BrowserAuthError } from "../../error/BrowserAuthError";
import { AuthorizationUrlRequest } from "../../request/AuthorizationUrlRequest";
import { EventType } from "../../event/EventType";
import { BrokerAuthError } from "../../error/BrokerAuthError";

export class EmbeddedInteractionClient extends StandardInteractionClient {
    
    protected embeddedApp?: EmbeddedClientApplication;
    protected broker?: BrokerClientApplication;
    protected experimentalConfig: ExperimentalBrowserConfiguration;

    constructor(config: BrowserConfiguration, 
        storageImpl: BrowserCacheManager, 
        browserCrypto: ICrypto, 
        logger: Logger, 
        eventHandler: EventHandler, 
        navigationClient: INavigationClient, 
        experimentalConfig: ExperimentalBrowserConfiguration, 
        correlationId?: string, 
        embeddedApp?: EmbeddedClientApplication, 
        brokerApp?: BrokerClientApplication) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, correlationId);
        this.experimentalConfig = experimentalConfig;
        this.embeddedApp = embeddedApp;
        this.broker = brokerApp;
    }

    acquireToken(): Promise<AuthenticationResult|void> {
        throw new Error("Method not implemented.");
    }

    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        if (!this.embeddedApp) {
            throw BrokerAuthError.createNoEmbeddedAppError();
        }
        const validRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);
        return this.embeddedApp.sendPopupRequest(validRequest);
    }
    
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        if (!this.embeddedApp) {
            throw BrokerAuthError.createNoEmbeddedAppError();
        }
        if (StringUtils.isEmpty(request.loginHint) && StringUtils.isEmpty(request.sid) && (!request.account || StringUtils.isEmpty(request.account.username))) {
            this.logger.warning("No user hint provided. The authorization server may need more information to complete this request.");
        }
        // Check that prompt is set to none, throw error if it is set to anything else.
        if (request.prompt && request.prompt !== PromptValue.NONE) {
            throw BrowserAuthError.createSilentPromptValueError(request.prompt);
        }
        // Create silent request
        const silentRequest: AuthorizationUrlRequest = this.initializeAuthorizationRequest({
            ...request,
            prompt: PromptValue.NONE
        }, InteractionType.Silent);
        return this.embeddedApp.sendSsoSilentRequest(silentRequest);
    }

    async acquireTokenByBrokerRefresh(request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        if (!this.embeddedApp) {
            throw BrokerAuthError.createNoEmbeddedAppError();
        }
        const tokenRenewalResult = await this.embeddedApp.sendSilentRefreshRequest(request);
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
        return tokenRenewalResult;
    }

    logout(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
