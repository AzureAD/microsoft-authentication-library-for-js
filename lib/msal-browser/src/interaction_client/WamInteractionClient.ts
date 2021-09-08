/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseInteractionClient } from "./BaseInteractionClient";
import { AuthenticationResult, Logger, ICrypto, ProtocolUtils, PersistentCacheKeys, IdToken, StringUtils } from "@azure/msal-common";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { WamMessageHandler } from "../broker/wam/WamMessageHandler";
import { WamRequest } from "../request/WamRequest";
import { BrowserStateObject } from "../utils/BrowserProtocolUtils";
import { InteractionType } from "../utils/BrowserConstants";

export class WamInteractionClient extends BaseInteractionClient {
    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, correlationId);
    }

    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest): Promise<AuthenticationResult> {
        const provider = await WamMessageHandler.createProvider(this.logger);
        const wamRequest = this.initializeWamRequest(request);
        return Promise.reject("AcquireToken not implemented yet");
    }

    logout(request: EndSessionRequest): Promise<void> {
        return Promise.reject("Logout not implemented yet");
    }

    protected initializeWamRequest(request: PopupRequest|SsoSilentRequest): WamRequest {
        this.logger.verbose("initializeAuthorizationRequest called");
        const redirectUri = this.getRedirectUri(request.redirectUri);
        const browserState: BrowserStateObject = {
            interactionType: InteractionType.Silent
        };

        const state = ProtocolUtils.setRequestState(
            this.browserCrypto,
            (request && request.state) || "",
            browserState
        );

        const validatedRequest: WamRequest = {
            ...this.initializeBaseRequest(request),
            clientId: this.config.auth.clientId,
            redirectUri: redirectUri,
            state: state,
            nonce: request.nonce || this.browserCrypto.createNewGuid()
        };

        // Check for ADAL SSO
        if (StringUtils.isEmpty(validatedRequest.loginHint)) {
            // Only check for adal token if no SSO params are being used
            const adalIdTokenString = this.browserStorage.getTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN);
            if (adalIdTokenString) {
                const adalIdToken = new IdToken(adalIdTokenString, this.browserCrypto);
                this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                if (adalIdToken.claims && adalIdToken.claims.preferred_username) {
                    this.logger.verbose("No SSO params used and ADAL token retrieved, setting ADAL preferred_username as loginHint");
                    validatedRequest.loginHint = adalIdToken.claims.preferred_username;
                }
                else if (adalIdToken.claims && adalIdToken.claims.upn) {
                    this.logger.verbose("No SSO params used and ADAL token retrieved, setting ADAL upn as loginHint");
                    validatedRequest.loginHint = adalIdToken.claims.upn;
                }
                else {
                    this.logger.verbose("No SSO params used and ADAL token retrieved, however, no account hint claim found. Enable preferred_username or upn id token claim to get SSO.");
                }
            }
        }

        return validatedRequest;
    }
}
