/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger, ICrypto, PromptValue, AuthToken, Constants, AccountEntity, AuthorityType, ScopeSet, TimeUtils, AuthenticationScheme, UrlString, OIDC_DEFAULT_SCOPES } from "@azure/msal-common";
import { BaseInteractionClient } from "./BaseInteractionClient";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { WamMessageHandler } from "../broker/wam/WamMessageHandler";
import { WamExtensionMethod } from "../utils/BrowserConstants";
import { WamExtensionRequestBody, WamTokenRequest } from "../broker/wam/WamRequest";
import { WamResponse } from "../broker/wam/WamResponse";
import { WamAuthError } from "../error/WamAuthError";

export class WamInteractionClient extends BaseInteractionClient {
    protected provider: WamMessageHandler;

    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, provider: WamMessageHandler, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, correlationId);
        this.provider = provider;
    }

    /**
     * Acquire token from WAM via browser extension
     * @param request 
     */
    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest): Promise<AuthenticationResult> {
        this.logger.trace("WamInteractionClient - acquireToken called.");
        const wamRequest = this.initializeWamRequest(request);

        const messageBody: WamExtensionRequestBody = {
            method: WamExtensionMethod.GetToken,
            request: wamRequest
        };

        const reqTimestamp = TimeUtils.nowSeconds();
        const response: object = await this.provider.sendMessage(messageBody);
        this.validateWamResponse(response);
        return this.handleWamResponse(response as WamResponse, wamRequest, reqTimestamp);
    }

    /**
     * Logout from WAM via browser extension
     * @param request 
     */
    logout(request?: EndSessionRequest): Promise<void> {
        this.logger.trace("WamInteractionClient - logout called.");
        return Promise.reject("Logout not implemented yet");
    }

    /**
     * Transform response from WAM into AuthenticationResult object which will be returned to the end user
     * @param response 
     * @param request 
     * @param reqTimestamp 
     */
    protected async handleWamResponse(response: WamResponse, request: WamTokenRequest, reqTimestamp: number): Promise<AuthenticationResult> {
        this.logger.trace("WamInteractionClient - handleWamResponse called.");
        // create an idToken object (not entity)
        const idTokenObj = new AuthToken(response.id_token || Constants.EMPTY_STRING, this.browserCrypto);

        // Save account in browser storage
        const homeAccountIdentifier = AccountEntity.generateHomeAccountId(response.client_info || Constants.EMPTY_STRING, AuthorityType.Default, this.logger, this.browserCrypto, idTokenObj);
        const accountEntity = AccountEntity.createAccount(response.client_info, homeAccountIdentifier, idTokenObj, undefined, undefined, undefined, undefined, request.authority, response.account.id);
        this.browserStorage.setAccount(accountEntity);

        // If scopes not returned in server response, use request scopes
        const responseScopes = response.scopes ? ScopeSet.fromString(response.scopes) : ScopeSet.fromString(request.scopes);

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
            accessToken: response.access_token,
            fromCache: false,
            expiresOn: new Date(Number(reqTimestamp + response.expires_in) * 1000),
            tokenType: AuthenticationScheme.BEARER,
            correlationId: this.correlationId,
            state: response.state
        };

        return result;
    }

    /**
     * Validates WAM response before processing
     * @param response 
     */
    private validateWamResponse(response: object): void {
        if (
            response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scopes") &&
            response.hasOwnProperty("expires_in")
        ) {
            return;
        } else {
            throw WamAuthError.createUnexpectedError("Response missing expected properties.");
        }
    }

    /**
     * Translates developer provided request object into WamRequest object
     * @param request 
     */
    protected initializeWamRequest(request: PopupRequest|SsoSilentRequest): WamTokenRequest {
        this.logger.trace("WamInteractionClient - initializeWamRequest called");

        const authority = request.authority || this.config.auth.authority;
        const canonicalAuthority = new UrlString(authority);
        canonicalAuthority.validateAsUri();
        
        const scopes = request && request.scopes || [];
        const scopeSet = new ScopeSet(scopes);
        scopeSet.appendScopes(OIDC_DEFAULT_SCOPES);

        const validatedRequest: WamTokenRequest = {
            ...request,
            clientId: this.config.auth.clientId,
            authority: canonicalAuthority.urlString,
            scopes: scopeSet.printScopes(),
            redirectUri: this.getRedirectUri(request.redirectUri),
            correlationId: this.correlationId,
            prompt: request.prompt || PromptValue.NONE,
            instanceAware: false,
            extraParameters: {
                ...request.extraQueryParameters,
                ...request.tokenQueryParameters
            },
            extendedExpiryToken: false // Make this configurable?
        };

        let account = request.account || this.browserStorage.getActiveAccount();
        if (!account && (request.loginHint || request.sid)) {
            account = this.browserStorage.getAccountInfoByHints(request.loginHint, request.sid);
        }

        if (account) {
            validatedRequest.accountId = account.nativeAccountId;
            if (!validatedRequest.accountId) {
                validatedRequest.sid = account.idTokenClaims && account.idTokenClaims["sid"];
                validatedRequest.loginHint = account.username;
            }
        } else {
            // Check for ADAL/MSAL v1 SSO
            const loginHint = this.browserStorage.getLegacyLoginHint();
            if (loginHint) {
                validatedRequest.loginHint = loginHint;
            }
        }

        return validatedRequest;
    }
}
