/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger, ICrypto, StringUtils } from "@azure/msal-common";
import { BaseInteractionClient } from "./BaseInteractionClient";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { WamMessageHandler } from "../broker/wam/WamMessageHandler";
import { WamRequest } from "../request/WamRequest";
import { WamExtensionMethod } from "../utils/BrowserConstants";
import { WamExtensionRequestBody } from "../broker/wam/WamExtensionRequest";

export class WamInteractionClient extends BaseInteractionClient {
    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, correlationId);
    }

    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest): Promise<AuthenticationResult> {
        const provider = await WamMessageHandler.createProvider(this.logger);
        const wamRequest = this.initializeWamRequest(request);

        const messageBody: WamExtensionRequestBody = {
            ...wamRequest,
            method: WamExtensionMethod.GetToken
        };

        const response = await provider.sendMessage(messageBody);
        console.log(response);
        return Promise.reject("AcquireToken not implemented yet");
    }

    logout(request: EndSessionRequest): Promise<void> {
        return Promise.reject("Logout not implemented yet");
    }

    /**
     * Translates developer provided request object into WamRequest object
     * @param request 
     */
    protected initializeWamRequest(request: PopupRequest|SsoSilentRequest): WamRequest {
        this.logger.verbose("initializeAuthorizationRequest called");
        const redirectUri = this.getRedirectUri(request.redirectUri);

        const validatedRequest: WamRequest = {
            ...this.initializeBaseRequest(request),
            clientId: this.config.auth.clientId,
            redirectUri: redirectUri,
            nonce: request.nonce || this.browserCrypto.createNewGuid()
        };

        const account = request.account || this.browserStorage.getActiveAccount();
        if (account) {
            // TODO: Add WAM accountId
            validatedRequest.loginHint = account.username;
        }

        // Check for ADAL/MSAL v1 SSO
        if (StringUtils.isEmpty(validatedRequest.loginHint)) {
            const loginHint = this.getLegacyLoginHint();
            if (loginHint) {
                validatedRequest.loginHint = loginHint;
            }
        }

        return validatedRequest;
    }
}
