/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger, ICrypto, StringUtils, PromptValue, AuthToken, Constants, ClientAuthError, AccountEntity, AuthorityType, ScopeSet, TimeUtils, AuthenticationScheme, PopTokenGenerator } from "@azure/msal-common";
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
import { WamResponse } from "../response/WamResponse";

export class WamInteractionClient extends BaseInteractionClient {
    protected provider: WamMessageHandler;

    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, provider: WamMessageHandler, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, correlationId);
        this.provider = provider;
    }

    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest): Promise<AuthenticationResult> {
        const wamRequest = this.initializeWamRequest(request);

        const messageBody: WamExtensionRequestBody = {
            method: WamExtensionMethod.GetToken,
            request: wamRequest
        };

        const reqTimestamp = TimeUtils.nowSeconds();
        const response: WamResponse = await this.provider.sendMessage(messageBody);
        return this.handleWamResponse(response, wamRequest, reqTimestamp);
    }

    logout(request?: EndSessionRequest): Promise<void> {
        return Promise.reject("Logout not implemented yet");
    }

    protected async handleWamResponse(response: WamResponse, request: WamRequest, reqTimestamp: number): Promise<AuthenticationResult> {
        // create an idToken object (not entity)
        const idTokenObj = new AuthToken(response.id_token || Constants.EMPTY_STRING, this.browserCrypto);
        if (idTokenObj.claims.nonce !== request.nonce) {
            throw ClientAuthError.createNonceMismatchError();
        }

        // Save account in browser storage
        const homeAccountIdentifier = AccountEntity.generateHomeAccountId(response.client_info || Constants.EMPTY_STRING, AuthorityType.Default, this.logger, this.browserCrypto, idTokenObj);
        const accountEntity = AccountEntity.createAccount(response.client_info, homeAccountIdentifier, idTokenObj, undefined, undefined, undefined, undefined, request.authority, response.account.id);
        this.browserStorage.setAccount(accountEntity);

        // If scopes not returned in server response, use request scopes
        const responseScopes = response.scopes ? ScopeSet.fromString(response.scopes) : new ScopeSet(request.scopes || []);

        // Sign Access Token if needed
        let accessToken = response.access_token;
        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator: PopTokenGenerator = new PopTokenGenerator(this.browserCrypto);
            accessToken = await popTokenGenerator.signPopToken(response.access_token, request);
        }

        const uid = response.account.properties["UID"] || idTokenObj.claims.oid || idTokenObj.claims.sub || Constants.EMPTY_STRING;
        const tid = response.account.properties["TenantId"] || idTokenObj.claims.tid || Constants.EMPTY_STRING;

        const result: AuthenticationResult = {
            authority: request.authority,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes.asArray(),
            account: accountEntity.getAccountInfo(),
            idToken: response.id_token,
            idTokenClaims: idTokenObj.claims,
            accessToken: accessToken,
            fromCache: false,
            expiresOn: new Date(Number(reqTimestamp + response.expires_in) * 1000),
            tokenType: request.authenticationScheme || AuthenticationScheme.BEARER,
            correlationId: this.correlationId,
            state: response.state
        };

        return result;
    }

    /**
     * Translates developer provided request object into WamRequest object
     * @param request 
     */
    protected initializeWamRequest(request: PopupRequest|SsoSilentRequest): WamRequest {
        this.logger.verbose("initializeAuthorizationRequest called");

        const validatedRequest: WamRequest = {
            ...this.initializeBaseRequest(request),
            clientId: this.config.auth.clientId,
            redirectUri: this.getRedirectUri(request.redirectUri),
            prompt: request.prompt || PromptValue.NONE,
            nonce: request.nonce || this.browserCrypto.createNewGuid(),
            extraParameters: {
                ...request.extraQueryParameters,
                ...request.tokenQueryParameters
            },
            extendedExpiryToken: false // Make this configurable?
        };

        const account = request.account || this.browserStorage.getActiveAccount();
        if (account) {
            validatedRequest.accountId = account.nativeAccountId;
            validatedRequest.loginHint = account.username;
        }

        // Check for ADAL/MSAL v1 SSO
        if (StringUtils.isEmpty(validatedRequest.loginHint)) {
            const loginHint = this.browserStorage.getLegacyLoginHint();
            if (loginHint) {
                validatedRequest.loginHint = loginHint;
            }
        }

        return validatedRequest;
    }
}
